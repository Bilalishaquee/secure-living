import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler, parseBody } from "@/lib/server/http";
import { z } from "zod";

const createSchema = z.object({
  unitId: z.string().min(1),
  meterNumber: z.string().min(1),
  type: z.enum(["WATER", "ELECTRICITY"]),
  billingModel: z.enum(["FLAT_RATE", "SUB_METERED_MANUAL", "SUB_METERED_IOT"]).default("FLAT_RATE"),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const unitId = url.searchParams.get("unitId");
  const propertyId = url.searchParams.get("propertyId");

  const meters = await prisma.utilityMeter.findMany({
    where: {
      ...(unitId ? { unitId } : {}),
      ...(propertyId ? { unit: { propertyId } } : {}),
      isActive: true,
    },
    include: {
      readings: {
        orderBy: { readingDate: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: meters });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const { unitId, meterNumber, type, billingModel } = parsed.data;

  // IoT billing model is deferred — show message if selected
  if (billingModel === "SUB_METERED_IOT") {
    return jsonError(400, "IoT meter integration is coming soon. We will notify you when it is available.");
  }

  const meter = await prisma.utilityMeter.create({
    data: { unitId, meterNumber, type, billingModel },
  });

  return Response.json({ data: meter }, { status: 201 });
});
