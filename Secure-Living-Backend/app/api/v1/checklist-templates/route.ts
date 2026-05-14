import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

const itemSchema = z.object({
  section: z.string().min(1),
  item: z.string().min(1),
  order: z.number().int().nonnegative(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
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
      items: { create: parsed.data.items },
    },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return Response.json({ data: template }, { status: 201 });
});
