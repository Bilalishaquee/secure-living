import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type PresetItem = { section: string; item: string; defaultQty?: number };

type Preset = {
  key: string;
  name: string;
  category: "RESIDENTIAL" | "FURNISHED" | "COMMERCIAL" | "SHORT_STAY";
  description: string;
  items: PresetItem[];
};

// Built-in inspection templates (Secure Living Digital Inspection Checklist spec
// + the real MIDDY Suites house checklist).
const PRESETS: Preset[] = [
  {
    key: "STANDARD_RESIDENTIAL",
    name: "Standard Residential",
    category: "RESIDENTIAL",
    description: "General residential move-in/move-out inspection.",
    items: [
      { section: "Living Room", item: "Wall Paint" },
      { section: "Living Room", item: "Ceiling" },
      { section: "Living Room", item: "Floor / Tiles" },
      { section: "Living Room", item: "Windows & Panes" },
      { section: "Living Room", item: "Curtain Rods & Supports" },
      { section: "Kitchen", item: "Kitchen Sink" },
      { section: "Kitchen", item: "Kitchen Cabinets & Handles" },
      { section: "Kitchen", item: "Granite Tops" },
      { section: "Kitchen", item: "Taps" },
      { section: "Bathroom", item: "Shower / Instant Shower" },
      { section: "Bathroom", item: "Toilet Basin / Cistern" },
      { section: "Bathroom", item: "Hand Wash Sink" },
      { section: "Bathroom", item: "Mirror" },
      { section: "Bedroom", item: "Wardrobe & Handles" },
      { section: "Bedroom", item: "Interior Doors & Locks" },
      { section: "Doors & Keys", item: "Main Door Keys", defaultQty: 2 },
      { section: "Doors & Keys", item: "Bedroom Door Keys", defaultQty: 2 },
      { section: "Doors & Keys", item: "Toilet Door Keys", defaultQty: 2 },
      { section: "Electrical", item: "Wiring, Bulb Holders & Sockets" },
      { section: "Electrical", item: "Wall Sockets & Switches" },
      { section: "Plumbing", item: "General Plumbing, Pipes & Fittings" },
      { section: "Safety", item: "Fire Extinguisher" },
      { section: "Utility", item: "Prepay Electricity Meter (Reading)" },
      { section: "Utility", item: "Water Meter (Reading)" },
    ],
  },
  {
    key: "FURNISHED_UNIT",
    name: "Furnished Unit",
    category: "FURNISHED",
    description: "Furnished apartment with furniture, appliances and electronics.",
    items: [
      { section: "Furniture", item: "Sofa Set" },
      { section: "Furniture", item: "Dining Table" },
      { section: "Furniture", item: "Dining Chairs", defaultQty: 6 },
      { section: "Furniture", item: "Beds" },
      { section: "Furniture", item: "Wardrobe" },
      { section: "Appliances", item: "Refrigerator" },
      { section: "Appliances", item: "Cooker / Oven" },
      { section: "Appliances", item: "Microwave" },
      { section: "Appliances", item: "Washing Machine" },
      { section: "Electronics", item: "Television" },
      { section: "Electronics", item: "Water Heater" },
      { section: "Kitchenware", item: "Cutlery & Utensils" },
      { section: "Linen", item: "Curtains", defaultQty: 4 },
      { section: "Linen", item: "Bedding" },
      { section: "Doors & Keys", item: "Door Keys", defaultQty: 3 },
      { section: "Utility", item: "Electricity Meter (Reading)" },
      { section: "Utility", item: "Water Meter (Reading)" },
    ],
  },
  {
    key: "COMMERCIAL",
    name: "Commercial",
    category: "COMMERCIAL",
    description: "Commercial unit with HVAC, fire and security systems.",
    items: [
      { section: "Structure", item: "Walls & Partitions" },
      { section: "Structure", item: "Flooring" },
      { section: "Structure", item: "Ceiling" },
      { section: "HVAC", item: "Air Conditioning Units" },
      { section: "HVAC", item: "Ventilation" },
      { section: "Fire Equipment", item: "Fire Extinguishers", defaultQty: 2 },
      { section: "Fire Equipment", item: "Smoke Detectors" },
      { section: "Fire Equipment", item: "Emergency Exit Signage" },
      { section: "Security Systems", item: "CCTV Cameras" },
      { section: "Security Systems", item: "Access Control / Locks" },
      { section: "Security Systems", item: "Alarm System" },
      { section: "Electrical", item: "Distribution Board" },
      { section: "Electrical", item: "Sockets & Switches" },
      { section: "Plumbing", item: "Washrooms & Fittings" },
      { section: "Utility", item: "Electricity Meter (Reading)" },
      { section: "Utility", item: "Water Meter (Reading)" },
    ],
  },
  {
    key: "SHORT_STAY",
    name: "Short Stay",
    category: "SHORT_STAY",
    description: "Short stay / Airbnb turnover checklist.",
    items: [
      { section: "Linen", item: "Towels", defaultQty: 4 },
      { section: "Linen", item: "Bed Linen", defaultQty: 2 },
      { section: "Linen", item: "Pillows", defaultQty: 4 },
      { section: "Kitchenware", item: "Plates & Bowls", defaultQty: 6 },
      { section: "Kitchenware", item: "Glasses & Mugs", defaultQty: 6 },
      { section: "Kitchenware", item: "Cutlery Set" },
      { section: "Kitchenware", item: "Cooking Pots & Pans" },
      { section: "Appliances", item: "Kettle" },
      { section: "Appliances", item: "Microwave" },
      { section: "Appliances", item: "Refrigerator" },
      { section: "Appliances", item: "TV & Remote" },
      { section: "Bathroom", item: "Toiletries & Amenities" },
      { section: "Bathroom", item: "Shower & Fittings" },
      { section: "General", item: "Cleanliness" },
      { section: "Doors & Keys", item: "Access Keys / Cards", defaultQty: 2 },
    ],
  },
];

// GET — list the available preset catalog (no DB writes).
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "checklist:view");
  if (denied) return denied;

  return Response.json({
    data: PRESETS.map((p) => ({
      key: p.key,
      name: p.name,
      category: p.category,
      description: p.description,
      itemCount: p.items.length,
    })),
  });
});

const applySchema = z.object({
  preset: z.string().min(1),
  name: z.string().optional(),
});

// POST — instantiate a preset as a real org-scoped template the landlord can edit.
export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "checklist:create");
  if (denied) return denied;

  const orgId = actor.orgIds?.[0];
  if (!orgId) return jsonError(400, "No organization");

  const parsed = await parseBody(req, applySchema);
  if (!parsed.ok) return parsed.response;

  const preset = PRESETS.find((p) => p.key === parsed.data.preset);
  if (!preset) return jsonError(404, "Preset not found");

  const template = await prisma.checklistTemplate.create({
    data: {
      organizationId: orgId,
      name: parsed.data.name ?? preset.name,
      description: preset.description,
      category: preset.category,
      items: {
        create: preset.items.map((it, idx) => ({
          section: it.section,
          item: it.item,
          defaultQty: it.defaultQty ?? 1,
          order: idx,
        })),
      },
    },
    include: { items: { orderBy: { order: "asc" } } },
  });

  return Response.json({ data: template }, { status: 201 });
});
