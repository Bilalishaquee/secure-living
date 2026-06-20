import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.enum(["RESIDENTIAL", "FURNISHED", "COMMERCIAL", "SHORT_STAY", "CUSTOM"]).optional(),
  description: z.string().max(500).optional(),
  items: z.array(z.object({
    section: z.string().default("General"),
    item: z.string().min(1),
    defaultQty: z.number().int().positive().default(1),
    order: z.number().int().default(0),
  })).optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "inspection:view");
  if (denied) return denied;

  const orgId = actor.orgIds[0] ?? actor.userId;
  const rows = await prisma.checklistTemplate.findMany({
    where: { organizationId: orgId },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "inspection:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;

  const orgId = actor.orgIds[0] ?? actor.userId;
  const row = await prisma.checklistTemplate.create({
    data: {
      id: randomUUID(),
      organizationId: orgId,
      name: b.name,
      category: b.category ?? "CUSTOM",
      description: b.description ?? null,
    },
  });

  if (b.items && b.items.length > 0) {
    await prisma.checklistTemplateItem.createMany({
      data: b.items.map((it) => ({
        id: randomUUID(),
        templateId: row.id,
        section: it.section,
        item: it.item,
        defaultQty: it.defaultQty,
        order: it.order,
      })),
    });
  }

  const full = await prisma.checklistTemplate.findUnique({
    where: { id: row.id },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return Response.json({ data: full }, { status: 201 });
});