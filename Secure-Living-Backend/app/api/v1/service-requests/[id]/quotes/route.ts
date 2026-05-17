import { z } from "zod";
import { SrStatus, QuoteStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { canSrTransition, SR_EVENT_MAP } from "@/lib/server/service-fsm";
import { writeSrTransition, writeOutboxEvent } from "@/lib/server/sr-helpers";

type Ctx = { params: { id: string } };

const createQuoteSchema = z.object({
  amount: z.number().positive("amount must be positive"),
  scopeDescription: z.string().min(1, "scopeDescription is required"),
  validUntil: z.string().datetime().optional(),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:execute");
  if (denied) return denied;

  const existing = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const scoped = requireScope(actor, existing.organizationId, existing.branchId);
  if (scoped) return scoped;

  const parsed = await parseBody(req, createQuoteSchema);
  if (!parsed.ok) return parsed.response;

  // Determine whether we need to move SR to QUOTING
  const moveToQuoting =
    existing.srStatus === SrStatus.APPROVED &&
    canSrTransition(existing.srStatus, SrStatus.QUOTING);

  const quote = await prisma.$transaction(async (tx) => {
    // Supersede all existing PENDING quotes
    await tx.serviceRequestQuote.updateMany({
      where: { serviceRequestId: params.id, status: QuoteStatus.PENDING },
      data: { status: QuoteStatus.SUPERSEDED },
    });

    const newQuote = await tx.serviceRequestQuote.create({
      data: {
        id: randomUUID(),
        serviceRequestId: params.id,
        submittedBy: actor.userId,
        amount: parsed.data.amount,
        scopeDescription: parsed.data.scopeDescription,
        validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
        status: QuoteStatus.PENDING,
      },
    });

    if (moveToQuoting) {
      await tx.serviceRequest.update({
        where: { id: params.id },
        data: { srStatus: SrStatus.QUOTING, status: "QUOTING" },
      });
      await writeSrTransition(tx, params.id, actor.userId, existing.srStatus, SrStatus.QUOTING, "Quote submitted");
      await writeOutboxEvent(tx, SR_EVENT_MAP[SrStatus.QUOTING], { serviceRequestId: params.id, actorId: actor.userId, quoteId: newQuote.id }, params.id);
    }

    return newQuote;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.quote_submitted",
    resourceType: "service_request",
    resourceId: params.id,
    orgId: existing.organizationId,
    branchId: existing.branchId,
    afterJson: quote,
  });

  return Response.json({ data: quote }, { status: 201 });
});
