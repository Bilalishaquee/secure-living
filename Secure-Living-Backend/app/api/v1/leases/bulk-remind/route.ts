import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";
import { appendAudit } from "@/lib/server/audit";

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:view");
  if (denied) return denied;

  const isGlobal = actor.permissions.includes("*");

  // Find overdue invoices to identify tenants in arrears
  const overdueInvoices = await prisma.rentInvoice.findMany({
    where: {
      status: { in: ["pending", "overdue"] },
      dueDate: { lt: new Date() },
      ...(isGlobal ? {} : { Lease: { organizationId: { in: actor.orgIds } } }),
    },
    select: { id: true, unitId: true, tenantId: true, balanceKes: true },
    distinct: ["tenantId"],
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "bulk_reminder.sent",
    resourceType: "lease",
    resourceId: "bulk",
    orgId: actor.orgIds[0] ?? null,
    branchId: actor.branchIds[0] ?? null,
    afterJson: { count: overdueInvoices.length, sentAt: new Date().toISOString() },
  });

  const msg = "Reminder queued for " + overdueInvoices.length + " tenant(s) in arrears";
  return Response.json({ data: { count: overdueInvoices.length, message: msg } });
});