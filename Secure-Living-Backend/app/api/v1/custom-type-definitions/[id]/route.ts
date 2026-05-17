import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { ServiceMode, SrPriority } from "@prisma/client";

type Ctx = { params: { id: string } };

const updateDefinitionSchema = z.object({
  name: z.string().min(1).optional(),
  metadataSchema: z.record(z.string(), z.unknown()).optional(),
  serviceMode: z.nativeEnum(ServiceMode).optional(),
  defaultPriority: z.nativeEnum(SrPriority).optional(),
  slaPolicyId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:view");
  if (denied) return denied;

  const row = await prisma.customTypeDefinition.findUnique({ where: { id: params.id } });
  if (!row) return jsonError(404, "Custom type definition not found");
  return Response.json({ data: row });
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const existing = await prisma.customTypeDefinition.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Custom type definition not found");

  const parsed = await parseBody(req, updateDefinitionSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const updated = await prisma.customTypeDefinition.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.metadataSchema !== undefined && { metadataSchema: body.metadataSchema as object }),
      ...(body.serviceMode !== undefined && { serviceMode: body.serviceMode }),
      ...(body.defaultPriority !== undefined && { defaultPriority: body.defaultPriority }),
      ...(body.slaPolicyId !== undefined && { slaPolicyId: body.slaPolicyId }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "custom_type_definition.updated",
    resourceType: "custom_type_definition",
    resourceId: params.id,
    beforeJson: existing,
    afterJson: updated,
  });

  return Response.json({ data: updated });
});

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const existing = await prisma.customTypeDefinition.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Custom type definition not found");

  // Soft delete
  const updated = await prisma.customTypeDefinition.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "custom_type_definition.deactivated",
    resourceType: "custom_type_definition",
    resourceId: params.id,
    beforeJson: existing,
    afterJson: updated,
  });

  return Response.json({ data: { deleted: true } });
});
