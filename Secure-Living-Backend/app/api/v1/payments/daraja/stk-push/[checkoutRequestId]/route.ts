import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { checkoutRequestId: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const request = await prisma.darajaStkRequest.findUnique({ where: { checkoutRequestId: params.checkoutRequestId } });
  if (!request) return jsonError(404, "STK request not found");
  if (request.tenantUserId !== actor.userId && !actor.permissions.includes("rent_collection:manage") && actor.role !== "super_admin") {
    return jsonError(403, "Forbidden");
  }

  return Response.json({
    data: {
      status: request.status,
      resultDesc: request.resultDesc,
      mpesaReceiptNumber: request.mpesaReceiptNumber,
    },
  });
})
