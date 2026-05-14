import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateListingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  rentAmount: z.number().positive().optional(),
  currency: z.string().optional(),
  availableFrom: z.string().optional(),
  leaseDuration: z.string().nullable().optional(),
  furnished: z.boolean().optional(),
  petFriendly: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      unit: { select: { unitNumber: true, unitType: true, bedrooms: true, bathrooms: true, sizeSqft: true, propertyId: true } },
      _count: { select: { applications: true } },
    },
  });
  if (!listing) return jsonError(404, "Listing not found");
  if (listing.status !== "PUBLISHED") {
    const actor = requireActor(req);
    if (actor instanceof Response) return actor;
  }
  return Response.json({ data: listing });
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return jsonError(404, "Listing not found");

  const orgId = actor.orgIds?.[0];
  if (listing.organizationId !== orgId) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, updateListingSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.rentAmount !== undefined && { rentAmount: parsed.data.rentAmount }),
      ...(parsed.data.currency !== undefined && { currency: parsed.data.currency }),
      ...(parsed.data.availableFrom !== undefined && { availableFrom: new Date(parsed.data.availableFrom) }),
      ...(parsed.data.leaseDuration !== undefined && { leaseDuration: parsed.data.leaseDuration }),
      ...(parsed.data.furnished !== undefined && { furnished: parsed.data.furnished }),
      ...(parsed.data.petFriendly !== undefined && { petFriendly: parsed.data.petFriendly }),
      ...(parsed.data.features !== undefined && { features: parsed.data.features }),
      ...(parsed.data.photos !== undefined && { photos: parsed.data.photos }),
    },
  });

  return Response.json({ data: updated });
});
