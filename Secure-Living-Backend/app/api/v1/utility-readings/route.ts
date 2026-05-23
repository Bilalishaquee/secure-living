import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler, parseBody } from "@/lib/server/http";
import { z } from "zod";

const createSchema = z.object({
  meterId: z.string().min(1),
  readingDate: z.string().datetime(),
  previousReading: z.number().min(0),
  currentReading: z.number().min(0),
  flatRateAmountKes: z.number().positive().optional(),
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
  const { meterId, readingDate, previousReading, currentReading, flatRateAmountKes, imageUrl } = parsed.data;

  if (currentReading < previousReading) {
    return jsonError(400, "Current reading cannot be less than previous reading");
  }

  const consumption = currentReading - previousReading;

  const reading = await prisma.utilityReading.create({
    data: {
      meterId,
      readingDate: new Date(readingDate),
      previousReading,
      currentReading,
      consumption,
      flatRateAmountKes,
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

  // Create revision record linked to original
  const revision = await prisma.utilityReading.create({
    data: {
      meterId: original.meterId,
      readingDate: original.readingDate,
      previousReading: original.previousReading,
      currentReading,
      consumption,
      imageUrl: original.imageUrl,
      createdBy: actor.userId,
      originalReadingId: original.id,
      revisionReason,
    },
  });

  return Response.json({ data: revision });
});
