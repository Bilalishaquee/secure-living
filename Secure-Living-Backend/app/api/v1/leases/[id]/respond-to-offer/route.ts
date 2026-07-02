import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";
import { appendAudit } from "@/lib/server/audit";

type Ctx = { params: { id: string } };

// Tenant Portal "Lease Offer" (Update-2.md): the tenant reviewing a lease offer can Accept
// & Sign or Decline — they never edit the terms, only respond to what the landlord sent.
const schema = z.object({
  action: z.enum(["accept", "decline"]),
  reason: z.string().max(1000).optional(),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const lease = await prisma.lease.findUnique({ where: { id: params.id } });
  if (!lease) return jsonError(404, "Lease not found");
  if (lease.tenantUserId !== actor.userId) return jsonError(403, "Only the tenant on this lease can respond to it");
  if (lease.status !== "offered") return jsonError(400, "This lease is not awaiting your signature");

  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const now = new Date();
  const updated = await prisma.lease.update({
    where: { id: params.id },
    data: parsed.data.action === "accept"
      ? { status: "active", tenantSignedAt: now, signedAt: now }
      : { status: "declined", declinedAt: now, declineReason: parsed.data.reason ?? null },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: parsed.data.action === "accept" ? "LEASE_OFFER_ACCEPTED" : "LEASE_OFFER_DECLINED",
    resourceType: "Lease",
    resourceId: lease.id,
    orgId: lease.organizationId,
    branchId: lease.branchId,
    afterJson: { status: updated.status, reason: parsed.data.reason ?? null },
  });

  return Response.json({ data: updated });
});
