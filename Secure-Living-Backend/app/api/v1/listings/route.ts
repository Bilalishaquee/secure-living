import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";

const createListingSchema = z.object({
  unitId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  rentAmount: z.number().positive(),
  currency: z.string().default("KES"),
  availableFrom: z.string().min(1),
  leaseDuration: z.string().optional(),
  furnished: z.boolean().default(false),
  petFriendly: z.boolean().default(false),
  features: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
});

export const GET = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url);
  const pub = url.searchParams.get("public") === "true";

  if (pub) {
    // Public: return only PUBLISHED listings (no auth required)
    const rows = await prisma.listing.findMany({
      where: { status: "PUBLISHED" },
      include: { unit: { select: { unitNumber: true, unitType: true, bedrooms: true, bathrooms: true, sizeSqft: true, propertyId: true } } },
      orderBy: { publishedAt: "desc" },
    });
    return Response.json({ data: rows });
  }

  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const orgId = actor.orgIds?.[0];
  const rows = await prisma.listing.findMany({
    where: { organizationId: orgId ?? undefined },
    include: {
      unit: { select: { unitNumber: true, unitType: true, bedrooms: true, bathrooms: true, sizeSqft: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const orgId = actor.orgIds?.[0];
  if (!orgId) return Response.json({ error: "No organization" }, { status: 400 });

  const parsed = await parseBody(req, createListingSchema);
  if (!parsed.ok) return parsed.response;

  const unit = await prisma.unit.findUnique({ where: { id: parsed.data.unitId } });
  if (!unit) return Response.json({ error: "Unit not found" }, { status: 404 });

  const existing = await prisma.listing.findUnique({ where: { unitId: parsed.data.unitId } });
  if (existing) return Response.json({ error: "Unit already has a listing" }, { status: 409 });

  const row = await prisma.listing.create({
    data: {
      organizationId: orgId,
      unitId: parsed.data.unitId,
      title: parsed.data.title,
      description: parsed.data.description,
      rentAmount: parsed.data.rentAmount,
      currency: parsed.data.currency,
      availableFrom: new Date(parsed.data.availableFrom),
      leaseDuration: parsed.data.leaseDuration,
      furnished: parsed.data.furnished,
      petFriendly: parsed.data.petFriendly,
      features: parsed.data.features,
      photos: parsed.data.photos,
      status: "DRAFT",
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
