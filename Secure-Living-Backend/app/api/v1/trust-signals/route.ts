import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

// GET /api/v1/trust-signals?userId=xxx
// Returns verified transaction counts derived from immutable platform records.
// These are the ONLY public trust signals — no star ratings, no user reviews.
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? actor.userId;

  // Verified leases signed (landlord / agency)
  const leasesSigned = await prisma.lease.count({
    where: { createdBy: userId, status: "active", signedAt: { not: null } },
  });

  // Service requests completed (service provider)
  const jobsCompleted = await prisma.serviceRequest.count({
    where: { createdBy: userId, srStatus: "COMPLETED" },
  });

  // Properties actively managed
  const propertiesManaged = await prisma.property.count({
    where: { managerUserId: userId, status: "active" },
  });

  // Guest stays hosted (short-stay) — join via managed propertyIds since Unit has no Property relation
  const managedPropertyIds = await prisma.property
    .findMany({ where: { managerUserId: userId }, select: { id: true } })
    .then((ps) => ps.map((p) => p.id));
  const guestStaysHosted = managedPropertyIds.length === 0 ? 0 : await prisma.shortStayBooking.count({
    where: {
      shortStay: { unit: { propertyId: { in: managedPropertyIds } } },
      status: "CHECKED_OUT",
    },
  });

  // Tenant screenings processed
  const screeningsCompleted = await prisma.tenantScreeningReport.count({
    where: { generatedBy: userId, status: "completed" },
  });

  // Apply zero-count rule: return null for zero counts (zero is invisible, not shown as "0")
  const signals = {
    leasesSigned: leasesSigned > 0 ? leasesSigned : null,
    jobsCompleted: jobsCompleted > 0 ? jobsCompleted : null,
    propertiesManaged: propertiesManaged > 0 ? propertiesManaged : null,
    guestStaysHosted: guestStaysHosted > 0 ? guestStaysHosted : null,
    screeningsCompleted: screeningsCompleted > 0 ? screeningsCompleted : null,
  };

  return Response.json({ data: signals });
});
