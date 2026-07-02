import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";
import { assertNoContactLeaks } from "@/lib/server/listing-content-policy";

const customAttributeSchema = z.object({
  key: z.string().min(1).max(60),
  label: z.string().min(1).max(100),
  value: z.string().max(500),
});

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
  customAttributes: z.array(customAttributeSchema).default([]),
  contactUnlockFeeKes: z.number().positive().optional(),
  depositModel: z.enum(["LANDLORD_RESERVE", "DEPOSIT_ESCROW"]).default("LANDLORD_RESERVE"),
});

export const GET = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url);
  const pub = url.searchParams.get("public") === "true";

  if (pub) {
    // Public: return only PUBLISHED listings (no auth required)
    const rows = await prisma.listing.findMany({
      where: { status: "PUBLISHED" },
      include: { unit: { select: { unitNumber: true, unitType: true, bedrooms: true, bathrooms: true, sizeSqft: true, propertyId: true } } },
      orderBy: [{ escrowBadge: "desc" }, { fullyCoveredBadge: "desc" }, { publishedAt: "desc" }],
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

  const contactLeaks = assertNoContactLeaks({ title: parsed.data.title, description: parsed.data.description });
  if (contactLeaks.length > 0) return Response.json({ error: contactLeaks.join("; ") }, { status: 400 });

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
      customAttributes: parsed.data.customAttributes,
      contactUnlockFeeKes: parsed.data.contactUnlockFeeKes,
      depositModel: parsed.data.depositModel,
      escrowBadge: parsed.data.depositModel === "DEPOSIT_ESCROW",
      status: "DRAFT",
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
