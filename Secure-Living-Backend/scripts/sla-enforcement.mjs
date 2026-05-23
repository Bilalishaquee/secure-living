/**
 * SLA Enforcement Job
 *
 * Detects service requests that have breached their SLA response or completion
 * deadlines, auto-escalates them, and writes `request.sla_breached` outbox events.
 *
 * Run periodically via cron or a scheduled API call:
 *   node scripts/sla-enforcement.mjs
 *
 * The same logic is also exposed at POST /api/v1/internal/run-sla-enforcement
 * so it can be triggered from a cron service like Vercel Cron or a cloud scheduler.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ACTIVE_STATUSES = [
  "SUBMITTED",
  "APPROVED",
  "QUOTING",
  "AWAITING_FUNDING",
  "FUNDED",
  "ASSIGNED",
  "SCHEDULING_PENDING",
  "IN_PROGRESS",
  "BLOCKED",
];

async function main() {
  const now = new Date();
  console.log(`SLA enforcement run at ${now.toISOString()}`);

  // Find active SRs that have a slaPolicyId and a dueAt in the past
  const breached = await prisma.serviceRequest.findMany({
    where: {
      srStatus: { in: ACTIVE_STATUSES },
      dueAt: { lt: now },
      slaPolicyId: { not: null },
    },
    include: {
      slaPolicy: true,
      escalations: {
        where: { resolvedAt: null },
      },
    },
  });

  console.log(`Found ${breached.length} SLA-breached requests.`);

  let escalated = 0;
  let alreadyEscalated = 0;
  let errors = 0;

  for (const sr of breached) {
    // Skip if there is already an open escalation to avoid duplicate escalations
    if (sr.escalations.length > 0) {
      alreadyEscalated++;
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Create escalation record
        await tx.serviceRequestEscalation.create({
          data: {
            serviceRequestId: sr.id,
            escalatedBy: "system",
            escalatedTo: "manager",
            reason: `SLA breach: request was due at ${sr.dueAt?.toISOString() ?? "unknown"} but is still in status ${sr.srStatus}.`,
          },
        });

        // Write outbox event
        await tx.outboxEvent.create({
          data: {
            eventType: "request.sla_breached",
            payload: {
              serviceRequestId: sr.id,
              srStatus: sr.srStatus,
              dueAt: sr.dueAt?.toISOString(),
              slaPolicyId: sr.slaPolicyId,
              breachedAt: now.toISOString(),
            },
            serviceRequestId: sr.id,
          },
        });
      });

      escalated++;
      console.log(`  Escalated: ${sr.id} (${sr.srStatus}, due ${sr.dueAt?.toISOString()})`);
    } catch (err) {
      errors++;
      console.warn(`  Error escalating ${sr.id}: ${err.message}`);
    }
  }

  // Also check response deadline: requests sitting in SUBMITTED for too long
  const slaPolicies = await prisma.slaPolicy.findMany();
  for (const policy of slaPolicies) {
    const responseDeadlineMs = policy.responseDeadlineMinutes * 60 * 1000;
    const cutoff = new Date(now.getTime() - responseDeadlineMs);

    const noResponse = await prisma.serviceRequest.findMany({
      where: {
        srStatus: "SUBMITTED",
        slaPolicyId: policy.id,
        createdAt: { lt: cutoff },
      },
      include: {
        escalations: { where: { resolvedAt: null } },
      },
    });

    for (const sr of noResponse) {
      if (sr.escalations.length > 0) { alreadyEscalated++; continue; }
      try {
        await prisma.$transaction(async (tx) => {
          await tx.serviceRequestEscalation.create({
            data: {
              serviceRequestId: sr.id,
              escalatedBy: "system",
              escalatedTo: "manager",
              reason: `SLA response breach: no action taken within ${policy.responseDeadlineMinutes} minutes of submission.`,
            },
          });
          await tx.outboxEvent.create({
            data: {
              eventType: "request.sla_breached",
              payload: {
                serviceRequestId: sr.id,
                breachType: "response_deadline",
                policyId: policy.id,
                responseDeadlineMinutes: policy.responseDeadlineMinutes,
                breachedAt: now.toISOString(),
              },
              serviceRequestId: sr.id,
            },
          });
        });
        escalated++;
      } catch (err) {
        errors++;
        console.warn(`  Error (response breach) ${sr.id}: ${err.message}`);
      }
    }
  }

  console.log(`\nDone. Escalated: ${escalated}, Already escalated: ${alreadyEscalated}, Errors: ${errors}`);
}

main()
  .catch((err) => {
    console.error("SLA enforcement failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
