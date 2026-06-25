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
  const isGlobal = actor.role === "super_admin" || actor.permissions.includes("*");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;

  if (!isGlobal) {
    if (!actor.orgIds.length) return jsonError(403, "No organization context");
    where.organizationId = { in: actor.orgIds };
  } else if (organizationId) {
    where.organizationId = organizationId;
  }

  const rows = await prisma.serviceProvider.findMany({
    where,
    include: { performance: true },
    orderBy: { createdAt: "desc" },
  });

  const users = rows.length
    ? await prisma.appUser.findMany({
        where: { id: { in: Array.from(new Set(rows.map((row) => row.userId))) } },
        select: { id: true, fullName: true, email: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  return Response.json({
    data: rows.map((row) => ({
      ...row,
      name: userMap.get(row.userId)?.fullName ?? null,
      email: userMap.get(row.userId)?.email ?? null,
    })),
  });
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

  const existingProvider = await prisma.serviceProvider.findFirst({ where: { userId: body.userId } });
  if (existingProvider) return jsonError(409, "This user is already registered as a service provider");

  const providerUser = await prisma.appUser.findUnique({
    where: { id: body.userId },
    include: { roleAssignments: true },
  });
  if (!providerUser) return jsonError(404, "Selected user account was not found");

  const isGlobal = actor.role === "super_admin" || actor.permissions.includes("*");
  const targetOrgId = body.organizationId ?? actor.orgIds?.[0] ?? null;
  const inScope = isGlobal || providerUser.roleAssignments.some((ra) => actor.orgIds.includes(ra.organizationId));
  if (!inScope) return jsonError(403, "Selected user is outside your organization scope");

  const newId = randomUUID();
  const provider = await prisma.serviceProvider.create({
    data: {
      id: newId,
      userId: body.userId,
      organizationId: targetOrgId,
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

  // Phase 3: Log provider creation in the provider-specific audit trail
  await prisma.serviceProviderAuditLog.create({
    data: {
      id: randomUUID(),
      providerId: newId,
      action: "created",
      toStatus: "PENDING_APPROVAL",
      reviewedBy: actor.userId,
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
