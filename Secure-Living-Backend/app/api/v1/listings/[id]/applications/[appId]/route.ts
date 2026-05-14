import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string; appId: string } };

const updateSchema = z.object({
  status: z.enum(["PENDING", "REVIEWING", "SHORTLISTED", "REJECTED", "ACCEPTED"]),
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
    data: { status: parsed.data.status as never },
  });

  return Response.json({ data: updated });
});
