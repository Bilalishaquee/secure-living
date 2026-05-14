import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateContainerSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["STANDALONE", "ESTATE", "COMPLEX", "COURTYARD", "MALL"]).optional(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "container:view");
  if (denied) return denied;

  const container = await prisma.container.findUnique({
    where: { id: params.id },
    include: {
      managers: { select: { id: true, userId: true, role: true, assignedAt: true } },
      properties: {
        include: { _count: { select: { roleAssignments: true } } },
      },
    },
  });
  if (!container) return jsonError(404, "Container not found");

  const orgId = actor.orgIds?.[0];
  if (container.organizationId !== orgId) return jsonError(403, "Forbidden");

  return Response.json({ data: container });
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "container:edit");
  if (denied) return denied;

  const existing = await prisma.container.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Container not found");

  const orgId = actor.orgIds?.[0];
  if (existing.organizationId !== orgId) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, updateContainerSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.container.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.type !== undefined && { type: parsed.data.type as never }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.address !== undefined && { address: parsed.data.address }),
      ...(parsed.data.city !== undefined && { city: parsed.data.city }),
      ...(parsed.data.country !== undefined && { country: parsed.data.country }),
      ...(parsed.data.coverImage !== undefined && { coverImage: parsed.data.coverImage }),
    },
  });

  return Response.json({ data: updated });
});

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "container:delete");
  if (denied) return denied;

  const existing = await prisma.container.findUnique({
    where: { id: params.id },
    include: { properties: { select: { id: true } } },
  });
  if (!existing) return jsonError(404, "Container not found");

  const orgId = actor.orgIds?.[0];
  if (existing.organizationId !== orgId) return jsonError(403, "Forbidden");

  if (existing.properties.length > 0) {
    return jsonError(400, "Cannot delete container with properties — reassign properties first");
  }

  await prisma.container.delete({ where: { id: params.id } });
  return Response.json({ data: { deleted: true } });
});
