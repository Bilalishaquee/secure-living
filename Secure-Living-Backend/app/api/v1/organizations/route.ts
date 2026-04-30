import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";
import { z } from "zod";

const createOrgSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["Diaspora Client", "Agency", "Independent Manager"]),
  country: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "org:manage");
  if (denied) return denied;

  const rows = await prisma.organization.findMany({
    where: actor.permissions.includes("*") ? {} : { id: { in: actor.orgIds } },
    include: { branches: true, _count: { select: { roleAssignments: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({
    data: rows.map((o) => ({
      ...o,
      usersCount: o._count.roleAssignments,
      branches: o.branches.map((b) => ({ ...b })),
    })),
  });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "org:manage");
  if (denied) return denied;
  const parsed = await parseBody(req, createOrgSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const org = await prisma.organization.create({
    data: {
      id: randomUUID(),
      name: body.name,
      type: body.type,
      country: body.country,
      email: body.email,
      phone: body.phone,
    },
  });
  const branch = await prisma.branch.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      name: "Main",
      location: body.country,
    },
  });
  return Response.json({ data: { ...org, branches: [branch], usersCount: 0 } }, { status: 201 });
})
