import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string; qId: string } };

// Landlord/org staff answers a tenant's lease question — the tenant cannot answer their
// own question (only ask), matching "the tenant responds, they don't author" for the
// lease itself, and the landlord is the one accountable for clarifying terms.
const answerSchema = z.object({ answer: z.string().min(1).max(2000) });

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:edit");
  if (denied) return denied;

  const question = await prisma.leaseQuestion.findUnique({ where: { id: params.qId } });
  if (!question || question.leaseId !== params.id) return jsonError(404, "Question not found");

  const lease = await prisma.lease.findUnique({ where: { id: params.id } });
  if (!lease) return jsonError(404, "Lease not found");
  const scoped = requireScope(actor, lease.organizationId, lease.branchId);
  if (scoped) return scoped;

  const parsed = await parseBody(req, answerSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.leaseQuestion.update({
    where: { id: params.qId },
    data: { answer: parsed.data.answer, answeredBy: actor.userId, answeredAt: new Date() },
  });

  await notify({
    roles: [],
    userIds: [lease.tenantUserId],
    excludeUserId: actor.userId,
    type: "lease.question_answered",
    severity: "info",
    title: "Your lease question was answered",
    message: parsed.data.answer,
    resourceType: "Lease",
    resourceId: lease.id,
    link: "/tenant/lease",
  });

  return Response.json({ data: updated });
});
