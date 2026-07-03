import { prisma } from "@/lib/server/db";
import { withErrorHandler } from "@/lib/server/http";

type LocationResult = {
  id: string;
  name: string;
  propertyCount: number;
  listingCount: number;
};

const EMPTY_RESULTS = {
  listings: [],
  properties: [],
  locations: [],
  agents: [],
  services: [],
};

function includesQuery(value: string | null | undefined, q: string) {
  return (value ?? "").toLowerCase().includes(q.toLowerCase());
}

function compactLocation(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(", ") || "Kenya";
}

// Public homepage/search page endpoint. This is intentionally unauthenticated
// and intentionally narrow: no phone numbers, exact private contacts, lease data,
// or internal financial data are returned.
export const GET = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 8), 1), 20);

  if (q.length < 2) return Response.json({ data: EMPTY_RESULTS });

  const contains = { contains: q, mode: "insensitive" as const };

  const [nameMatchedUsers, listings, properties, providerCandidates, services] = await Promise.all([
    prisma.appUser.findMany({
      where: { fullName: contains },
      select: { id: true, fullName: true },
      take: 25,
    }),
    prisma.listing.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: contains },
          { description: contains },
          { unit: { unitType: contains } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        rentAmount: true,
        currency: true,
        photos: true,
        escrowBadge: true,
        fullyCoveredBadge: true,
        unit: {
          select: {
            unitType: true,
            bedrooms: true,
            bathrooms: true,
            propertyId: true,
          },
        },
      },
      orderBy: [{ escrowBadge: "desc" }, { fullyCoveredBadge: "desc" }, { publishedAt: "desc" }],
      take: limit,
    }),
    prisma.property.findMany({
      where: {
        status: "active",
        OR: [
          { name: contains },
          { propertyType: contains },
          { city: contains },
          { county: contains },
          { subCounty: contains },
          { country: contains },
          { tagsCsv: contains },
        ],
      },
      select: {
        id: true,
        name: true,
        propertyType: true,
        city: true,
        county: true,
        country: true,
        photosCsv: true,
        totalUnits: true,
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
    prisma.serviceProvider.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        userId: true,
        specializations: true,
        coverageAreas: true,
        bio: true,
        verificationLevel: true,
        trustScore: true,
      },
      orderBy: { trustScore: "desc" },
      take: 50,
    }),
    prisma.serviceCategory.findMany({
      where: {
        isActive: true,
        OR: [
          { name: contains },
          { tagline: contains },
          { description: contains },
        ],
      },
      select: { id: true, slug: true, name: true, tagline: true },
      orderBy: { order: "asc" },
      take: limit,
    }),
  ]);

  const arrayMatchedProviders = providerCandidates.filter((p) => {
    return (
      p.specializations.some((s) => includesQuery(s, q)) ||
      p.coverageAreas.some((area) => includesQuery(area, q)) ||
      includesQuery(p.bio, q) ||
      nameMatchedUsers.some((u) => u.id === p.userId)
    );
  });

  const providerUserIds = Array.from(new Set(arrayMatchedProviders.map((p) => p.userId)));
  const providerUsers = providerUserIds.length
    ? await prisma.appUser.findMany({
        where: { id: { in: providerUserIds } },
        select: { id: true, fullName: true },
      })
    : [];
  const nameByUserId = new Map(providerUsers.map((u) => [u.id, u.fullName]));

  const locationMap = new Map<string, LocationResult>();
  for (const property of properties) {
    for (const value of [property.city, property.county, property.country]) {
      if (!includesQuery(value, q)) continue;
      const name = value ?? "Kenya";
      const current = locationMap.get(name) ?? { id: name.toLowerCase().replace(/\s+/g, "-"), name, propertyCount: 0, listingCount: 0 };
      current.propertyCount += 1;
      locationMap.set(name, current);
    }
  }

  const activePropertyIds = new Set(properties.map((p) => p.id));
  for (const listing of listings) {
    if (!listing.unit?.propertyId || !activePropertyIds.has(listing.unit.propertyId)) continue;
    for (const current of Array.from(locationMap.values())) current.listingCount += 1;
  }

  return Response.json({
    data: {
      listings: listings.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        rentAmount: l.rentAmount,
        currency: l.currency,
        photo: l.photos[0] ?? null,
        escrowBadge: l.escrowBadge,
        fullyCoveredBadge: l.fullyCoveredBadge,
        unitType: l.unit.unitType,
        bedrooms: l.unit.bedrooms,
        bathrooms: l.unit.bathrooms,
      })),
      properties: properties.map((p) => ({
        id: p.id,
        name: p.name,
        propertyType: p.propertyType,
        location: compactLocation(p.city, p.county, p.country),
        photo: p.photosCsv?.split(",").map((s) => s.trim()).find(Boolean) ?? null,
        totalUnits: p.totalUnits,
      })),
      locations: Array.from(locationMap.values())
        .sort((a, b) => b.propertyCount + b.listingCount - (a.propertyCount + a.listingCount))
        .slice(0, limit),
      agents: arrayMatchedProviders.slice(0, limit).map((p) => ({
        id: p.id,
        name: nameByUserId.get(p.userId) ?? "Verified Service Provider",
        specializations: p.specializations,
        coverageAreas: p.coverageAreas,
        verificationLevel: p.verificationLevel,
        trustScore: p.trustScore,
      })),
      services: services.map((s) => ({ id: s.id, slug: s.slug, name: s.name, tagline: s.tagline })),
    },
  });
});
