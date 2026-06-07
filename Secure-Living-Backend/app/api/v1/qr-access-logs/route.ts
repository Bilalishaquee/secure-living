import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  qrToken: z.string().min(1),
  userId: z.string().optional(),
  visitorId: z.string().optional(),
  accessType: z.string().min(1),
  granted: z.boolean().default(true),
  reason: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const qrToken = url.searchParams.get("qrToken");
  const userId = url.searchParams.get("userId");

  const where: Record<string, unknown> = {};
  if (qrToken) where.qrToken = qrToken;
  if (userId) where.userId = userId;

  const rows = await prisma.qrAccessLog.findMany({
    where,
    orderBy: { accessedAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.qrAccessLog.create({
    data: {
      id: randomUUID(),
      qrToken: body.qrToken,
      userId: body.userId ?? null,
      visitorId: body.visitorId ?? null,
      accessType: body.accessType,
      granted: body.granted,
      reason: body.reason ?? null,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
