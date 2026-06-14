import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

// Accept canonical names plus the builder UI aliases.
const itemSchema = z
  .object({
    id: z.string().optional(),
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
    const item = v.item ?? v.label;
    if (!item) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "item (or label) is required" });
      return z.NEVER;
    }
    return {
      section: v.section ?? v.area ?? "General",
      item,
      defaultQty: v.defaultQty ?? v.qty ?? 1,
      order: v.order ?? v.sortOrder ?? 0,
    };
  });

const CATEGORIES = ["RESIDENTIAL", "FURNISHED", "COMMERCIAL", "SHORT_STAY", "CUSTOM"] as const;

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.enum(CATEGORIES).nullable().optional(),
  items: z.array(itemSchema).optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "checklist:view");
  if (denied) return denied;

  const template = await prisma.checklistTemplate.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!template) return jsonError(404, "Template not found");

  const orgId = actor.orgIds?.[0];
  if (template.organizationId !== orgId) return jsonError(403, "Forbidden");

  return Response.json({ data: template });
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "checklist:manage");
  if (denied) return denied;

  const template = await prisma.checklistTemplate.findUnique({ where: { id: params.id } });
  if (!template) return jsonError(404, "Template not found");

  const orgId = actor.orgIds?.[0];
  if (template.organizationId !== orgId) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, updateTemplateSchema);
  if (!parsed.ok) return parsed.response;

  // If items provided, replace them all
  if (parsed.data.items !== undefined) {
    await prisma.checklistTemplateItem.deleteMany({ where: { templateId: params.id } });
  }

  const updated = await prisma.checklistTemplate.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.category !== undefined && { category: parsed.data.category }),
      ...(parsed.data.items !== undefined && {
        items: { create: parsed.data.items },
      }),
    },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return Response.json({ data: updated });
});
