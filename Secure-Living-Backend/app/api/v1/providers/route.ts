import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { ProviderCategory, ProviderStatus } from "@prisma/client";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as ProviderStatus | null;
  const category = searchParams.get("category") as ProviderCategory | null;
  const organizationId = searchParams.get("organizationId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;

  // Landlords only see their org's providers
  if (actor.role === "landlord") {
    const orgId = actor.orgIds?.[0];
    if (!orgId) return jsonError(403, "No organization context");
    where.organizationId = orgId;
  } else if (organizationId) {
    where.organizationId = organizationId;
  }

  const rows = await prisma.serviceProvider.findMany({
    where,
    include: { performance: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

const createProviderSchema = z.object({
  userId: z.string().min(1),
  organizationId: z.string().optional(),
  category: z.nativeEnum(ProviderCategory),
  specializations: z.array(z.string()),
  coverageAreas: z.array(z.string()),
  bio: z.string().optional(),
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, createProviderSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const newId = randomUUID();
  const provider = await prisma.serviceProvider.create({
    data: {
      id: newId,
      userId: body.userId,
      organizationId: body.organizationId ?? null,
      category: body.category,
      status: ProviderStatus.PENDING_APPROVAL,
      specializations: body.specializations,
      coverageAreas: body.coverageAreas,
      bio: body.bio ?? null,
      qrCodeUrl: `/providers/${newId}/qr`,
    },
  });

  await prisma.serviceProviderPerformance.create({
    data: {
      id: randomUUID(),
      providerId: newId,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "provider.created",
    resourceType: "service_provider",
    resourceId: newId,
    orgId: body.organizationId ?? null,
    afterJson: provider,
  });

  return Response.json({ data: provider }, { status: 201 });
});
