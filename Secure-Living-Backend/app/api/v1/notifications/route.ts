import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const isGlobal = actor.permissions.includes("*");
  const orgFilter = isGlobal ? {} : { organizationId: { in: actor.orgIds } };
  const invoiceOrgFilter = isGlobal ? {} : { Lease: { organizationId: { in: actor.orgIds } } };
  const now = new Date();

  const [
    overdueInvoices,
    pendingKyc,
    openDisputes,
    blockedSRs,
    slaBreach,
    pendingInvitations,
  ] = await Promise.all([
    prisma.rentInvoice.findMany({
      where: { ...invoiceOrgFilter, status: { in: ["pending", "overdue"] }, dueDate: { lt: now } },
      select: { id: true, invoiceNumber: true, unitId: true, balanceKes: true, dueDate: true },
      take: 10,
      orderBy: { dueDate: "asc" },
    }),
    prisma.kycDocument.count({ where: { status: "pending" } }),
    prisma.utilityDispute.count({
      where: { status: { in: ["OPEN", "LANDLORD_RESPONDED", "ESCALATED"] } },
    }),
    prisma.serviceRequest.count({
      where: { ...orgFilter, srStatus: "BLOCKED" },
    }),
    prisma.serviceRequest.count({
      where: {
        ...orgFilter,
        srStatus: { in: ["IN_PROGRESS", "ASSIGNED", "SCHEDULING_PENDING"] },
        dueAt: { lt: now },
      },
    }),
    prisma.teamInvitation.count({
      where: { organizationId: { in: actor.orgIds }, status: "pending", expiresAt: { gt: now } },
    }),
  ]);

  type NotificationItem = {
    id: string;
    type: string;
    severity: "high" | "medium" | "low";
    message: string;
    href: string;
  };

  const items: NotificationItem[] = [];

  for (const inv of overdueInvoices) {
    const days = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
    items.push({
      id: `overdue-${inv.id}`,
      type: "overdue_rent",
      severity: days > 30 ? "high" : "medium",
      message: `${inv.invoiceNumber ?? "Invoice"} overdue ${days}d — KES ${inv.balanceKes.toLocaleString()}`,
      href: "/rent-collection/receipts",
    });
  }

  if (openDisputes > 0) {
    items.push({
      id: "disputes",
      type: "dispute",
      severity: "high",
      message: `${openDisputes} utility dispute${openDisputes !== 1 ? "s" : ""} open`,
      href: "/admin/disputes",
    });
  }

  if (pendingKyc > 0) {
    items.push({
      id: "kyc",
      type: "kyc",
      severity: pendingKyc > 5 ? "high" : "medium",
      message: `${pendingKyc} KYC document${pendingKyc !== 1 ? "s" : ""} pending review`,
      href: "/kyc",
    });
  }

  if (blockedSRs > 0) {
    items.push({
      id: "blocked-sr",
      type: "blocked_sr",
      severity: "medium",
      message: `${blockedSRs} service request${blockedSRs !== 1 ? "s" : ""} blocked`,
      href: "/service-requests/manager-queue",
    });
  }

  if (slaBreach > 0) {
    items.push({
      id: "sla-breach",
      type: "sla_breach",
      severity: "high",
      message: `${slaBreach} request${slaBreach !== 1 ? "s" : ""} past SLA deadline`,
      href: "/service-requests/manager-queue",
    });
  }

  if (pendingInvitations > 0) {
    items.push({
      id: "invitations",
      type: "invitation",
      severity: "low",
      message: `${pendingInvitations} team invitation${pendingInvitations !== 1 ? "s" : ""} pending`,
      href: "/team",
    });
  }

  items.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return Response.json({
    data: {
      count: items.length,
      items,
    },
  });
});
