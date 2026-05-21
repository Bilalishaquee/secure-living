/**
 * Outbox Event Processor
 *
 * Picks up unprocessed OutboxEvent rows, delivers them (logs delivery here —
 * replace with your actual webhook/queue publisher), marks processed = true,
 * and retries up to 3 times on failure.
 *
 * Run periodically:
 *   node scripts/process-outbox.mjs
 *
 * Also callable via POST /api/v1/internal/process-outbox for cloud schedulers.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MAX_RETRIES = 3;
const BATCH_SIZE = 50;

/**
 * Deliver an outbox event.
 * Replace this stub with your real delivery mechanism:
 *   - HTTP POST to a webhook endpoint
 *   - Publish to BullMQ / RabbitMQ / SQS
 *   - Write to an event streaming topic (Kafka, EventBridge)
 */
async function deliverEvent(event) {
  // ── Stub delivery ──────────────────────────────────────────────────────────
  // In production, POST to your webhook or publish to a queue.
  // This stub simply logs and succeeds so the event is marked processed.
  console.log(`  [DELIVER] ${event.eventType} id=${event.id} srId=${event.serviceRequestId ?? "—"}`);

  // Example webhook delivery (uncomment and configure):
  // const res = await fetch(process.env.OUTBOX_WEBHOOK_URL, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json", "X-Event-Type": event.eventType },
  //   body: JSON.stringify({ id: event.id, type: event.eventType, payload: event.payload, ts: new Date().toISOString() }),
  // });
  // if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
}

async function main() {
  const now = new Date();
  console.log(`Outbox processor run at ${now.toISOString()}`);

  const events = await prisma.outboxEvent.findMany({
    where: {
      processed: false,
      retryCount: { lt: MAX_RETRIES },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  console.log(`Processing ${events.length} events (batch size ${BATCH_SIZE}).`);

  let delivered = 0;
  let failed = 0;

  for (const event of events) {
    try {
      await deliverEvent(event);

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      delivered++;
    } catch (err) {
      console.warn(`  [FAILED] ${event.id}: ${err.message}`);
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { retryCount: { increment: 1 } },
      });
      failed++;
    }
  }

  // Report any events that have exhausted retries
  const deadLettered = await prisma.outboxEvent.count({
    where: { processed: false, retryCount: { gte: MAX_RETRIES } },
  });

  console.log(`\nDone. Delivered: ${delivered}, Failed: ${failed}, Dead-lettered: ${deadLettered}`);
  if (deadLettered > 0) {
    console.warn(`WARNING: ${deadLettered} events have exceeded max retries and will not be retried automatically.`);
  }
}

main()
  .catch((err) => {
    console.error("Outbox processor failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
