import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

// Accept both the canonical field names and the shorter aliases the builder UI
// uses (area -> section, label -> item, sortOrder -> order, qty -> defaultQty).
const itemSchema = z
  .object({
    section: z.string().optional(),
    area: z.string().optional(),
    item: z.string().optional(),
    label: z.string().optional(),
    defaultQty: z.number().int().positive().optional(),
    qty: z.number().int().positive().optional(),
    order: z.number().int().nonnegative().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
  })
  .transform((v, ctx) => {
    const section = v.section ?? v.area ?? "General";
    const item = v.item ?? v.label;
    if (!item) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "item (or label) is required" });
      return z.NEVER;
    }
    return {
      section,
      item,
      defaultQty: v.defaultQty ?? v.qty ?? 1,
      order: v.order ?? v.sortOrder ?? 0,
    };
  });

const CATEGORIES = ["RESIDENTIAL", "FURNISHED", "COMMERCIAL", "SHORT_STAY", "CUSTOM"] as const;

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(CATEGORIES).optional(),
  items: z.array(itemSchema).default([]),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "checklist:view");
  if (denied) return denied;

  const orgId = actor.orgIds?.[0];
  const rows = await prisma.checklistTemplate.findMany({
    where: { organizationId: orgId ?? undefined },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "checklist:create");
  if (denied) return denied;

  const orgId = actor.orgIds?.[0];
  if (!orgId) return Response.json({ error: "No organization" }, { status: 400 });

  const parsed = await parseBody(req, createTemplateSchema);
  if (!parsed.ok) return parsed.response;

  const template = await prisma.checklistTemplate.create({
    data: {
      organizationId: orgId,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      items: { create: parsed.data.items },
    },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return Response.json({ data: template }, { status: 201 });
});
