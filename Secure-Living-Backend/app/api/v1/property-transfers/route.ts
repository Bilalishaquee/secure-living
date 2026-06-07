import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  propertyId: z.string().min(1),
  previousOwnerId: z.string().min(1),
  newOwnerId: z.string().min(1),
  transferDate: z.string().datetime().optional(),
  transferType: z.string().min(1),
  saleAmountKes: z.number().optional(),
  notes: z.string().optional(),
  preservedJson: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");

  const where: Record<string, unknown> = {};
  if (propertyId) where.propertyId = propertyId;

  const rows = await prisma.propertyTransferRecord.findMany({
    where,
    orderBy: { transferDate: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.propertyTransferRecord.create({
    data: {
      id: randomUUID(),
      propertyId: body.propertyId,
      previousOwnerId: body.previousOwnerId,
      newOwnerId: body.newOwnerId,
      transferDate: body.transferDate ? new Date(body.transferDate) : new Date(),
      transferType: body.transferType,
      saleAmountKes: body.saleAmountKes ?? null,
      notes: body.notes ?? null,
      preservedJson: body.preservedJson as import("@prisma/client").Prisma.InputJsonValue,
      createdBy: actor.userId,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "property_transfer.created",
    resourceType: "property_transfer",
    resourceId: row.id,
    orgId: actor.orgIds?.[0] ?? null,
    branchId: actor.branchIds?.[0] ?? null,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: 201 });
});
