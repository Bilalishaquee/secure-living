import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

const createCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  tagline: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().default(0),
  sortOrder: z.number().int().optional(),
});

export const GET = withErrorHandler(async (_req: Request) => {
  // Public — no auth required
  const rows = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-category:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, createCategorySchema);
  if (!parsed.ok) return parsed.response;

  const { sortOrder, ...rest } = parsed.data;
  const row = await prisma.serviceCategory.create({ data: { ...rest, ...(sortOrder !== undefined ? { order: sortOrder } : {}) } });
  return Response.json({ data: row }, { status: 201 });
});
