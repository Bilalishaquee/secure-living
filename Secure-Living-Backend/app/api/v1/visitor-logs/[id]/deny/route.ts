import { jsonError, requireActor, withErrorHandler } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";

export const PATCH = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const visitId = segments.at(-2);
  if (!visitId) return jsonError(400, "Missing visitId");

  const existing = await prisma.visitorLog.findUnique({ where: { id: visitId } });
  if (!existing) return jsonError(404, "Visit not found");

  const updated = await prisma.visitorLog.update({
    where: { id: visitId },
    data: {
      approvalStatus: "DENIED",
    },
  });

  return Response.json({ data: updated });
});
