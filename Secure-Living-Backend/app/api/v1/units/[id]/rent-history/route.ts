import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "unit:view");
  if (denied) return denied;

  const unit = await prisma.unit.findUnique({ where: { id: params.id } });
  if (!unit) return jsonError(404, "Unit not found");

  const lease = unit.currentLeaseId
    ? await prisma.lease.findUnique({ where: { id: unit.currentLeaseId } })
    : null;

  let tenantName: string | null = null;
  if (lease?.tenantUserId) {
    const tenant = await prisma.appUser.findUnique({
      where: { id: lease.tenantUserId },
      select: { fullName: true },
    });
    tenantName = tenant?.fullName ?? null;
  }

  const invoices = await prisma.rentInvoice.findMany({
    where: { unitId: params.id },
    orderBy: { periodStart: "desc" },
  });

  const totalArrears = invoices
    .filter((i) => i.status === "overdue" || i.status === "partial")
    .reduce((s, i) => s + i.balanceKes, 0);

  return Response.json({
    data: {
      currentLease: lease
        ? { ...lease, tenantName }
        : null,
      invoices,
      totalArrears,
    },
  });
});
