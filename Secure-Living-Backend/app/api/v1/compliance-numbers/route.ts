import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  organizationId: z.string().min(1),
  tenantId: z.string().min(1),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  complianceId: z.string().min(1),
  status: z.string().default("ACTIVE"),
  issuedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId") || actor.orgIds?.[0];
  const tenantId = url.searchParams.get("tenantId");
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;
  if (tenantId) where.tenantId = tenantId;
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

  const row = await prisma.complianceNumber.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      tenantId: body.tenantId,
      propertyId: body.propertyId ?? null,
      unitId: body.unitId ?? null,
      complianceId: body.complianceId,
      status: body.status,
      issuedAt: body.issuedAt ? new Date(body.issuedAt) : new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
