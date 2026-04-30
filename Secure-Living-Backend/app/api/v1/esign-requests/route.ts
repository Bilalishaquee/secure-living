import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";
import { createESignRequestSchema } from "@/lib/server/validation";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "leases:view");
  if (denied) return denied;
  const rows = await prisma.eSignRequest.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "leases:manage");
  if (denied) return denied;
  const parsed = await parseBody(req, createESignRequestSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;
  const row = await prisma.eSignRequest.create({
    data: {
      id: randomUUID(),
      templateId: b.templateId,
      leaseId: b.leaseId,
      title: b.title,
      documentUrl: b.documentUrl,
      signerUserId: b.signerUserId,
      signerEmail: b.signerEmail,
      status: b.status,
      sentAt: b.sentAt ? new Date(b.sentAt) : null,
      expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
      createdBy: actor.userId,
    },
  });
  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "esign_request.created",
    resourceType: "esign_request",
    resourceId: row.id,
    afterJson: row,
  });
  return Response.json({ data: row }, { status: 201 });
})
