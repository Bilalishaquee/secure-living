import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const upsertSchema = z.object({
  tenantId: z.string().min(1),
  score: z.number().int().min(0).max(100),
  consistency: z.number().min(0).max(100).optional(),
  totalPaidOnTime: z.number().int().default(0),
  totalPaidLate: z.number().int().default(0),
  totalArrears: z.number().default(0),
  averageDaysEarly: z.number().int().default(0),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");

  if (tenantId) {
    const row = await prisma.rentScoreRecord.findUnique({ where: { tenantId } });
    if (!row) return Response.json({ data: null });
    return Response.json({ data: row });
  }

  const rows = await prisma.rentScoreRecord.findMany({
    orderBy: { lastUpdatedAt: "desc" },
  });
  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, upsertSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.rentScoreRecord.upsert({
    where: { tenantId: body.tenantId },
    create: {
      id: randomUUID(),
      tenantId: body.tenantId,
      score: body.score,
      consistency: body.consistency ?? 0,
      totalPaidOnTime: body.totalPaidOnTime,
      totalPaidLate: body.totalPaidLate,
      totalArrears: body.totalArrears,
      averageDaysEarly: body.averageDaysEarly,
    },
    update: {
      score: body.score,
      consistency: body.consistency ?? undefined,
      totalPaidOnTime: body.totalPaidOnTime,
      totalPaidLate: body.totalPaidLate,
      totalArrears: body.totalArrears,
      averageDaysEarly: body.averageDaysEarly,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
