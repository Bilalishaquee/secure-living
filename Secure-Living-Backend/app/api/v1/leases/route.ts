import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope , withErrorHandler } from "@/lib/server/http";
import { createLeaseSchema } from "@/lib/server/validation";
import { ensureDepositEscrowForLease, refreshDepositHealth } from "@/lib/server/deposit";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:view");
  if (denied) return denied;

  // Tenants only ever see their own lease(s) — never other tenants' in the same org/branch.
  const where = actor.role === "tenant"
    ? { tenantUserId: actor.userId }
    : actor.permissions.includes("*")
      ? {}
      : {
          branchId: { in: actor.branchIds },
          organizationId: { in: actor.orgIds },
        };

  const rows = await prisma.lease.findMany({
    where,
    include: { depositEscrow: true },
    orderBy: { createdAt: "desc" },
  });

  // Enrich each lease with tenant name + email from AppUser
  const tenantIds = Array.from(new Set(rows.map((r) => r.tenantUserId)));
  const users = tenantIds.length
    ? await prisma.appUser.findMany({
        where: { id: { in: tenantIds } },
        select: { id: true, fullName: true, email: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const refreshed = await Promise.all(rows.map(async (r) => {
    const depositEscrow = r.status === "active" ? await refreshDepositHealth(r.id) : r.depositEscrow;
    return { ...r, depositEscrow };
  }));

  // Exact arrears figure per lease (usability report: "Status: Arrears can show exact
  // figure of arrears"), from overdue/pending rent invoices past their due date.
  const leaseIds = rows.map((r) => r.id);
  const overdueInvoices = leaseIds.length
    ? await prisma.rentInvoice.findMany({
        where: { leaseId: { in: leaseIds }, status: { in: ["pending", "overdue"] }, dueDate: { lt: new Date() } },
        select: { leaseId: true, balanceKes: true },
      })
    : [];
  const arrearsByLease = new Map<string, number>();
  for (const inv of overdueInvoices) {
    arrearsByLease.set(inv.leaseId, (arrearsByLease.get(inv.leaseId) ?? 0) + inv.balanceKes);
  }

  // Tenant Portal "My Lease" needs a readable property name + unit number without granting
  // tenants the broader unit:view permission (which would leak every other unit's current
  // tenant in the same property) — so resolve just their own lease's property/unit here.
  const propertyIds = Array.from(new Set(rows.map((r) => r.propertyId)));
  const unitIds = Array.from(new Set(rows.map((r) => r.unitId)));
  const [properties, units] = await Promise.all([
    propertyIds.length ? prisma.property.findMany({ where: { id: { in: propertyIds } }, select: { id: true, name: true } }) : [],
    unitIds.length ? prisma.unit.findMany({ where: { id: { in: unitIds } }, select: { id: true, unitNumber: true } }) : [],
  ]);
  const propertyMap = new Map(properties.map((p) => [p.id, p.name]));
  const unitMap = new Map(units.map((u) => [u.id, u.unitNumber]));

  const enriched = refreshed.map((r) => ({
    ...r,
    tenantName: userMap.get(r.tenantUserId)?.fullName ?? null,
    tenantEmail: userMap.get(r.tenantUserId)?.email ?? null,
    arrearsKes: arrearsByLease.get(r.id) ?? 0,
    propertyName: propertyMap.get(r.propertyId) ?? null,
    unitNumber: unitMap.get(r.unitId) ?? null,
  }));

  return Response.json({ data: enriched });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:create");
  if (denied) return denied;

  const parsed = await parseBody(req, createLeaseSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const scoped = requireScope(actor, body.organizationId, body.branchId);
  if (scoped) return scoped;

  const row = await prisma.lease.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      branchId: body.branchId,
      propertyId: body.propertyId,
      unitId: body.unitId,
      tenantUserId: body.tenantUserId,
      leaseType: body.leaseType,
      rentAmount: body.rentAmount,
      depositAmount: body.depositAmount,
      depositModel: body.depositModel,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      paymentFrequency: body.paymentFrequency,
      status: "draft",
      createdBy: actor.userId,
    },
  });

  await ensureDepositEscrowForLease(row.id);

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "lease.created",
    resourceType: "lease",
    resourceId: row.id,
    orgId: row.organizationId,
    branchId: row.branchId,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: 201 });
})
