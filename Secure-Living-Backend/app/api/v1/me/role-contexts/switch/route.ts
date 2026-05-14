import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { requireActor, parseBody, jsonError, withErrorHandler } from "@/lib/server/http";
import { createAuthToken } from "@/lib/server/token";

const switchSchema = z.object({
  contextId: z.string().min(1),
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, switchSchema);
  if (!parsed.ok) return parsed.response;

  const context = await prisma.userRoleContext.findFirst({
    where: { id: parsed.data.contextId, userId: actor.userId, isActive: true },
  });
  if (!context) return jsonError(404, "Role context not found");

  // Get permissions for the role in this context
  const roleRow = await prisma.role.findFirst({
    where: { slug: context.role },
    include: { permissions: { include: { permission: true } } },
  });
  const permissions = roleRow ? roleRow.permissions.map((p) => p.permission.code) : actor.permissions;

  const token = createAuthToken({
    userId: actor.userId,
    email: actor.email,
    role: context.role,
    permissions,
    branchIds: actor.branchIds,
    orgIds: [context.organizationId, ...actor.orgIds.filter((id) => id !== context.organizationId)],
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  return Response.json({ data: { token, context } });
});
