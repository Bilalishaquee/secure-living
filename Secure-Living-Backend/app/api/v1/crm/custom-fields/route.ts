import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  fieldLabel: z.string().min(1),
  fieldType: z.enum(["text", "dropdown", "checkbox", "upload", "date", "number"]),
  fieldOptions: z.array(z.string()).default([]),
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId") || actor.orgIds?.[0];

  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;

  const rows = await prisma.applicationCustomField.findMany({
    where,
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const organizationId = actor.orgIds?.[0];
  if (!organizationId) {
    return Response.json({ error: "Actor has no organization" }, { status: 400 });
  }

  const row = await prisma.applicationCustomField.create({
    data: {
      id: randomUUID(),
      organizationId,
      fieldLabel: body.fieldLabel,
      fieldType: body.fieldType,
      fieldOptions: body.fieldOptions,
      isRequired: body.isRequired,
      isActive: body.isActive,
      displayOrder: body.displayOrder,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
