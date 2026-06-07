import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  tenantId: z.string().min(1),
  behaviorType: z.string().min(1),
  label: z.string().min(1),
  value: z.string().optional(),
  score: z.number().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");
  const behaviorType = url.searchParams.get("behaviorType");

  const where: Record<string, unknown> = {};
  if (tenantId) where.tenantId = tenantId;
  if (behaviorType) where.behaviorType = behaviorType;

  const rows = await prisma.microBehaviorRecord.findMany({
    where,
    orderBy: { detectedAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.microBehaviorRecord.create({
    data: {
      id: randomUUID(),
      tenantId: body.tenantId,
      behaviorType: body.behaviorType,
      label: body.label,
      value: body.value ?? null,
      score: body.score ?? null,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
