import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  organizationId: z.string().min(1),
  snapshotType: z.string().min(1),
  label: z.string().min(1),
  value: z.number(),
  previousValue: z.number().optional(),
  trend: z.enum(["up", "down", "stable"]),
  dataJson: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId") || actor.orgIds?.[0];
  const snapshotType = url.searchParams.get("snapshotType");

  if (!organizationId) return Response.json({ data: [] });

  const where: Record<string, unknown> = { organizationId };
  if (snapshotType) where.snapshotType = snapshotType;

  const rows = await prisma.liveIntelligenceSnapshot.findMany({
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

  const row = await prisma.liveIntelligenceSnapshot.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      snapshotType: body.snapshotType,
      label: body.label,
      value: body.value,
      previousValue: body.previousValue ?? null,
      trend: body.trend,
      dataJson: body.dataJson as import("@prisma/client").Prisma.InputJsonValue,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
