import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const customColumnSchema = z.object({
  key: z.string().min(1).max(60),
  label: z.string().min(1).max(100),
  type: z.enum(["text", "number", "photo", "file", "checkbox"]).default("text"),
});

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  category: z.enum(["RESIDENTIAL", "FURNISHED", "COMMERCIAL", "SHORT_STAY", "CUSTOM"]).optional(),
  description: z.string().max(500).optional(),
  customColumns: z.array(customColumnSchema).optional(),
  items: z.array(z.object({
    section: z.string().default("General"),
    item: z.string().min(1),
    defaultQty: z.number().int().positive().default(1),
    order: z.number().int().default(0),
  })).optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "inspection:view");
  if (denied) return denied;

  const row = await prisma.checklistTemplate.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!row) return jsonError(404, "Checklist template not found");
  return Response.json({ data: row });
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "inspection:manage");
  if (denied) return denied;

  const existing = await prisma.checklistTemplate.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Checklist template not found");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;

  const updated = await prisma.checklistTemplate.update({
    where: { id: params.id },
    data: {
      ...(b.name !== undefined && { name: b.name }),
      ...(b.category !== undefined && { category: b.category }),
      ...(b.description !== undefined && { description: b.description }),
      ...(b.customColumns !== undefined && { customColumns: b.customColumns }),
    },
  });

  if (b.items !== undefined) {
    await prisma.checklistTemplateItem.deleteMany({ where: { templateId: params.id } });
    if (b.items.length > 0) {
      await prisma.checklistTemplateItem.createMany({
        data: b.items.map((it) => ({
          id: randomUUID(),
          templateId: params.id,
          section: it.section,
          item: it.item,
          defaultQty: it.defaultQty,
          order: it.order,
        })),
      });
    }
  }

  const full = await prisma.checklistTemplate.findUnique({
    where: { id: updated.id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  return Response.json({ data: full });
});

export const PATCH = PUT;

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "inspection:manage");
  if (denied) return denied;

  const existing = await prisma.checklistTemplate.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Checklist template not found");

  await prisma.checklistTemplate.delete({ where: { id: params.id } });
  return Response.json({ data: { deleted: true } });
});