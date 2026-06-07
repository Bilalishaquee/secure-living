import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  organizationId: z.string().min(1),
  fieldLabel: z.string().min(1),
  fieldType: z.enum(["text", "dropdown", "checkbox", "upload", "date", "number"]),
  fieldOptions: z.array(z.string()).default([]),
  isRequired: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId") || actor.orgIds?.[0];

  if (!organizationId) return Response.json({ data: [] });

  const rows = await prisma.applicationCustomField.findMany({
    where: { organizationId, isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;

  const row = await prisma.applicationCustomField.create({
    data: {
      id: randomUUID(),
      organizationId: parsed.data.organizationId,
      fieldLabel: parsed.data.fieldLabel,
      fieldType: parsed.data.fieldType,
      fieldOptions: parsed.data.fieldOptions,
      isRequired: parsed.data.isRequired,
      displayOrder: parsed.data.displayOrder,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
