import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler, parseBody } from "@/lib/server/http";
import { z } from "zod";

const createSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1),
  allocationMethod: z.enum(["PRO_RATA", "FLAT_AMOUNT"]).default("PRO_RATA"),
  amountKes: z.number().positive().optional(),
}).refine(
  (d) => d.allocationMethod !== "FLAT_AMOUNT" || d.amountKes !== undefined,
  { message: "amountKes is required for FLAT_AMOUNT allocation" }
);

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  if (!propertyId) return jsonError(400, "propertyId is required");

  const charges = await prisma.serviceCharge.findMany({
    where: { propertyId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ data: charges });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;

  const charge = await prisma.serviceCharge.create({
    data: {
      propertyId: parsed.data.propertyId,
      name: parsed.data.name,
      allocationMethod: parsed.data.allocationMethod as any,
      amountKes: parsed.data.amountKes !== undefined ? parsed.data.amountKes : null,
    },
  });

  return Response.json({ data: charge }, { status: 201 });
});
