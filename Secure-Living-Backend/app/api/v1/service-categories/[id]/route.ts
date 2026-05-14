import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  tagline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  order: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-category:manage");
  if (denied) return denied;

  const cat = await prisma.serviceCategory.findUnique({ where: { id: params.id } });
  if (!cat) return jsonError(404, "Category not found");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const { sortOrder, ...rest } = parsed.data;
  const updateData = { ...rest, ...(sortOrder !== undefined ? { order: sortOrder } : {}) };
  const updated = await prisma.serviceCategory.update({ where: { id: params.id }, data: updateData });
  return Response.json({ data: updated });
});

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-category:manage");
  if (denied) return denied;

  const cat = await prisma.serviceCategory.findUnique({ where: { id: params.id } });
  if (!cat) return jsonError(404, "Category not found");

  // Soft delete
  await prisma.serviceCategory.update({ where: { id: params.id }, data: { isActive: false } });
  return Response.json({ data: { deactivated: true } });
});
