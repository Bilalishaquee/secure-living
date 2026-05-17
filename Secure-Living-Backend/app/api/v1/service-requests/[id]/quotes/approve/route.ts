import { z } from "zod";
import { SrStatus, QuoteStatus } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { canSrTransition, SR_EVENT_MAP } from "@/lib/server/service-fsm";
import { writeSrTransition, writeOutboxEvent } from "@/lib/server/sr-helpers";

type Ctx = { params: { id: string } };

const approveQuoteSchema = z.object({
  quoteId: z.string().min(1, "quoteId is required"),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const existing = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  const parsed = await parseBody(req, approveQuoteSchema);
  if (!parsed.ok) return parsed.response;

  const quote = await prisma.serviceRequestQuote.findUnique({ where: { id: parsed.data.quoteId } });
  if (!quote || quote.serviceRequestId !== params.id) {
    return jsonError(404, "Quote not found for this service request");
  }
  if (quote.status !== QuoteStatus.PENDING) {
    return jsonError(409, `Quote is already in status ${quote.status}`);
  }

  if (!canSrTransition(existing.srStatus, SrStatus.AWAITING_FUNDING)) {
    return jsonError(409, `Cannot move service request from ${existing.srStatus} to AWAITING_FUNDING`);
  }

  const updatedQuote = await prisma.$transaction(async (tx) => {
    // Supersede all other PENDING quotes
    await tx.serviceRequestQuote.updateMany({
      where: { serviceRequestId: params.id, status: QuoteStatus.PENDING, id: { not: parsed.data.quoteId } },
      data: { status: QuoteStatus.SUPERSEDED },
    });

    const approved = await tx.serviceRequestQuote.update({
      where: { id: parsed.data.quoteId },
      data: { status: QuoteStatus.APPROVED },
    });

    await tx.serviceRequest.update({
      where: { id: params.id },
      data: { srStatus: SrStatus.AWAITING_FUNDING, status: "AWAITING_FUNDING" },
    });

    await writeSrTransition(tx, params.id, actor.userId, existing.srStatus, SrStatus.AWAITING_FUNDING, `Quote ${parsed.data.quoteId} approved`);
    await writeOutboxEvent(tx, SR_EVENT_MAP[SrStatus.AWAITING_FUNDING], { serviceRequestId: params.id, actorId: actor.userId, quoteId: parsed.data.quoteId }, params.id);

    return approved;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.quote_approved",
    resourceType: "service_request",
    resourceId: params.id,
    orgId: existing.organizationId,
    branchId: existing.branchId,
    afterJson: { quoteId: parsed.data.quoteId, newSrStatus: SrStatus.AWAITING_FUNDING },
  });

  return Response.json({ data: updatedQuote });
});
