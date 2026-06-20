import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

const PRESETS: Record<string, { name: string; category: string; description: string; items: { section: string; item: string; defaultQty: number }[] }> = {
  residential_move_in: {
    name: "Residential Move-In Checklist",
    category: "RESIDENTIAL",
    description: "Standard checklist for residential unit move-in inspection",
    items: [
      { section: "Living Room", item: "Walls - condition and cleanliness", defaultQty: 1 },
      { section: "Living Room", item: "Floor - condition and cleanliness", defaultQty: 1 },
      { section: "Living Room", item: "Ceiling - cracks or water damage", defaultQty: 1 },
      { section: "Kitchen", item: "Cooker/hob functionality", defaultQty: 1 },
      { section: "Kitchen", item: "Sink and taps - working", defaultQty: 1 },
      { section: "Kitchen", item: "Cupboard doors and hinges", defaultQty: 1 },
      { section: "Bathroom", item: "Shower/bath - working", defaultQty: 1 },
      { section: "Bathroom", item: "Toilet - flush and seat", defaultQty: 1 },
      { section: "Bedroom", item: "Window locks working", defaultQty: 1 },
      { section: "General", item: "Electricity - all sockets tested", defaultQty: 1 },
      { section: "General", item: "Water pressure adequate", defaultQty: 1 },
      { section: "General", item: "Smoke detector present and tested", defaultQty: 1 },
    ],
  },
  furnished_inventory: {
    name: "Furnished Unit Inventory",
    category: "FURNISHED",
    description: "Inventory checklist for furnished properties",
    items: [
      { section: "Living Room", item: "Sofa - condition", defaultQty: 1 },
      { section: "Living Room", item: "Coffee table", defaultQty: 1 },
      { section: "Living Room", item: "TV unit / stand", defaultQty: 1 },
      { section: "Bedroom", item: "Bed frame - condition", defaultQty: 1 },
      { section: "Bedroom", item: "Mattress - condition", defaultQty: 1 },
      { section: "Bedroom", item: "Wardrobe - doors and rails", defaultQty: 1 },
      { section: "Kitchen", item: "Refrigerator - working", defaultQty: 1 },
      { section: "Kitchen", item: "Microwave - working", defaultQty: 1 },
      { section: "Kitchen", item: "Cutlery set", defaultQty: 1 },
      { section: "Kitchen", item: "Plates and bowls", defaultQty: 4 },
      { section: "Bathroom", item: "Bath towels", defaultQty: 2 },
    ],
  },
  short_stay_turnover: {
    name: "Short-Stay Turnover Checklist",
    category: "SHORT_STAY",
    description: "Quick checklist for short-stay unit turnovers",
    items: [
      { section: "General", item: "Unit thoroughly cleaned", defaultQty: 1 },
      { section: "General", item: "Fresh linen on all beds", defaultQty: 1 },
      { section: "General", item: "Towels replaced", defaultQty: 1 },
      { section: "Kitchen", item: "Dishes cleaned and stored", defaultQty: 1 },
      { section: "Kitchen", item: "Fridge cleared of previous guest items", defaultQty: 1 },
      { section: "Bathroom", item: "Toiletries restocked", defaultQty: 1 },
      { section: "Bathroom", item: "Bathroom cleaned and sanitised", defaultQty: 1 },
      { section: "General", item: "Welcome materials in place", defaultQty: 1 },
      { section: "General", item: "AC/heater tested", defaultQty: 1 },
      { section: "General", item: "TV remote batteries working", defaultQty: 1 },
    ],
  },
};

const applySchema = z.object({ preset: z.string() });

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "inspection:view");
  if (denied) return denied;

  const data = Object.entries(PRESETS).map(([key, p]) => ({
    key,
    name: p.name,
    category: p.category,
    description: p.description,
    itemCount: p.items.length,
  }));
  return Response.json({ data });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "inspection:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, applySchema);
  if (!parsed.ok) return parsed.response;

  const preset = PRESETS[parsed.data.preset];
  if (!preset) return Response.json({ error: "Unknown preset" }, { status: 400 });

  const orgId = actor.orgIds[0] ?? actor.userId;
  const row = await prisma.checklistTemplate.create({
    data: {
      id: randomUUID(),
      organizationId: orgId,
      name: preset.name,
      category: preset.category,
      description: preset.description,
    },
  });

  await prisma.checklistTemplateItem.createMany({
    data: preset.items.map((it, idx) => ({
      id: randomUUID(),
      templateId: row.id,
      section: it.section,
      item: it.item,
      defaultQty: it.defaultQty,
      order: idx,
    })),
  });

  const full = await prisma.checklistTemplate.findUnique({
    where: { id: row.id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  return Response.json({ data: full }, { status: 201 });
});