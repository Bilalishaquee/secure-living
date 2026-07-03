import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { hasPermission, canAccessOrg } from "@/lib/server/authz";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";
import { notify } from "@/lib/server/notify";

const createSchema = z.object({
  organizationId: z.string().optional(),
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

  const canManage = hasPermission(actor, "visitor:view") || hasPermission(actor, "visitor:manage");
  const canSelfRegister = hasPermission(actor, "visitor:create");
  if (!canManage && !canSelfRegister) return jsonError(403, "Forbidden");

  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  const unitId = url.searchParams.get("unitId");

  // A tenant with only visitor:create (no org-wide visitor:view/manage) may only ever
  // see visitors they registered themselves — never the rest of the org's visitor list.
  if (!canManage) {
    const rows = await prisma.visitor.findMany({
      where: { createdByUserId: actor.userId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ data: rows });
  }

  const organizationId = url.searchParams.get("organizationId") || actor.orgIds?.[0];
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

  const canManage = hasPermission(actor, "visitor:manage");
  const canSelfRegister = hasPermission(actor, "visitor:create");
  if (!canManage && !canSelfRegister) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  let organizationId: string;
  let propertyId: string | null;
  let unitId: string | null;

  if (canManage) {
    // Staff/landlord path — full org-wide add, exactly as before.
    if (!body.organizationId) return jsonError(400, "organizationId is required");
    if (!canAccessOrg(actor, body.organizationId)) return jsonError(403, "Out of scope");
    organizationId = body.organizationId;
    propertyId = body.propertyId ?? null;
    unitId = body.unitId ?? null;
  } else {
    // Tenant self-registration path — the tenant can only ever register a visitor
    // against their own active lease's unit; any client-supplied org/property/unit
    // is ignored so a tenant can never register a visitor for someone else's unit.
    const lease = await prisma.lease.findFirst({
      where: { tenantUserId: actor.userId, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    if (!lease) return jsonError(400, "You need an active lease to register a visitor");
    organizationId = lease.organizationId;
    propertyId = lease.propertyId;
    unitId = lease.unitId;
  }

  if (body.phone) {
    const existing = await prisma.visitor.findFirst({
      where: { organizationId, phone: body.phone },
    });
    if (existing) {
      return Response.json({ error: "A visitor with this phone number already exists in this organization" }, { status: 409 });
    }
  }

  const row = await prisma.visitor.create({
    data: {
      id: randomUUID(),
      organizationId,
      propertyId,
      unitId,
      name: body.name,
      phone: body.phone ?? null,
      email: body.email ?? null,
      idNumber: body.idNumber ?? null,
      vehicleNumber: body.vehicleNumber ?? null,
      photoUrl: body.photoUrl ?? null,
      notes: body.notes ?? null,
      createdByUserId: canManage ? null : actor.userId,
    },
  });

  if (!canManage) {
    await notify({
      organizationId,
      roles: ["admin"],
      excludeUserId: actor.userId,
      type: "visitor.tenant_registered",
      severity: "info",
      title: "Tenant registered an expected visitor",
      message: `${row.name} was registered as an expected visitor.`,
      resourceType: "Visitor",
      resourceId: row.id,
      link: "/visitors",
    });
  }

  return Response.json({ data: row }, { status: 201 });
});
