import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

const createContainerSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["STANDALONE", "ESTATE", "COMPLEX", "COURTYARD", "MALL"]),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  coverImage: z.string().optional(),
  branchId: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "container:view");
  if (denied) return denied;

  const orgId = actor.orgIds?.[0];
  if (!orgId) return Response.json({ data: [] });

  const rows = await prisma.container.findMany({
    where: { organizationId: orgId },
    include: {
      _count: { select: { properties: true, managers: true } },
      managers: { select: { id: true, userId: true, role: true, assignedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "container:create");
  if (denied) return denied;

  const parsed = await parseBody(req, createContainerSchema);
  if (!parsed.ok) return parsed.response;

  const orgId = actor.orgIds?.[0];
  if (!orgId) return Response.json({ error: "No organization" }, { status: 400 });

  const row = await prisma.container.create({
    data: {
      organizationId: orgId,
      branchId: parsed.data.branchId,
      name: parsed.data.name,
      type: parsed.data.type as never,
      description: parsed.data.description,
      address: parsed.data.address,
      city: parsed.data.city,
      country: parsed.data.country,
      coverImage: parsed.data.coverImage,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
