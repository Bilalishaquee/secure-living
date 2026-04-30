import { hasPermission, type ApiActor } from "@/lib/server/authz";
import { appendAudit } from "@/lib/server/audit";
import { prisma } from "@/lib/server/db";
import { jsonError, parseBody, requireActor, requireScope , withErrorHandler } from "@/lib/server/http";
import { updateExpenseSchema } from "@/lib/server/validation";

function canRead(actor: ApiActor) {
  return hasPermission(actor, "*") || hasPermission(actor, "properties:view") || hasPermission(actor, "accounting:view");
}

function canWrite(actor: ApiActor) {
  return hasPermission(actor, "*") || hasPermission(actor, "property:edit") || hasPermission(actor, "accounting:manage");
}

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!canRead(actor)) return jsonError(403, "Forbidden");

  const row = await prisma.expense.findUnique({ where: { id: params.id } });
  if (!row || row.deletedAt) return jsonError(404, "Not found");
  const scoped = requireScope(actor, row.organizationId, row.branchId);
  if (scoped) return scoped;
  return Response.json({ data: row });
})

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!canWrite(actor)) return jsonError(403, "Forbidden");

  const existing = await prisma.expense.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) return jsonError(404, "Not found");
  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  const parsed = await parseBody(req, updateExpenseSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;

  const row = await prisma.expense.update({
    where: { id: params.id },
    data: {
      ...b,
      date: b.date ? new Date(b.date) : undefined,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "expense.updated",
    resourceType: "expense",
    resourceId: row.id,
    orgId: row.organizationId,
    branchId: row.branchId,
    beforeJson: existing,
    afterJson: row,
  });

  return Response.json({ data: row });
})

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!canWrite(actor)) return jsonError(403, "Forbidden");

  const existing = await prisma.expense.findUnique({ where: { id: params.id } });
  if (!existing || existing.deletedAt) return jsonError(404, "Not found");
  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  const row = await prisma.expense.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "expense.deleted",
    resourceType: "expense",
    resourceId: row.id,
    orgId: row.organizationId,
    branchId: row.branchId,
    beforeJson: existing,
    afterJson: row,
  });
  return Response.json({ data: { id: row.id, deletedAt: row.deletedAt } });
})
