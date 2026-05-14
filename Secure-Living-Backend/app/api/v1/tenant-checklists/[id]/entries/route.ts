import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const entrySchema = z.object({
  itemId: z.string().min(1),
  condition: z.enum(["Good", "Fair", "Poor", "Damaged"]),
  note: z.string().optional(),
  photoUrl: z.string().optional(),
});

const updateEntriesSchema = z.object({ entries: z.array(entrySchema) });

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "checklist:view");
  if (denied) return denied;

  const checklist = await prisma.tenantChecklist.findUnique({ where: { id: params.id } });
  if (!checklist) return jsonError(404, "Checklist not found");
  if (checklist.status === "SIGNED") return jsonError(400, "Checklist already signed");

  const parsed = await parseBody(req, updateEntriesSchema);
  if (!parsed.ok) return parsed.response;

  await prisma.tenantChecklistEntry.deleteMany({ where: { checklistId: params.id } });
  await prisma.tenantChecklistEntry.createMany({
    data: parsed.data.entries.map((e) => ({
      checklistId: params.id,
      itemId: e.itemId,
      condition: e.condition,
      note: e.note,
      photoUrl: e.photoUrl,
    })),
  });

  const entries = await prisma.tenantChecklistEntry.findMany({ where: { checklistId: params.id } });
  return Response.json({ data: entries });
});
