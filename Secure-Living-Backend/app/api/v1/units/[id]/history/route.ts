import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "unit:view");
  if (denied) return denied;

  const unit = await prisma.unit.findUnique({ where: { id: params.id } });
  if (!unit) return jsonError(404, "Unit not found");

  const events: Array<{ date: Date; type: string; description: string; linkId?: string }> = [];

  events.push({ date: unit.createdAt, type: "unit_created", description: `Unit ${unit.unitNumber} created` });

  const leases = await prisma.lease.findMany({ where: { unitId: params.id }, orderBy: { startDate: "asc" } });
  for (const lease of leases) {
    events.push({ date: lease.startDate, type: "lease_started", description: `Lease started — ${lease.leaseType}`, linkId: lease.id });
    if (lease.terminatedAt) {
      events.push({ date: lease.terminatedAt, type: "lease_terminated", description: "Lease terminated", linkId: lease.id });
    }

    const invoices = await prisma.rentInvoice.findMany({ where: { leaseId: lease.id, status: "paid" } });
    for (const inv of invoices) {
      if (inv.paidAt) {
        events.push({ date: inv.paidAt, type: "rent_paid", description: `Rent payment received — KES ${inv.amountPaidKes.toLocaleString()}`, linkId: inv.id });
      }
    }
  }

  const maintenanceReqs = await prisma.serviceRequest.findMany({ where: { unitId: params.id }, orderBy: { createdAt: "asc" } });
  for (const sr of maintenanceReqs) {
    events.push({ date: sr.createdAt, type: "maintenance_raised", description: `Maintenance: ${sr.title}`, linkId: sr.id });
    if (sr.completedDate) {
      events.push({ date: sr.completedDate, type: "maintenance_resolved", description: `Maintenance resolved: ${sr.title}`, linkId: sr.id });
    }
  }

  const vacating = await prisma.vacatingNotice.findMany({
    where: { unitId: params.id },
    include: { inspection: { include: { deductions: true } }, depositRefund: true },
  });
  for (const vn of vacating) {
    events.push({ date: vn.noticeDate, type: "vacating_submitted", description: `Vacating notice submitted — move-out ${vn.intendedMoveOut.toDateString()}`, linkId: vn.id });
    if (vn.inspection) {
      events.push({ date: vn.inspection.scheduledDate, type: "inspection_scheduled", description: "Move-out inspection scheduled", linkId: vn.id });
      if (vn.inspection.status === "COMPLETED" && vn.inspection.updatedAt) {
        events.push({ date: vn.inspection.updatedAt, type: "inspection_completed", description: "Move-out inspection completed", linkId: vn.id });
        const totalDeductions = vn.inspection.deductions.reduce((s, d) => s + d.amount, 0);
        if (totalDeductions > 0) {
          events.push({ date: vn.inspection.updatedAt, type: "deductions_recorded", description: `Deductions recorded — KES ${totalDeductions.toLocaleString()}`, linkId: vn.id });
        }
      }
    }
    if (vn.depositRefund?.paidAt) {
      events.push({ date: vn.depositRefund.paidAt, type: "deposit_refund_paid", description: `Deposit refund paid — KES ${vn.depositRefund.refundAmount.toLocaleString()}, voucher ${vn.depositRefund.voucherNumber}`, linkId: vn.id });
    }
  }

  const listing = await prisma.listing.findUnique({ where: { unitId: params.id } });
  if (listing) {
    events.push({ date: listing.createdAt, type: "listed", description: `Listed for rental — ${listing.title}`, linkId: listing.id });
    if (listing.publishedAt) {
      events.push({ date: listing.publishedAt, type: "listing_published", description: "Listing published publicly", linkId: listing.id });
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return Response.json({ data: events.map((e) => ({ ...e, date: e.date.toISOString() })) });
});
