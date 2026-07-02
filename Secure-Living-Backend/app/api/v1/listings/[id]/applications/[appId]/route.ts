import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string; appId: string } };

// Screening decision workflow (Secure Living UPDATE.md — "Screening Process"): after
// reviewing an applicant (and any TenantScreeningReport on file), the responsible party
// — whoever holds listing:edit (landlord/agency staff/property manager on this listing) —
// takes one of: Shortlist, Reject, Accept, or Request More Information (-> REVIEWING with
// a note asking the applicant/agent to supply more evidence before a final decision).
const updateSchema = z.object({
  status: z.enum(["PENDING", "REVIEWING", "SHORTLISTED", "REJECTED", "ACCEPTED"]),
  adminNotes: z.string().max(2000).optional(),
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "listing:edit");
  if (denied) return denied;

  const application = await prisma.rentalApplication.findUnique({ where: { id: params.appId } });
  if (!application) return jsonError(404, "Application not found");
  if (application.listingId !== params.id) return jsonError(400, "Application does not belong to this listing");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.rentalApplication.update({
    where: { id: params.appId },
    data: {
      status: parsed.data.status as never,
      reviewerId: actor.userId,
      reviewedAt: new Date(),
      ...(parsed.data.adminNotes !== undefined && { adminNotes: parsed.data.adminNotes }),
    },
  });

  return Response.json({ data: updated });
});
