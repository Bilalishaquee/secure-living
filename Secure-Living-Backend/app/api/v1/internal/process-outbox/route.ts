import { prisma } from "@/lib/server/db";
import { withErrorHandler } from "@/lib/server/http";

// Internal endpoint for cloud scheduler.
// Secured by CRON_SECRET environment variable.

const MAX_RETRIES = 3;
const BATCH_SIZE = 50;

export const POST = withErrorHandler(async (req: Request) => {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const events = await prisma.outboxEvent.findMany({
    where: { processed: false, retryCount: { lt: MAX_RETRIES } },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  let delivered = 0;
  let failed = 0;

  for (const event of events) {
    try {
      // Delivery stub — replace with your webhook/queue publisher in production
      if (process.env.OUTBOX_WEBHOOK_URL) {
        const res = await fetch(process.env.OUTBOX_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Event-Type": event.eventType },
          body: JSON.stringify({ id: event.id, type: event.eventType, payload: event.payload, ts: new Date().toISOString() }),
        });
        if (!res.ok) throw new Error(`Webhook returned HTTP ${res.status}`);
      }

      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { processed: true, processedAt: new Date() },
      });
      delivered++;
    } catch {
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { retryCount: { increment: 1 } },
      });
      failed++;
    }
  }

  const deadLettered = await prisma.outboxEvent.count({
    where: { processed: false, retryCount: { gte: MAX_RETRIES } },
  });

  return Response.json({ ok: true, delivered, failed, deadLettered, runAt: new Date().toISOString() });
});
