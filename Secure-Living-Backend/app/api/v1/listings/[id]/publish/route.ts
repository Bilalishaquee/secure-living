import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return jsonError(404, "Listing not found");

  const orgId = actor.orgIds?.[0];
  if (listing.organizationId !== orgId) return jsonError(403, "Forbidden");

  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  // Update unit status to reflect it's listed
  await prisma.unit.update({ where: { id: listing.unitId }, data: { status: "vacant" } });

  return Response.json({ data: updated });
});
