import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { hasPermission, canAccessOrg } from "@/lib/server/authz";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  organizationId: z.string().min(1),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  idNumber: z.string().optional(),
  vehicleNumber: z.string().optional(),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!hasPermission(actor, "visitor:view") && !hasPermission(actor, "visitor:manage")) {
    return jsonError(403, "Forbidden");
  }

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId") || actor.orgIds?.[0];
  const propertyId = url.searchParams.get("propertyId");
  const unitId = url.searchParams.get("unitId");
  if (organizationId && !canAccessOrg(actor, organizationId)) return jsonError(403, "Out of scope");

  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;
  if (propertyId) where.propertyId = propertyId;
  if (unitId) where.unitId = unitId;

  const rows = await prisma.visitor.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!hasPermission(actor, "visitor:manage")) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  if (!canAccessOrg(actor, body.organizationId)) return jsonError(403, "Out of scope");

  if (body.phone) {
    const existing = await prisma.visitor.findFirst({
      where: { organizationId: body.organizationId, phone: body.phone },
    });
    if (existing) {
      return Response.json({ error: "A visitor with this phone number already exists in this organization" }, { status: 409 });
    }
  }

  const row = await prisma.visitor.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      propertyId: body.propertyId ?? null,
      unitId: body.unitId ?? null,
      name: body.name,
      phone: body.phone ?? null,
      email: body.email ?? null,
      idNumber: body.idNumber ?? null,
      vehicleNumber: body.vehicleNumber ?? null,
      photoUrl: body.photoUrl ?? null,
      notes: body.notes ?? null,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
