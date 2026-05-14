import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const createStockSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  unitCost: z.number().nonnegative(),
  quantityInStock: z.number().int().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(5),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "short-stay:view");
  if (denied) return denied;

  const ssp = await prisma.shortStayProperty.findUnique({ where: { id: params.id } });
  if (!ssp) return jsonError(404, "Short-stay property not found");

  const rows = await prisma.stockItem.findMany({
    where: { shortStayId: params.id },
    orderBy: { name: "asc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "short-stay:manage");
  if (denied) return denied;

  const ssp = await prisma.shortStayProperty.findUnique({ where: { id: params.id } });
  if (!ssp) return jsonError(404, "Short-stay property not found");

  const orgId = actor.orgIds?.[0];
  if (ssp.organizationId !== orgId) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, createStockSchema);
  if (!parsed.ok) return parsed.response;

  const row = await prisma.stockItem.create({
    data: { shortStayId: params.id, ...parsed.data },
  });

  return Response.json({ data: row }, { status: 201 });
});
