import { prisma } from "@/lib/server/db";
import { withErrorHandler } from "@/lib/server/http";

// Internal endpoint for cloud scheduler (Vercel Cron, cloud scheduler, etc.)
// Secured by CRON_SECRET environment variable.

const ACTIVE_STATUSES = [
  "SUBMITTED", "APPROVED", "QUOTING", "AWAITING_FUNDING",
  "FUNDED", "ASSIGNED", "SCHEDULING_PENDING", "IN_PROGRESS", "BLOCKED",
];

export const POST = withErrorHandler(async (req: Request) => {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const now = new Date();
  let escalated = 0;
  let alreadyEscalated = 0;

  // Completion deadline breaches
  const breached = await prisma.serviceRequest.findMany({
    where: {
      srStatus: { in: ACTIVE_STATUSES as never[] },
      dueAt: { lt: now },
      slaPolicyId: { not: null },
    },
    include: { escalations: { where: { resolvedAt: null } } },
  });

  for (const sr of breached) {
    if (sr.escalations.length > 0) { alreadyEscalated++; continue; }
    await prisma.$transaction(async (tx) => {
      await tx.serviceRequestEscalation.create({
        data: {
          serviceRequestId: sr.id,
          escalatedBy: "system",
          escalatedTo: "manager",
          reason: `SLA completion breach: due at ${sr.dueAt?.toISOString()}, still ${sr.srStatus}.`,
        },
      });
      await tx.outboxEvent.create({
        data: {
          eventType: "request.sla_breached",
          payload: { serviceRequestId: sr.id, breachType: "completion", dueAt: sr.dueAt?.toISOString(), breachedAt: now.toISOString() },
          serviceRequestId: sr.id,
        },
      });
    });
    escalated++;
  }

  // Response deadline breaches
  const policies = await prisma.slaPolicy.findMany();
  for (const policy of policies) {
    const cutoff = new Date(now.getTime() - policy.responseDeadlineMinutes * 60 * 1000);
    const noResponse = await prisma.serviceRequest.findMany({
      where: { srStatus: "SUBMITTED", slaPolicyId: policy.id, createdAt: { lt: cutoff } },
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
