import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "listing:view");
  if (denied) return denied;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return jsonError(404, "Listing not found");

  const orgId = actor.orgIds?.[0];
  if (listing.organizationId !== orgId) return jsonError(403, "Forbidden");

  const rows = await prisma.rentalApplication.findMany({
    where: { listingId: params.id },
    orderBy: { submittedAt: "desc" },
  });

  return Response.json({ data: rows });
});
