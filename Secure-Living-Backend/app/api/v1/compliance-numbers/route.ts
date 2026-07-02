import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";

const SUBJECT_TYPES = ["TENANT", "PROPERTY", "AGENT", "USER"] as const;

const createSchema = z
  .object({
    organizationId: z.string().min(1),
    // Legacy shape (tenant-only) — still accepted for back-compat.
    tenantId: z.string().min(1).optional(),
    // Generic shape — required for PROPERTY/AGENT/USER subjects.
    subjectType: z.enum(SUBJECT_TYPES).optional(),
    subjectId: z.string().min(1).optional(),
    propertyId: z.string().optional(),
    unitId: z.string().optional(),
    // Auto-generated server-side when omitted (see generateComplianceId).
    complianceId: z.string().min(1).optional(),
    status: z.string().default("ACTIVE"),
    issuedAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
  })
  .refine((v) => !!v.tenantId || !!v.subjectId, {
    message: "Either tenantId or subjectId is required",
  });

// Secure Living Compliance Number — unique permanent ID, e.g. "SLC-NAI-004821".
// Derives a region code from the linked property's county when available and
// generates a collision-free sequence against the DB unique constraint.
async function generateComplianceId(propertyId?: string | null): Promise<string> {
  let region = "GEN";
  if (propertyId) {
    const property = await prisma.property
      .findUnique({ where: { id: propertyId }, select: { county: true, city: true } })
      .catch(() => null);
    const source = property?.county || property?.city || "";
    const letters = source.replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (letters.length >= 3) region = letters.slice(0, 3);
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const sequence = Math.floor(100000 + Math.random() * 900000); // 6 digits
    const candidate = `SLC-${region}-${sequence}`;
    const existing = await prisma.complianceNumber.findUnique({
      where: { complianceId: candidate },
      select: { id: true },
    }).catch(() => null);
    if (!existing) return candidate;
  }
  // Fallback: timestamp-based to guarantee uniqueness.
  return `SLC-${region}-${Date.now().toString().slice(-8)}`;
}

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId") || actor.orgIds?.[0];
  const tenantId = url.searchParams.get("tenantId");
  const subjectType = url.searchParams.get("subjectType");
  const subjectId = url.searchParams.get("subjectId");
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;
  if (tenantId) where.tenantId = tenantId;
  if (subjectType) where.subjectType = subjectType;
  if (subjectId) where.subjectId = subjectId;
  if (status) where.status = status;

  const rows = await prisma.complianceNumber.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  // Normalize legacy tenantId-only calls onto the generic subject model.
  const subjectType = body.subjectType ?? "TENANT";
  const subjectId = body.subjectId ?? body.tenantId!;

  // One profile, one compliance number — even across multiple roles, the same
  // underlying subject should never get a second active number.
  const existing = await prisma.complianceNumber.findFirst({
    where: { subjectType, subjectId, status: { not: "REVOKED" } },
  });
  if (existing) return Response.json({ data: existing }, { status: 200 });

  const complianceId = body.complianceId ?? (await generateComplianceId(body.propertyId));

  const row = await prisma.complianceNumber.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      tenantId: subjectType === "TENANT" ? subjectId : (body.tenantId ?? null),
      subjectType,
      subjectId,
      propertyId: body.propertyId ?? (subjectType === "PROPERTY" ? subjectId : null),
      unitId: body.unitId ?? null,
      complianceId,
      status: body.status,
      issuedAt: body.issuedAt ? new Date(body.issuedAt) : new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
