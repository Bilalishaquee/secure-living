import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "APPLIED", "COMPLETED", "EXPIRED"]),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const row = await prisma.qrApplication.findUnique({ where: { id: params.id } });
  if (!row) return jsonError(404, "Not found");

  return Response.json({ data: row });
});

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const existing = await prisma.qrApplication.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const parsed = await parseBody(req, updateStatusSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.qrApplication.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return Response.json({ data: updated });
});
