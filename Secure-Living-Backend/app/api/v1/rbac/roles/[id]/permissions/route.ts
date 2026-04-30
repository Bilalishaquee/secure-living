import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";
import { z } from "zod";

const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.string().min(2)).min(0),
});

type Ctx = { params: { id: string } };

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "rbac:manage");
  if (denied) return denied;
  const parsed = await parseBody(req, updateRolePermissionsSchema);
  if (!parsed.ok) return parsed.response;

  const permissions = await prisma.permission.findMany({
    where: { code: { in: parsed.data.permissions } },
  });
  await prisma.rolePermission.deleteMany({ where: { roleId: params.id } });
  if (permissions.length) {
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({
        id: randomUUID(),
        roleId: params.id,
        permissionId: p.id,
      })),
    });
  }
  return Response.json({ ok: true });
})
