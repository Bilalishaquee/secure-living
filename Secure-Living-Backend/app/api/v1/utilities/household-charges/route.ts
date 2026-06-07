import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const unitId = url.searchParams.get("unitId");
  const propertyId = url.searchParams.get("propertyId");
  const invoiceId = url.searchParams.get("invoiceId");

  const where: Record<string, unknown> = {};
  if (unitId) where.unitId = unitId;
  if (propertyId) where.propertyId = propertyId;
  if (invoiceId) where.invoiceId = invoiceId;

  const rows = await prisma.utilityHouseholdCharge.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});
