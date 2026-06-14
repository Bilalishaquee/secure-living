import { SrStatus } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { withErrorHandler } from "@/lib/server/http";

// Internal endpoint for cloud scheduler (Vercel Cron, cloud scheduler, etc.)
// Secured by CRON_SECRET environment variable.

const ACTIVE_STATUSES: SrStatus[] = [
  SrStatus.SUBMITTED, SrStatus.APPROVED, SrStatus.QUOTING, SrStatus.AWAITING_FUNDING,
  SrStatus.FUNDED, SrStatus.ASSIGNED, SrStatus.SCHEDULING_PENDING, SrStatus.IN_PROGRESS, SrStatus.BLOCKED,
];

export const POST = withErrorHandler(async (req: Request) => {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const now = new Date();
  let escalated = 0;
  let alreadyEscalated = 0;

  // Pre-fetch all SLA policies so we can look them up without a join
  const allPolicies = await prisma.slaPolicy.findMany();
  const policyById = new Map(allPolicies.map((p) => [p.id, p]));

  // Phase 3: Completion deadline breaches \u2014 subtract blocked duration from SLA calculations
  const breached = await prisma.serviceRequest.findMany({
    where: {
      srStatus: { in: ACTIVE_STATUSES },
      dueAt: { lt: now },
      slaPolicyId: { not: null },
    },
    include: {
      escalations: { where: { resolvedAt: null } },
    },
  });

  for (const sr of breached) {
    if (sr.escalations.length > 0) { alreadyEscalated++; continue; }

    // Phase 3: Calculate effective elapsed time, excluding BLOCKED duration
    const createdAt = new Date(sr.createdAt).getTime();
    const elapsedMs = now.getTime() - createdAt;
    const blockedMs = (sr.blockedDurationSec ?? 0) * 1000;
    const effectiveElapsedMs = elapsedMs - blockedMs;

    // Check if escalation threshold has been reached after accounting for blocked time
    const policy = sr.slaPolicyId ? policyById.get(sr.slaPolicyId) : null;
    if (policy && policy.escalationAfterMinutes) {
      const escalationThresholdMs = policy.escalationAfterMinutes * 60 * 1000;
      if (effectiveElapsedMs < escalationThresholdMs) {
        // Not yet past the escalation threshold
        continue;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.serviceRequestEscalation.create({
        data: {
          serviceRequestId: sr.id,
          escalatedBy: "system",
          escalatedTo: "manager",
          reason: `SLA completion breach: due at ${sr.dueAt?.toISOString()}, blocked for ${sr.blockedDurationSec ?? 0}s, still ${sr.srStatus}.`,
        },
      });
      await tx.outboxEvent.create({
        data: {
          eventType: "request.sla_breached",
          payload: {
            serviceRequestId: sr.id,
            breachType: "completion",
            dueAt: sr.dueAt?.toISOString(),
            breachedAt: now.toISOString(),
            blockedDurationSec: sr.blockedDurationSec ?? 0,
            effectiveElapsedMs,
          },
          serviceRequestId: sr.id,
        },
      });
    });
    escalated++;
  }

  // Phase 3: Response deadline breaches \u2014 check from SUBMITTED status
  const policies = await prisma.slaPolicy.findMany();
  for (const policy of policies) {
    const cutoff = new Date(now.getTime() - policy.responseDeadlineMinutes * 60 * 1000);
    const noResponse = await prisma.serviceRequest.findMany({
      where: { srStatus: SrStatus.SUBMITTED, slaPolicyId: policy.id, createdAt: { lt: cutoff } },
      include: { escalations: { where: { resolvedAt: null } } },
    });
    for (const sr of noResponse) {
      if (sr.escalations.length > 0) { alreadyEscalated++; continue; }
      await prisma.$transaction(async (tx) => {
        await tx.serviceRequestEscalation.create({
          data: {
            serviceRequestId: sr.id,
            escalatedBy: "system",
            escalatedTo: "manager",
            reason: `SLA response breach: no action within ${policy.responseDeadlineMinutes} min of submission.`,
          },
        });
        await tx.outboxEvent.create({
          data: {
            eventType: "request.sla_breached",
            payload: { serviceRequestId: sr.id, breachType: "response", policyId: policy.id, breachedAt: now.toISOString() },
            serviceRequestId: sr.id,
          },
        });
      });
      escalated++;
    }
  }

  return Response.json({ ok: true, escalated, alreadyEscalated, runAt: now.toISOString() });
});
