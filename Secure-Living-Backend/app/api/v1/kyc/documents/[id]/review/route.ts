import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";
import { appendAudit } from "@/lib/server/audit";

type Ctx = { params: { id: string } };

const reviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  rejectionReason: z.string().optional(),
});

// Admin-facing KYC review queue action (spec: "There should be a dedicated process for
// managing KYC"). Reflects back onto the submitter's profile via KycDocument.status,
// which the VerificationBadge component reads.
export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "kyc:review");
  if (denied) return denied;

  const doc = await prisma.kycDocument.findUnique({ where: { id: params.id } });
  if (!doc) return jsonError(404, "Document not found");
  if (!actor.permissions.includes("*") && (!doc.organizationId || !actor.orgIds.includes(doc.organizationId))) {
    return jsonError(403, "Forbidden");
  }

  const parsed = await parseBody(req, reviewSchema);
  if (!parsed.ok) return parsed.response;

  if (parsed.data.decision === "reject" && !parsed.data.rejectionReason?.trim()) {
    return jsonError(400, "A rejection reason is required");
  }

  const updated = await prisma.kycDocument.update({
    where: { id: params.id },
    data: {
      status: parsed.data.decision === "approve" ? "approved" : "rejected",
      reviewedAt: new Date(),
      reviewedByUserId: actor.userId,
      rejectionReason: parsed.data.decision === "reject" ? parsed.data.rejectionReason : null,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: parsed.data.decision === "approve" ? "KYC_DOCUMENT_APPROVED" : "KYC_DOCUMENT_REJECTED",
    resourceType: "KycDocument",
    resourceId: doc.id,
    orgId: doc.organizationId ?? undefined,
    beforeJson: { status: doc.status },
    afterJson: { status: updated.status, reason: parsed.data.rejectionReason ?? null },
  });

  return Response.json({ data: updated });
});
