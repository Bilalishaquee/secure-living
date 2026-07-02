import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";
import { assertNoContactLeaks } from "@/lib/server/listing-content-policy";

type Ctx = { params: { id: string } };

const customAttributeSchema = z.object({
  key: z.string().min(1).max(60),
  label: z.string().min(1).max(100),
  value: z.string().max(500),
});

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
  customAttributes: z.array(customAttributeSchema).optional(),
  contactUnlockFeeKes: z.number().positive().nullable().optional(),
  depositModel: z.enum(["LANDLORD_RESERVE", "DEPOSIT_ESCROW"]).optional(),
});

const DEFAULT_CONTACT_UNLOCK_FEE_KES = 50;

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      unit: { select: { unitNumber: true, unitType: true, bedrooms: true, bathrooms: true, sizeSqft: true, propertyId: true } },
      _count: { select: { applications: true } },
    },
  });
  if (!listing) return jsonError(404, "Listing not found");

  let actor = null;
  if (listing.status !== "PUBLISHED") {
    const a = requireActor(req);
    if (a instanceof Response) return a;
    actor = a;
  } else {
    const a = requireActor(req);
    if (!(a instanceof Response)) actor = a;
  }

  const feeKes = listing.contactUnlockFeeKes ?? DEFAULT_CONTACT_UNLOCK_FEE_KES;
  let contact: { addressLine1: string; addressLine2: string | null; county: string | null; agentPhone: string | null } | null = null;

  if (actor) {
    const isOrgMember = actor.permissions.includes("*") || actor.orgIds.includes(listing.organizationId);
    const unlock = isOrgMember
      ? true
      : await prisma.listingContactUnlock.findUnique({
          where: { listingId_unlockedByUserId: { listingId: listing.id, unlockedByUserId: actor.userId } },
        });
    if (unlock) {
      const property = await prisma.property.findUnique({ where: { id: listing.unit.propertyId } });
      if (property) {
        const contactUserId = property.managerUserId ?? property.ownerUserId;
        const contactUser = contactUserId ? await prisma.appUser.findUnique({ where: { id: contactUserId } }) : null;
        contact = {
          addressLine1: property.addressLine1,
          addressLine2: property.addressLine2,
          county: property.county,
          agentPhone: contactUser?.phone ?? null,
        };
      }
    }
  }

  return Response.json({ data: { ...listing, contactUnlockFeeKes: feeKes, unlockedContact: contact } });
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

  const contactLeaks = assertNoContactLeaks({ title: parsed.data.title, description: parsed.data.description });
  if (contactLeaks.length > 0) return Response.json({ error: contactLeaks.join("; ") }, { status: 400 });

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
      ...(parsed.data.customAttributes !== undefined && { customAttributes: parsed.data.customAttributes }),
      ...(parsed.data.contactUnlockFeeKes !== undefined && { contactUnlockFeeKes: parsed.data.contactUnlockFeeKes }),
      ...(parsed.data.depositModel !== undefined && {
        depositModel: parsed.data.depositModel,
        escrowBadge: parsed.data.depositModel === "DEPOSIT_ESCROW",
      }),
    },
  });

  return Response.json({ data: updated });
});
