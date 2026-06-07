import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const updateSchema = z.object({
  fieldLabel: z.string().min(1).optional(),
  fieldType: z.enum(["text", "dropdown", "checkbox", "upload", "date", "number"]).optional(),
  fieldOptions: z.array(z.string()).optional(),
  isRequired: z.boolean().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

function getId(req: Request): string | null {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  return segments.at(-1) ?? null;
}

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const id = getId(req);
  if (!id) return jsonError(400, "Missing id");

  const row = await prisma.applicationCustomField.findUnique({ where: { id } });
  if (!row) return jsonError(404, "Custom field not found");
  return Response.json({ data: row });
});

export const PATCH = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const id = getId(req);
  if (!id) return jsonError(400, "Missing id");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const existing = await prisma.applicationCustomField.findUnique({ where: { id } });
  if (!existing) return jsonError(404, "Custom field not found");

  const updated = await prisma.applicationCustomField.update({
    where: { id },
    data: {
      fieldLabel: body.fieldLabel,
      fieldType: body.fieldType,
      fieldOptions: body.fieldOptions,
      isRequired: body.isRequired,
      isActive: body.isActive,
      displayOrder: body.displayOrder,
    },
  });

  return Response.json({ data: updated });
});

export const DELETE = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const id = getId(req);
  if (!id) return jsonError(400, "Missing id");

  const existing = await prisma.applicationCustomField.findUnique({ where: { id } });
  if (!existing) return jsonError(404, "Custom field not found");

  await prisma.applicationCustomField.delete({ where: { id } });
  return Response.json({ data: { deleted: true } });
});
