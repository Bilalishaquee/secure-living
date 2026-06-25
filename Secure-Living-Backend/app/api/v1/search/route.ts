import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  href: string;
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 8), 20);
  if (q.length < 2) return Response.json({ data: [] });

  const isGlobal = actor.role === "super_admin" || actor.permissions.includes("*");
  const orgFilter = isGlobal ? {} : { organizationId: { in: actor.orgIds } };
  const branchFilter = isGlobal ? {} : { branchId: { in: actor.branchIds } };
  const invoiceScope = isGlobal ? {} : { Lease: { organizationId: { in: actor.orgIds } } };
  const contains = { contains: q, mode: "insensitive" as const };

  const [properties, units, leases, invoices, serviceRequests, providers, visitors, listings] =
    await Promise.all([
      prisma.property.findMany({
        where: {
          ...orgFilter,
          OR: [
            { id: contains },
            { name: contains },
            { propertyCode: contains },
            { addressLine1: contains },
            { city: contains },
          ],
        },
        take: limit,
        select: { id: true, name: true, propertyCode: true, city: true },
      }),
      prisma.unit.findMany({
        where: {
          ...orgFilter,
          OR: [{ id: contains }, { unitNumber: contains }, { unitType: contains }, { status: contains }],
        },
        take: limit,
        select: { id: true, propertyId: true, unitNumber: true, unitType: true, status: true },
      }),
      prisma.lease.findMany({
        where: {
          ...orgFilter,
          ...branchFilter,
          OR: [{ id: contains }, { propertyId: contains }, { unitId: contains }, { tenantUserId: contains }, { status: contains }],
        },
        take: limit,
        select: { id: true, propertyId: true, unitId: true, tenantUserId: true, status: true },
      }),
      prisma.rentInvoice.findMany({
        where: {
          ...invoiceScope,
          OR: [{ id: contains }, { invoiceNumber: contains }, { unitId: contains }, { tenantId: contains }, { status: contains }],
        },
        take: limit,
        select: { id: true, invoiceNumber: true, unitId: true, tenantId: true, status: true },
      }),
      prisma.serviceRequest.findMany({
        where: {
          ...orgFilter,
          OR: [{ id: contains }, { title: contains }, { description: contains }, { propertyId: contains }, { unitId: contains }],
        },
        take: limit,
        select: { id: true, title: true, srStatus: true, serviceType: true },
      }),
      prisma.serviceProvider.findMany({
        where: {
          ...orgFilter,
          OR: [{ id: contains }, { userId: contains }, { bio: contains }, { verificationLevel: contains }],
        },
        take: limit,
        select: { id: true, userId: true, category: true, status: true },
      }),
      prisma.visitor.findMany({
        where: {
          ...orgFilter,
          OR: [{ id: contains }, { name: contains }, { phone: contains }, { email: contains }, { idNumber: contains }],
        },
        take: limit,
        select: { id: true, name: true, phone: true, unitId: true, isBlacklisted: true },
      }),
      prisma.listing.findMany({
        where: {
          ...orgFilter,
          OR: [{ id: contains }, { title: contains }, { description: contains }],
        },
        take: limit,
        select: { id: true, title: true, status: true, unitId: true },
      }),
    ]);

  const data: SearchResult[] = [
    ...properties.map((p) => ({
      id: p.id,
      type: "Property",
      title: p.name,
      subtitle: [p.propertyCode, p.city].filter(Boolean).join(" - "),
      href: `/properties/${p.id}`,
    })),
    ...units.map((u) => ({
      id: u.id,
      type: "Unit",
      title: u.unitNumber,
      subtitle: `${u.unitType} - ${u.status}`,
      href: `/properties/${u.propertyId}/units/${u.id}`,
    })),
    ...leases.map((l) => ({
      id: l.id,
      type: "Lease",
      title: l.id,
      subtitle: `${l.status} - Unit ${l.unitId}`,
      href: `/leasing/${l.id}`,
    })),
    ...invoices.map((i) => ({
      id: i.id,
      type: "Invoice",
      title: text(i.invoiceNumber) || i.id,
      subtitle: `${i.status} - Unit ${i.unitId}`,
      href: "/rent-collection",
    })),
    ...serviceRequests.map((sr) => ({
      id: sr.id,
      type: "Service Request",
      title: sr.title,
      subtitle: `${sr.serviceType} - ${sr.srStatus}`,
      href: `/service-requests/${sr.id}`,
    })),
    ...providers.map((p) => ({
      id: p.id,
      type: "Provider",
      title: p.userId,
      subtitle: `${p.category} - ${p.status}`,
      href: "/providers",
    })),
    ...visitors.map((v) => ({
      id: v.id,
      type: "Visitor",
      title: v.name,
      subtitle: [v.phone, v.unitId, v.isBlacklisted ? "Blacklisted" : ""].filter(Boolean).join(" - "),
      href: "/visitors",
    })),
    ...listings.map((l) => ({
      id: l.id,
      type: "Listing",
      title: l.title,
      subtitle: `${l.status} - Unit ${l.unitId}`,
      href: `/listings/${l.id}`,
    })),
  ];

  return Response.json({ data: data.slice(0, limit) });
});
