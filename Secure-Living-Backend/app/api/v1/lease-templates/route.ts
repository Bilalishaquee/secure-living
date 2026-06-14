import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  fileFormat: z.enum(["pdf", "docx", "doc"]),
  fileSizeBytes: z.number().int().optional(),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId") || actor.orgIds?.[0];
  const propertyId = url.searchParams.get("propertyId");

  if (!organizationId) return Response.json({ data: [] });

  const where: Record<string, unknown> = { organizationId };
  if (propertyId) where.propertyId = propertyId;

  const rows = await prisma.leaseTemplate.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.leaseTemplate.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      name: body.name,
      description: body.description ?? null,
      fileUrl: body.fileUrl,
      fileFormat: body.fileFormat,
      fileSizeBytes: body.fileSizeBytes ?? null,
      propertyId: body.propertyId ?? null,
      unitId: body.unitId ?? null,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
