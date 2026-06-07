import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const createSchema = z.object({
  recordType: z.string().min(1),
  status: z.enum(["PASS", "FAIL", "PENDING", "WAIVED"]),
  description: z.string().optional(),
  evidenceUrl: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const complianceNumber = await prisma.complianceNumber.findUnique({ where: { id: params.id } });
  if (!complianceNumber) return jsonError(404, "Compliance number not found");

  const rows = await prisma.complianceRecord.findMany({
    where: { complianceNumberId: params.id },
    orderBy: { checkedAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const complianceNumber = await prisma.complianceNumber.findUnique({ where: { id: params.id } });
  if (!complianceNumber) return jsonError(404, "Compliance number not found");

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.complianceRecord.create({
    data: {
      id: randomUUID(),
      complianceNumberId: params.id,
      recordType: body.recordType,
      status: body.status,
      description: body.description ?? null,
      evidenceUrl: body.evidenceUrl ?? null,
      checkedBy: actor.userId,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
