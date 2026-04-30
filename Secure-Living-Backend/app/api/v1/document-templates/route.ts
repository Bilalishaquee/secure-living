import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";
import { createDocumentTemplateSchema } from "@/lib/server/validation";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "leases:view");
  if (denied) return denied;
  const rows = await prisma.documentTemplate.findMany({ where: { isActive: true }, orderBy: { updatedAt: "desc" } });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "leases:manage");
  if (denied) return denied;
  const parsed = await parseBody(req, createDocumentTemplateSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  const row = await prisma.documentTemplate.create({
    data: {
      id: randomUUID(),
      name: b.name,
      category: b.category,
      jurisdiction: b.jurisdiction,
      templateBody: b.templateBody,
      variablesCsv: (b.variables ?? []).join(","),
      isActive: b.isActive ?? true,
    },
  });
  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "document_template.created",
    resourceType: "document_template",
    resourceId: row.id,
    afterJson: row,
  });
  return Response.json({ data: row }, { status: 201 });
})
