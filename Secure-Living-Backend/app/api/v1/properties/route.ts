import { randomUUID } from "crypto";
import { hasPermission } from "@/lib/server/authz";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope , withErrorHandler } from "@/lib/server/http";
import { createPropertySchema } from "@/lib/server/validation";

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
  const where = actor.permissions.includes("*")
    ? {}
    : { organizationId: { in: actor.orgIds }, branchId: { in: actor.branchIds } };
  const rows = await prisma.property.findMany({ where, orderBy: { createdAt: "desc" } });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "property:create");
  if (denied) return denied;

  const parsed = await parseBody(req, createPropertySchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const scoped = requireScope(actor, body.organizationId, body.branchId);
  if (scoped) return scoped;

  const row = await prisma.property.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      branchId: body.branchId,
      ownerUserId: body.ownerUserId,
      managerUserId: body.managerUserId,
      name: body.name,
      propertyCode: body.propertyCode,
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
