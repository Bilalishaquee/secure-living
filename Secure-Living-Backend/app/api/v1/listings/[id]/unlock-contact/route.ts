import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const DEFAULT_CONTACT_UNLOCK_FEE_KES = 50;

// Records that the actor has paid the contact-unlock fee for a listing so
// GET /api/v1/listings/[id] will include the property address + agent contact.
//
// NOTE: this endpoint records the unlock grant only — it does not yet debit a real
// wallet or verify an M-Pesa/payment-gateway charge. Wiring a live payment check here
// is deliberately deferred (see UPDATE.md implementation report); do not treat `paidAt`
// as proof of a completed financial transaction until that's wired in.
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return jsonError(404, "Listing not found");
  if (listing.status !== "PUBLISHED") return jsonError(400, "Listing is not published");

  const feeKes = listing.contactUnlockFeeKes ?? DEFAULT_CONTACT_UNLOCK_FEE_KES;

  const unlock = await prisma.listingContactUnlock.upsert({
    where: { listingId_unlockedByUserId: { listingId: listing.id, unlockedByUserId: actor.userId } },
    update: {},
    create: {
      id: randomUUID(),
      listingId: listing.id,
      unlockedByUserId: actor.userId,
      amountKes: feeKes,
    },
  });

  return Response.json({ data: unlock }, { status: 201 });
});
