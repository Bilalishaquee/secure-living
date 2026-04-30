import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";
import { z } from "zod";

const createRoleSchema = z.object({
  slug: z.string().min(2),
  displayName: z.string().min(2),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "rbac:manage");
  if (denied) return denied;
  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { userAssignments: true } },
    },
    orderBy: { displayName: "asc" },
  });
  return Response.json({
    data: roles.map((r) => ({
      id: r.id,
      slug: r.slug,
      displayName: r.displayName,
      permissions: r.permissions.map((rp) => rp.permission.code),
      activeUsers: r._count.userAssignments,
    })),
  });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "rbac:manage");
  if (denied) return denied;
  const parsed = await parseBody(req, createRoleSchema);
  if (!parsed.ok) return parsed.response;
  const role = await prisma.role.create({
    data: { id: randomUUID(), slug: parsed.data.slug, displayName: parsed.data.displayName },
  });
  return Response.json({ data: role }, { status: 201 });
})
