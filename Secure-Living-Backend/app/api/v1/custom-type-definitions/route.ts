import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";
import { ServiceMode, SrPriority } from "@prisma/client";

const createDefinitionSchema = z.object({
  name: z.string().min(1),
  metadataSchema: z.record(z.string(), z.unknown()),
  serviceMode: z.nativeEnum(ServiceMode).default(ServiceMode.MANAGED),
  defaultPriority: z.nativeEnum(SrPriority).default(SrPriority.NORMAL),
  slaPolicyId: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:view");
  if (denied) return denied;

  const rows = await prisma.customTypeDefinition.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, createDefinitionSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const row = await prisma.customTypeDefinition.create({
    data: {
      name: body.name,
      metadataSchema: body.metadataSchema as object,
      serviceMode: body.serviceMode,
      defaultPriority: body.defaultPriority,
      slaPolicyId: body.slaPolicyId ?? null,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "custom_type_definition.created",
    resourceType: "custom_type_definition",
    resourceId: row.id,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: 201 });
});
