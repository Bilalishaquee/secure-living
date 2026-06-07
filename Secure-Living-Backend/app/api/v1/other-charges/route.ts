import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  shortStayId: z.string().min(1),
  bookingId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  amountKes: z.number(),
  chargeType: z.string().min(1),
  isRefundable: z.boolean().default(false),
  isOptional: z.boolean().default(false),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const shortStayId = url.searchParams.get("shortStayId");
  const bookingId = url.searchParams.get("bookingId");

  const where: Record<string, unknown> = {};
  if (shortStayId) where.shortStayId = shortStayId;
  if (bookingId) where.bookingId = bookingId;

  const rows = await prisma.otherCharge.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.otherCharge.create({
    data: {
      id: randomUUID(),
      shortStayId: body.shortStayId,
      bookingId: body.bookingId ?? null,
      name: body.name,
      description: body.description ?? null,
      amountKes: body.amountKes,
      chargeType: body.chargeType,
      isRefundable: body.isRefundable,
      isOptional: body.isOptional,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
