import { randomUUID } from "crypto";
import { hasPermission } from "@/lib/server/authz";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { jsonError, parseBody, requireActor, requirePermission, requireScope , withErrorHandler } from "@/lib/server/http";
import { createPropertySchema } from "@/lib/server/validation";

// Property Code acts as the property's "number plate" — always assigned, never duplicated.
// Auto-generates one when the caller doesn't supply it, retrying on the rare collision.
async function resolvePropertyCode(requested: string | undefined): Promise<string> {
  if (requested && requested.trim()) {
    const trimmed = requested.trim().toUpperCase();
    const existing = await prisma.property.findUnique({ where: { propertyCode: trimmed } });
    if (existing) throw new Error(`DUPLICATE_PROPERTY_CODE:${trimmed}`);
    return trimmed;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `PROP-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const existing = await prisma.property.findUnique({ where: { propertyCode: candidate } });
    if (!existing) return candidate;
  }
  throw new Error("Failed to generate a unique property code, please retry");
}

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const canViewProperties = hasPermission(actor, "properties:view");
  const canViewOwnTenantScope = hasPermission(actor, "tenants:view_own");
  if (!canViewProperties && !canViewOwnTenantScope) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  const isGlobal = actor.role === "super_admin" || actor.permissions.includes("*");
  const where = isGlobal
    ? {}
    : actor.orgIds.length > 0
      ? { organizationId: { in: actor.orgIds } }
      : { id: { in: [] as string[] } };
  const rows = await prisma.property.findMany({ where, orderBy: { createdAt: "desc" } });

  // Real unit/occupancy counts (not the manually-entered totalUnits field) so the
  // properties list can show accurate stats, same as the tenants list does.
  const propertyIds = rows.map((p) => p.id);
  const [unitCounts, occupiedCounts] = propertyIds.length
    ? await Promise.all([
        prisma.unit.groupBy({ by: ["propertyId"], where: { propertyId: { in: propertyIds } }, _count: { id: true } }),
        prisma.lease.groupBy({ by: ["propertyId"], where: { propertyId: { in: propertyIds }, status: "active" }, _count: { id: true } }),
      ])
    : [[], []];
  const unitCountMap = new Map(unitCounts.map((u) => [u.propertyId, u._count.id]));
  const occupiedCountMap = new Map(occupiedCounts.map((o) => [o.propertyId, o._count.id]));

  const enriched = rows.map((p) => ({
    ...p,
    unitCount: unitCountMap.get(p.id) ?? 0,
    occupiedUnitCount: occupiedCountMap.get(p.id) ?? 0,
  }));

  return Response.json({ data: enriched });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!hasPermission(actor, "property:create") && !hasPermission(actor, "property:edit")) {
    return jsonError(403, "Forbidden");
  }

  const parsed = await parseBody(req, createPropertySchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const scoped = requireScope(actor, body.organizationId, body.branchId);
  if (scoped) return scoped;

  let propertyCode: string;
  try {
    propertyCode = await resolvePropertyCode(body.propertyCode);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid property code";
    if (msg.startsWith("DUPLICATE_PROPERTY_CODE:")) {
      return jsonError(409, `Property code "${msg.split(":")[1]}" is already in use — each property must have a unique code`);
    }
    return jsonError(500, msg);
  }

  const row = await prisma.property.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      branchId: body.branchId,
      ownerUserId: body.ownerUserId,
      managerUserId: body.managerUserId,
      name: body.name,
      propertyCode,
      propertyType: body.propertyType,
      ownershipType: body.ownershipType,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      county: body.county,
      subCounty: body.subCounty,
      ward: body.ward,
      city: body.city,
      state: body.state,
      country: body.country,
      postalCode: body.postalCode,
      gpsLatitude: body.gpsLatitude,
      gpsLongitude: body.gpsLongitude,
      landReferenceNumber: body.landReferenceNumber,
      titleDeedNumber: body.titleDeedNumber,
      descriptionNotes: body.descriptionNotes,
      yearBuilt: body.yearBuilt,
      totalUnits: body.totalUnits,
      totalSqft: body.totalSqft,
      lotSizeSqft: body.lotSizeSqft,
      totalBathrooms: body.totalBathrooms,
      totalParkingSpaces: body.totalParkingSpaces,
      purchasePriceKes: body.purchasePriceKes,
      acquisitionDate: body.acquisitionDate ? new Date(body.acquisitionDate) : undefined,
      currentValueKes: body.currentValueKes,
      mortgageBalanceKes: body.mortgageBalanceKes,
      marketRentEstimateKes: body.marketRentEstimateKes,
      noiEstimateKes: body.noiEstimateKes,
      capRateEstimate: body.capRateEstimate,
      propertyTaxAnnualKes: body.propertyTaxAnnualKes,
      insuranceProvider: body.insuranceProvider,
      insurancePremiumAnnualKes: body.insurancePremiumAnnualKes,
      insurancePolicyNumber: body.insurancePolicyNumber,
      insuranceExpiryDate: body.insuranceExpiryDate ? new Date(body.insuranceExpiryDate) : undefined,
      hoaFeeMonthlyKes: body.hoaFeeMonthlyKes,
      mortgageLender: body.mortgageLender,
      mortgageInterestRate: body.mortgageInterestRate,
      mortgageLoanTermMonths: body.mortgageLoanTermMonths,
      mortgageMonthlyPaymentKes: body.mortgageMonthlyPaymentKes,
      mortgageStartDate: body.mortgageStartDate ? new Date(body.mortgageStartDate) : undefined,
      mortgageMaturityDate: body.mortgageMaturityDate ? new Date(body.mortgageMaturityDate) : undefined,
      caretaker: body.caretaker,
      utilityProvider: body.utilityProvider,
      listingUrl: body.listingUrl,
      shortTermRentalPlatform: body.shortTermRentalPlatform,
      tagsCsv: body.tags?.join(","),
      amenitiesCsv: body.amenities?.join(","),
      photosCsv: body.photos?.join(","),
      videosCsv: body.videos?.join(","),
      floorPlanUrl: body.floorPlanUrl,
      titleDeedScanUrl: body.titleDeedScanUrl,
      category: body.category,
      managementMode: body.managementMode,
      categoryAttributesJson: body.categoryAttributesJson,
      status: body.status,
      createdBy: actor.userId,
    },
  });
  if (body.propertyRoles?.length) {
    await prisma.propertyRoleAssignment.createMany({
      data: body.propertyRoles.map((r) => ({
        id: randomUUID(),
        propertyId: row.id,
        userId: r.userId,
        roleType: r.roleType,
      })),
    });
  } else {
    const defaults = [
      body.ownerUserId ? { userId: body.ownerUserId, roleType: "owner" } : null,
      body.managerUserId ? { userId: body.managerUserId, roleType: "manager" } : null,
    ].filter(Boolean) as { userId: string; roleType: string }[];
    if (defaults.length) {
      await prisma.propertyRoleAssignment.createMany({
        data: defaults.map((r) => ({
          id: randomUUID(),
          propertyId: row.id,
          userId: r.userId,
          roleType: r.roleType,
        })),
      });
    }
  }

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "property.created",
    resourceType: "property",
    resourceId: row.id,
    orgId: row.organizationId,
    branchId: row.branchId,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: 201 });
})
