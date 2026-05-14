import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

const createShortStaySchema = z.object({
  unitId: z.string().min(1),
  nightlyRate: z.number().positive(),
  currency: z.string().default("KES"),
  checkInTime: z.string().default("14:00"),
  checkOutTime: z.string().default("11:00"),
  cleaningFee: z.number().nonnegative().default(0),
  minNights: z.number().int().positive().default(1),
  maxNights: z.number().int().positive().default(30),
  houseRules: z.string().optional(),
  wifiPassword: z.string().optional(),
  accessNotes: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "short-stay:view");
  if (denied) return denied;

  const orgId = actor.orgIds?.[0];
  const rows = await prisma.shortStayProperty.findMany({
    where: { organizationId: orgId ?? undefined },
    include: {
      unit: { select: { unitNumber: true, propertyId: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "short-stay:manage");
  if (denied) return denied;

  const orgId = actor.orgIds?.[0];
  if (!orgId) return Response.json({ error: "No organization" }, { status: 400 });

  const parsed = await parseBody(req, createShortStaySchema);
  if (!parsed.ok) return parsed.response;

  const existing = await prisma.shortStayProperty.findUnique({ where: { unitId: parsed.data.unitId } });
  if (existing) return Response.json({ error: "Unit already configured for short-stay" }, { status: 409 });

  const row = await prisma.shortStayProperty.create({
    data: { organizationId: orgId, ...parsed.data },
  });

  return Response.json({ data: row }, { status: 201 });
});
