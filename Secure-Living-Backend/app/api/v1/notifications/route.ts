import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

// Real notification feed — every row is a persisted Notification created at the
// moment an event happened (see lib/server/notify.ts), scoped to this actor as a
// recipient. This replaces the previous derived/re-queried pseudo-feed (which
// recomputed live counts like "overdue invoices" on every request instead of
// notifying anyone when the event actually occurred) — those same events (KYC
// review, SLA breaches, blocked service requests, team invitations, etc.) now
// create real Notification rows at their source instead.
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 30), 100);
  const unreadOnly = url.searchParams.get("unreadOnly") === "true";

  const where = { recipientId: actor.userId, ...(unreadOnly ? { isRead: false } : {}) };

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { recipientId: actor.userId, isRead: false } }),
  ]);

  return Response.json({ data: { items, unreadCount, count: items.length } });
});
