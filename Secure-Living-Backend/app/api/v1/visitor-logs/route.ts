import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  visitorId: z.string().min(1),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  purpose: z.string().min(1),
  authorizedBy: z.string().optional(),
  approvalStatus: z.string().default("AUTO_APPROVED"),
  approvalMethod: z.string().optional(),
  notes: z.string().optional(),
  idVerified: z.boolean().default(false),
});

const checkOutSchema = z.object({
  visitorLogId: z.string().min(1),
  checkOutAt: z.string().datetime().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const visitorId = url.searchParams.get("visitorId");
  const unitId = url.searchParams.get("unitId");
  const propertyId = url.searchParams.get("propertyId");

  const where: Record<string, unknown> = {};
  if (visitorId) where.visitorId = visitorId;
  if (unitId) where.unitId = unitId;
  if (propertyId) where.propertyId = propertyId;

  const rows = await prisma.visitorLog.findMany({
    where,
    orderBy: { checkInAt: "desc" },
    include: { visitor: true },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.visitorLog.create({
    data: {
      id: randomUUID(),
      visitorId: body.visitorId,
      propertyId: body.propertyId ?? null,
      unitId: body.unitId ?? null,
      purpose: body.purpose,
      authorizedBy: body.authorizedBy ?? null,
      approvalStatus: body.approvalStatus,
      approvalMethod: body.approvalMethod ?? null,
      notes: body.notes ?? null,
      idVerified: body.idVerified,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});

export const PATCH = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, checkOutSchema);
  if (!parsed.ok) return parsed.response;

  const existing = await prisma.visitorLog.findUnique({ where: { id: parsed.data.visitorLogId } });
  if (!existing) return jsonError(404, "Visitor log not found");

  const updated = await prisma.visitorLog.update({
    where: { id: parsed.data.visitorLogId },
    data: { checkOutAt: parsed.data.checkOutAt ? new Date(parsed.data.checkOutAt) : new Date() },
  });

  return Response.json({ data: updated });
});
