import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const schema = z.object({
  action: z.enum(["accept", "dispute", "finalise"]),
  note: z.string().optional(),
});

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "vacating:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const existing = await prisma.inspectionDeduction.findUnique({
    where: { id: params.id },
    include: { inspection: true },
  });
  if (!existing) return jsonError(404, "Deduction not found");
  if (!actor.permissions.includes("*") && !actor.orgIds.includes(existing.inspection.organizationId)) {
    return jsonError(403, "Forbidden");
  }

  const status = parsed.data.action === "accept"
    ? "accepted"
    : parsed.data.action === "dispute"
      ? "disputed"
      : "finalised";
  const updated = await prisma.inspectionDeduction.update({
    where: { id: params.id },
    data: {
      status,
      responsibility: status === "disputed" ? "UNKNOWN" : existing.responsibility,
    },
  });
  void parsed.data.note;
  return Response.json({ data: updated });
});
