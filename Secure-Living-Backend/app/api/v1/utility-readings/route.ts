import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler, parseBody } from "@/lib/server/http";
import { z } from "zod";

const createSchema = z.object({
  meterId: z.string().min(1),
  readingDate: z.string().datetime(),
  previousReading: z.number().min(0),
  currentReading: z.number().min(0),
  flatRateAmountKes: z.number().positive().optional(),
  // Optional per-reading tariff override; falls back to the meter's pricePerUnitKes.
  pricePerUnitKes: z.number().positive().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const reviseSchema = z.object({
  readingId: z.string().min(1),
  currentReading: z.number().min(0),
  revisionReason: z.string().min(1),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const meterId = url.searchParams.get("meterId");
  if (!meterId) return jsonError(400, "meterId is required");

  const readings = await prisma.utilityReading.findMany({
    where: { meterId },
    orderBy: { readingDate: "desc" },
    take: 24,
    include: { disputes: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return Response.json({ data: readings });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const { meterId, readingDate, previousReading, currentReading, flatRateAmountKes, pricePerUnitKes, notes, imageUrl } = parsed.data;

  if (currentReading < previousReading) {
    return jsonError(400, "Current reading cannot be less than previous reading");
  }

  const meter = await prisma.utilityMeter.findUnique({ where: { id: meterId } });
  if (!meter) return jsonError(404, "Meter not found");

  const consumption = currentReading - previousReading;

  // Cost = consumption * price-per-unit (e.g. 40 units * 70 = 2,800).
  // Per-reading override wins, otherwise use the meter's tariff.
  const effectivePrice = pricePerUnitKes ?? meter.pricePerUnitKes ?? null;
  const costKes =
    effectivePrice != null
      ? consumption * effectivePrice
      : flatRateAmountKes ?? null;

  const reading = await prisma.utilityReading.create({
    data: {
      meterId,
      readingDate: new Date(readingDate),
      previousReading,
      currentReading,
      consumption,
      flatRateAmountKes,
      pricePerUnitKes: effectivePrice,
      costKes,
      notes: notes ?? null,
      imageUrl,
      createdBy: actor.userId,
    },
  });

  return Response.json({ data: reading }, { status: 201 });
});

// PATCH — revise a reading (landlord can only revise within 24h before invoice is sent)
export const PATCH = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, reviseSchema);
  if (!parsed.ok) return parsed.response;
  const { readingId, currentReading, revisionReason } = parsed.data;

  const original = await prisma.utilityReading.findUnique({ where: { id: readingId } });
  if (!original) return jsonError(404, "Reading not found");

  // Only allow revision within 24h if no invoice sent
  const cutoff = new Date(original.createdAt.getTime() + 24 * 60 * 60 * 1000);
  if (new Date() > cutoff) {
    return jsonError(400, "Reading can only be revised within 24 hours of submission. Use the dispute workflow for later corrections.");
  }

  if (currentReading < original.previousReading) {
    return jsonError(400, "Current reading cannot be less than previous reading");
  }

  const consumption = currentReading - original.previousReading;
  const effectivePrice = original.pricePerUnitKes ?? null;
  const costKes =
    effectivePrice != null
      ? consumption * effectivePrice
      : original.flatRateAmountKes ?? null;

  // Create revision record linked to original
  const revision = await prisma.utilityReading.create({
    data: {
      meterId: original.meterId,
      readingDate: original.readingDate,
      previousReading: original.previousReading,
      currentReading,
      consumption,
      flatRateAmountKes: original.flatRateAmountKes,
      pricePerUnitKes: effectivePrice,
      costKes,
      notes: original.notes,
      imageUrl: original.imageUrl,
      createdBy: actor.userId,
      originalReadingId: original.id,
      revisionReason,
    },
  });

  return Response.json({ data: revision });
});
