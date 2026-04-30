import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { createRentInvoiceSchema } from "@/lib/server/validation";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:view");
  if (denied) return denied;
  const rows = await prisma.rentInvoice.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:create");
  if (denied) return denied;
  const parsed = await parseBody(req, createRentInvoiceSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  const total = b.rentAmountKes + (b.lateFeeKes ?? 0) + (b.otherChargesKes ?? 0);
  const row = await prisma.rentInvoice.create({
    data: {
      id: randomUUID(),
      leaseId: b.leaseId,
      tenantId: b.tenantId,
      landlordId: b.landlordId,
      propertyId: b.propertyId,
      unitId: b.unitId,
      invoiceNumber: b.invoiceNumber,
      periodStart: new Date(b.periodStart),
      periodEnd: new Date(b.periodEnd),
      dueDate: new Date(b.dueDate),
      rentAmountKes: b.rentAmountKes,
      lateFeeKes: b.lateFeeKes ?? 0,
      otherChargesKes: b.otherChargesKes ?? 0,
      totalDueKes: total,
      balanceKes: total,
      status: "sent",
      sentAt: new Date(),
    },
  });
  return Response.json({ data: row }, { status: 201 });
})
