import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().optional(),
  score: z.number().min(0).max(100),
  riskLevel: z.enum(["low", "medium", "high"]),
  factorsJson: z.record(z.string(), z.unknown()).optional(),
  predictedDate: z.string().datetime().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  const unitId = url.searchParams.get("unitId");

  const where: Record<string, unknown> = {};
  if (propertyId) where.propertyId = propertyId;
  if (unitId) where.unitId = unitId;

  const rows = await prisma.moveScoreRecord.findMany({
    where,
    orderBy: { generatedAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.moveScoreRecord.create({
    data: {
      id: randomUUID(),
      propertyId: body.propertyId,
      unitId: body.unitId ?? null,
      score: body.score,
      riskLevel: body.riskLevel,
      factorsJson: body.factorsJson as import("@prisma/client").Prisma.InputJsonValue,
      predictedDate: body.predictedDate ? new Date(body.predictedDate) : null,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
