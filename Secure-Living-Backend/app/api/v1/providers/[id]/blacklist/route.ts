import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const blacklistSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  // Only admin or super_admin may blacklist
  const isAdminOrAbove =
    actor.role === "super_admin" ||
    actor.role === "admin" ||
    actor.permissions.includes("*");
  if (!isAdminOrAbove) return jsonError(403, "Only admin or super_admin may blacklist a provider");

  const provider = await prisma.serviceProvider.findUnique({ where: { id: params.id } });
  if (!provider) return jsonError(404, "Provider not found");

  const parsed = await parseBody(req, blacklistSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.serviceProvider.update({
    where: { id: params.id },
    data: {
      status: "BLACKLISTED",
      blacklistReason: parsed.data.reason,
      blacklistedAt: new Date(),
    },
  });

  await prisma.serviceProviderAuditLog.create({
    data: {
      id: randomUUID(),
      providerId: params.id,
      action: "blacklisted",
      fromStatus: provider.status,
      toStatus: "BLACKLISTED",
      reason: parsed.data.reason,
      reviewedBy: actor.userId,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "provider.blacklisted",
    resourceType: "service_provider",
    resourceId: params.id,
    orgId: provider.organizationId,
    beforeJson: provider,
    afterJson: updated,
  });

  return Response.json({ data: updated });
});
