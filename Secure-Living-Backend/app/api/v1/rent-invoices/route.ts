import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { createRentInvoiceSchema } from "@/lib/server/validation";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const leaseId = url.searchParams.get("leaseId") ?? undefined;

  // Tenant Portal "View Payment Schedule": a tenant may only ever see their own invoices,
  // never anyone else's — this bypasses the finance:view staff permission entirely.
  if (actor.role === "tenant") {
    const rows = await prisma.rentInvoice.findMany({
      where: { tenantId: actor.userId, ...(leaseId && { leaseId }) },
      orderBy: { dueDate: "asc" },
    });
    return Response.json({ data: rows });
  }

  const denied = requirePermission(actor, "finance:view");
  if (denied) return denied;
  const rows = await prisma.rentInvoice.findMany({
    where: { ...(leaseId && { leaseId }) },
    orderBy: { createdAt: "desc" },
  });
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

  const lease = await prisma.lease.findUnique({ where: { id: b.leaseId } });
  if (!lease) return jsonError(404, "Lease not found");

  const scoped = requireScope(actor, lease.organizationId, lease.branchId);
  if (scoped) return scoped;

  const periodStart = new Date(b.periodStart);
  const periodEnd = new Date(b.periodEnd);
  const dueDate = new Date(b.dueDate);
  if (periodEnd < periodStart) return jsonError(400, "Period end must be after period start");

  const total = b.rentAmountKes + (b.lateFeeKes ?? 0) + (b.otherChargesKes ?? 0);

  try {
    const row = await prisma.rentInvoice.create({
      data: {
        id: randomUUID(),
        leaseId: lease.id,
        tenantId: lease.tenantUserId,
        landlordId: actor.userId,
        propertyId: lease.propertyId,
        unitId: lease.unitId,
        invoiceNumber: b.invoiceNumber,
        periodStart,
        periodEnd,
        dueDate,
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
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError(409, "Invoice number already exists");
    }
    throw e;
  }
})
