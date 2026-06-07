import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateSchema = z.object({
  fieldLabel: z.string().min(1).optional(),
  fieldType: z.enum(["text", "dropdown", "checkbox", "upload", "date", "number"]).optional(),
  fieldOptions: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const row = await prisma.applicationCustomField.findUnique({ where: { id: params.id } });
  if (!row) return jsonError(404, "Not found");

  return Response.json({ data: row });
});

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const existing = await prisma.applicationCustomField.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.applicationCustomField.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.fieldLabel !== undefined && { fieldLabel: parsed.data.fieldLabel }),
      ...(parsed.data.fieldType !== undefined && { fieldType: parsed.data.fieldType }),
      ...(parsed.data.fieldOptions !== undefined && { fieldOptions: parsed.data.fieldOptions }),
      ...(parsed.data.isRequired !== undefined && { isRequired: parsed.data.isRequired }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      ...(parsed.data.displayOrder !== undefined && { displayOrder: parsed.data.displayOrder }),
    },
  });

  return Response.json({ data: updated });
});

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const existing = await prisma.applicationCustomField.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  await prisma.applicationCustomField.delete({ where: { id: params.id } });
  return Response.json({ data: { deleted: true } });
});
