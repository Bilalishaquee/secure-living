import { randomUUID } from "crypto";
import { hasPermission, type ApiActor } from "@/lib/server/authz";
import { appendAudit } from "@/lib/server/audit";
import { prisma } from "@/lib/server/db";
import { jsonError, parseBody, requireActor, requireScope , withErrorHandler } from "@/lib/server/http";
import { createExpenseSchema } from "@/lib/server/validation";

function canRead(actor: ApiActor) {
  return hasPermission(actor, "*") || hasPermission(actor, "properties:view") || hasPermission(actor, "accounting:view");
}

function canWrite(actor: ApiActor) {
  return hasPermission(actor, "*") || hasPermission(actor, "property:create") || hasPermission(actor, "property:edit") || hasPermission(actor, "accounting:manage");
}

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!canRead(actor)) return jsonError(403, "Forbidden");

  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  const category = url.searchParams.get("category");
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");

  const rows = await prisma.expense.findMany({
    where: {
      deletedAt: null,
      ...(actor.permissions.includes("*")
        ? {}
        : {
            organizationId: { in: actor.orgIds },
            branchId: { in: actor.branchIds },
          }),
      ...(propertyId ? { propertyId } : {}),
      ...(category ? { category } : {}),
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
  });

  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!canWrite(actor)) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, createExpenseSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const scoped = requireScope(actor, body.organizationId, body.branchId);
  if (scoped) return scoped;

  const row = await prisma.expense.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      branchId: body.branchId,
      propertyId: body.propertyId,
      unitId: body.unitId,
      category: body.category,
      description: body.description,
      amountKes: body.amountKes,
      date: new Date(body.date),
      vendorName: body.vendorName,
      receiptUrl: body.receiptUrl,
      paymentMethod: body.paymentMethod,
      isRecurring: body.isRecurring ?? false,
      recurringFreq: body.recurringFreq,
      notes: body.notes,
      createdBy: actor.userId,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "expense.created",
    resourceType: "expense",
    resourceId: row.id,
    orgId: row.organizationId,
    branchId: row.branchId,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: 201 });
})
