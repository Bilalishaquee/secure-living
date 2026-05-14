import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "tenant:view");
  if (denied) return denied;

  const user = await prisma.appUser.findUnique({ where: { id: params.id }, select: { id: true, fullName: true, email: true } });
  if (!user) return jsonError(404, "Tenant not found");

  const events: Array<{ date: Date; type: string; description: string; unitId?: string; linkId?: string }> = [];

  const leases = await prisma.lease.findMany({
    where: { tenantUserId: params.id },
    orderBy: { startDate: "asc" },
  });

  for (const lease of leases) {
    const unit = await prisma.unit.findUnique({ where: { id: lease.unitId }, select: { unitNumber: true } });
    const unitRef = unit?.unitNumber ?? lease.unitId;

    events.push({ date: lease.startDate, type: "lease_started", description: `Lease started in Unit ${unitRef}`, unitId: lease.unitId, linkId: lease.id });

    const invoices = await prisma.rentInvoice.findMany({ where: { leaseId: lease.id, status: "paid" } });
    for (const inv of invoices) {
      if (inv.paidAt) {
        events.push({ date: inv.paidAt, type: "rent_paid", description: `Rent paid — KES ${inv.amountPaidKes.toLocaleString()} for Unit ${unitRef}`, unitId: lease.unitId, linkId: inv.id });
      }
    }

    const maintenanceReqs = await prisma.serviceRequest.findMany({ where: { unitId: lease.unitId, tenantUserId: params.id } });
    for (const sr of maintenanceReqs) {
      events.push({ date: sr.createdAt, type: "maintenance_raised", description: `Maintenance raised in Unit ${unitRef}: ${sr.title}`, unitId: lease.unitId, linkId: sr.id });
    }

    const vacating = await prisma.vacatingNotice.findUnique({
      where: { leaseId: lease.id },
      include: { depositRefund: true },
    });
    if (vacating) {
      events.push({ date: vacating.noticeDate, type: "vacating_submitted", description: `Vacating notice submitted for Unit ${unitRef}`, unitId: lease.unitId, linkId: vacating.id });
      if (vacating.depositRefund?.paidAt) {
        events.push({ date: vacating.depositRefund.paidAt, type: "deposit_refund_paid", description: `Deposit refund paid — KES ${vacating.depositRefund.refundAmount.toLocaleString()} for Unit ${unitRef}`, unitId: lease.unitId, linkId: vacating.id });
      }
    }

    const checklists = await prisma.tenantChecklist.findMany({ where: { leaseId: lease.id } });
    for (const cl of checklists) {
      if (cl.signedAt) {
        events.push({ date: cl.signedAt, type: "checklist_signed", description: `${cl.type === "MOVE_IN" ? "Move-in" : "Move-out"} checklist signed for Unit ${unitRef}`, unitId: lease.unitId, linkId: cl.id });
      }
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return Response.json({
    data: {
      tenant: user,
      events: events.map((e) => ({ ...e, date: e.date.toISOString() })),
    },
  });
});
