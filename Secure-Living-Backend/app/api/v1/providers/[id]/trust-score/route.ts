import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

/**
 * Phase 3 — Provider Trust Score Computation
 *
 * Recalculates the composite trust score for a provider based on:
 * - SLA compliance percentage
 * - Dispute rate (percentage of completed jobs disputed)
 * - Cancellation rate
 * - Completion rate
 *
 * Trust score formula (0-100):
 *   SLA (40%) + Completion rate (25%) + No-dispute bonus (20%) + No-cancel bonus (15%)
 *
 * Updates ServiceProvider.trustScore and ServiceProviderPerformance metrics.
 */
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const provider = await prisma.serviceProvider.findUnique({ where: { id: params.id } });
  if (!provider) return jsonError(404, "Provider not found");

  // Fetch all assignments for this provider via their userId
  const assignments = await prisma.serviceRequestAssignment.findMany({
    where: { assignedTo: provider.userId },
    include: { serviceRequest: true },
  });

  const totalAssigned = assignments.length;
  if (totalAssigned === 0) {
    return Response.json({
      data: {
        providerId: params.id,
        trustScore: 0,
        breakdown: { slaCompliance: 0, disputeRate: 0, cancellationRate: 0, completionRate: 0 },
        totalAssigned: 0,
        message: "No assignments yet — trust score cannot be computed.",
      },
    });
  }

  const completedAssignments = assignments.filter(
    (a) => a.serviceRequest.srStatus === "COMPLETED" || a.serviceRequest.srStatus === "DISPUTED"
  );
  const disputedAssignments = assignments.filter(
    (a) => a.serviceRequest.srStatus === "DISPUTED"
  );
  const cancelledAssignments = assignments.filter(
    (a) => a.serviceRequest.srStatus === "CANCELLED"
  );

  // SLA compliance: percentage of completed jobs that met the dueAt deadline
  let slaCompliant = 0;
  let slaCount = 0;
  let totalResponseSec = 0;
  let totalCompletionSec = 0;
  for (const a of completedAssignments) {
    const sr = a.serviceRequest;
    if (sr.startedAt && sr.createdAt) {
      totalResponseSec += (new Date(sr.startedAt).getTime() - new Date(sr.createdAt).getTime()) / 1000;
    }
    if (sr.resolvedAt && sr.startedAt) {
      totalCompletionSec += (new Date(sr.resolvedAt).getTime() - new Date(sr.startedAt).getTime()) / 1000;
    }
    if (sr.dueAt && sr.resolvedAt) {
      slaCount++;
      if (new Date(sr.resolvedAt) <= new Date(sr.dueAt)) {
        slaCompliant++;
      }
    }
  }
  const slaScore = slaCount > 0 ? (slaCompliant / slaCount) * 100 : 80;

  // Rates
  const completedCount = completedAssignments.length;
  const disputeRate = completedCount > 0 ? disputedAssignments.length / completedCount : 0;
  const cancellationRate = totalAssigned > 0 ? cancelledAssignments.length / totalAssigned : 0;
  const completionRate = totalAssigned > 0 ? completedCount / totalAssigned : 0;
  const avgResponseTimeSec = completedCount > 0 ? totalResponseSec / completedCount : 0;
  const avgCompletionTimeSec = completedCount > 0 ? totalCompletionSec / completedCount : 0;

  // Composite trust score (0-100)
  const trustScore = Math.round(
    (slaScore * 0.4) +
    (completionRate * 100 * 0.25) +
    ((1 - disputeRate) * 100 * 0.20) +
    ((1 - cancellationRate) * 100 * 0.15)
  );
  const boundedScore = Math.max(0, Math.min(100, trustScore));

  // Update ServiceProvider trustScore
  await prisma.serviceProvider.update({
    where: { id: params.id },
    data: { trustScore: boundedScore },
  });

  // Update ServiceProviderPerformance metrics
  const performance = await prisma.serviceProviderPerformance.findFirst({
    where: { providerId: params.id },
  });

  if (performance) {
    await prisma.serviceProviderPerformance.update({
      where: { id: performance.id },
      data: {
        responseTimeSec: avgResponseTimeSec,
        completionTimeSec: avgCompletionTimeSec,
        disputeRate,
        cancellationRate,
        totalJobsCompleted: completedCount,
      },
    });
  } else {
    await prisma.serviceProviderPerformance.create({
      data: {
        id: randomUUID(),
        providerId: params.id,
        responseTimeSec: avgResponseTimeSec,
        completionTimeSec: avgCompletionTimeSec,
        disputeRate,
        cancellationRate,
        totalJobsCompleted: completedCount,
      },
    });
  }

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "provider.trust_score_recalculated",
    resourceType: "service_provider",
    resourceId: params.id,
    orgId: provider.organizationId,
    afterJson: { trustScore: boundedScore, slaScore, completionRate, disputeRate, cancellationRate, totalAssigned },
  });

  return Response.json({
    data: {
      providerId: params.id,
      trustScore: boundedScore,
      breakdown: {
        slaCompliance: Math.round(slaScore),
        completionRate: Math.round(completionRate * 100),
        disputeRate: Math.round(disputeRate * 1000) / 10,
        cancellationRate: Math.round(cancellationRate * 1000) / 10,
      },
      totalAssigned,
      completed: completedCount,
      disputed: disputedAssignments.length,
      cancelled: cancelledAssignments.length,
      avgResponseTimeSec: Math.round(avgResponseTimeSec),
      avgCompletionTimeSec: Math.round(avgCompletionTimeSec),
    },
  });
});