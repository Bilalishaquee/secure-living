import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string } };

// Lease Offer "Ask Questions" (Update-2.md): a lightweight Q&A thread on a lease so a
// tenant can ask before signing, and the landlord/org staff can answer.
function isPartyToLease(actor: { userId: string; permissions: string[]; orgIds: string[] }, lease: { tenantUserId: string; organizationId: string }): boolean {
  return actor.userId === lease.tenantUserId || actor.permissions.includes("*") || actor.orgIds.includes(lease.organizationId);
}

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const lease = await prisma.lease.findUnique({ where: { id: params.id } });
  if (!lease) return jsonError(404, "Lease not found");
  if (!isPartyToLease(actor, lease)) return jsonError(403, "Forbidden");

  const rows = await prisma.leaseQuestion.findMany({ where: { leaseId: params.id }, orderBy: { createdAt: "asc" } });
  return Response.json({ data: rows });
});

const askSchema = z.object({ question: z.string().min(1).max(1000) });

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const lease = await prisma.lease.findUnique({ where: { id: params.id } });
  if (!lease) return jsonError(404, "Lease not found");
  if (lease.tenantUserId !== actor.userId) {
    const denied = requirePermission(actor, "lease:view");
    if (denied) return denied;
  }

  const parsed = await parseBody(req, askSchema);
  if (!parsed.ok) return parsed.response;

  const row = await prisma.leaseQuestion.create({
    data: { id: randomUUID(), leaseId: params.id, askedBy: actor.userId, question: parsed.data.question },
  });

  await notify({
    organizationId: lease.organizationId,
    excludeUserId: actor.userId,
    type: "lease.question_asked",
    severity: "info",
    title: "Tenant asked a question about their lease",
    message: parsed.data.question,
    resourceType: "Lease",
    resourceId: lease.id,
    link: `/leasing/${lease.id}`,
  });

  return Response.json({ data: row }, { status: 201 });
});
