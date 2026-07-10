import { z } from "zod";
import { Prisma } from "@prisma/client";
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
  categoryType: z.enum(["MAINTENANCE", "PROFESSIONAL"]).optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.any()).nullable().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  // Public — no auth required. Admin callers may pass ?all=1 to include inactive categories.
  const url = new URL(req.url);
  const includeAll = url.searchParams.get("all") === "1";
  const rows = await prisma.serviceCategory.findMany({
    where: includeAll ? {} : { isActive: true },
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

  const { sortOrder, config, ...rest } = parsed.data;
  const row = await prisma.serviceCategory.create({
    data: {
      ...rest,
      ...(sortOrder !== undefined ? { order: sortOrder } : {}),
      ...(config !== undefined ? { config: (config as Prisma.InputJsonValue) ?? Prisma.JsonNull } : {}),
    },
  });
  return Response.json({ data: row }, { status: 201 });
});
