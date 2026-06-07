import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  fileUrl: z.string().url().optional(),
  fileFormat: z.enum(["pdf", "docx"]).optional(),
  fileSizeBytes: z.number().int().nullable().optional(),
  isActive: z.boolean().optional(),
  propertyId: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const row = await prisma.leaseTemplate.findUnique({ where: { id: params.id } });
  if (!row) return jsonError(404, "Not found");

  return Response.json({ data: row });
});

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const existing = await prisma.leaseTemplate.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.leaseTemplate.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.fileUrl !== undefined && { fileUrl: parsed.data.fileUrl }),
      ...(parsed.data.fileFormat !== undefined && { fileFormat: parsed.data.fileFormat }),
      ...(parsed.data.fileSizeBytes !== undefined && { fileSizeBytes: parsed.data.fileSizeBytes }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      ...(parsed.data.propertyId !== undefined && { propertyId: parsed.data.propertyId }),
      ...(parsed.data.unitId !== undefined && { unitId: parsed.data.unitId }),
    },
  });

  return Response.json({ data: updated });
});

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const existing = await prisma.leaseTemplate.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  await prisma.leaseTemplate.delete({ where: { id: params.id } });
  return Response.json({ data: { deleted: true } });
});
