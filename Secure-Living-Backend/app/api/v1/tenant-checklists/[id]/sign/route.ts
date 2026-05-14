import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "checklist:view");
  if (denied) return denied;

  const checklist = await prisma.tenantChecklist.findUnique({
    where: { id: params.id },
    include: { template: { include: { items: true } }, entries: true },
  });
  if (!checklist) return jsonError(404, "Checklist not found");
  if (checklist.status === "SIGNED") return jsonError(400, "Already signed");

  if (checklist.entries.length < checklist.template.items.length) {
    return jsonError(400, "All items must be filled before signing");
  }

  const updated = await prisma.tenantChecklist.update({
    where: { id: params.id },
    data: { status: "SIGNED", signedAt: new Date() },
  });

  return Response.json({ data: updated });
});
