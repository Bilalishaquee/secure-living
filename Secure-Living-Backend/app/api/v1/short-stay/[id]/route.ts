import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateSchema = z.object({
  nightlyRate: z.number().positive().optional(),
  currency: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  cleaningFee: z.number().nonnegative().optional(),
  minNights: z.number().int().positive().optional(),
  maxNights: z.number().int().positive().optional(),
  houseRules: z.string().nullable().optional(),
  wifiPassword: z.string().nullable().optional(),
  accessNotes: z.string().nullable().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "short-stay:view");
  if (denied) return denied;

  const row = await prisma.shortStayProperty.findUnique({
    where: { id: params.id },
    include: { unit: true, bookings: { orderBy: { checkInDate: "desc" }, take: 10 } },
  });
  if (!row) return jsonError(404, "Not found");

  const orgId = actor.orgIds?.[0];
  if (row.organizationId !== orgId) return jsonError(403, "Forbidden");

  return Response.json({ data: row });
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "short-stay:manage");
  if (denied) return denied;

  const existing = await prisma.shortStayProperty.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const orgId = actor.orgIds?.[0];
  if (existing.organizationId !== orgId) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.shortStayProperty.update({ where: { id: params.id }, data: parsed.data });
  return Response.json({ data: updated });
});

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "short-stay:manage");
  if (denied) return denied;

  const existing = await prisma.shortStayProperty.findUnique({
    where: { id: params.id },
    include: { bookings: { where: { status: { in: ["CONFIRMED", "CHECKED_IN"] } }, select: { id: true } } },
  });
  if (!existing) return jsonError(404, "Not found");
  if (existing.bookings.length > 0) return jsonError(400, "Cannot delete with active bookings");

  await prisma.shortStayProperty.delete({ where: { id: params.id } });
  return Response.json({ data: { deleted: true } });
});
