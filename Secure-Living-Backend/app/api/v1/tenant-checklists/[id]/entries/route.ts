import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

// Full inspection condition vocabulary from the Secure Living checklist spec.
const CONDITIONS = ["New", "Excellent", "Good", "Fair", "Poor", "Damaged", "Missing", "Not Applicable"] as const;

const entrySchema = z
  .object({
    itemId: z.string().optional(),
    templateItemId: z.string().optional(),
    condition: z.string().optional(),
    statusIn: z.string().optional(),
    statusOut: z.string().optional(),
    qty: z.number().int().nonnegative().optional(),
    chargeKes: z.number().nonnegative().optional(),
    responsibility: z.string().optional(),
    actionRequired: z.string().optional(),
    note: z.string().optional(),
    tenantNotes: z.string().optional(),
    photoUrl: z.string().optional(),
    photoInUrl: z.string().optional(),
    photoOutUrl: z.string().optional(),
    customFields: z.record(z.string(), z.unknown()).optional(),
  })
  .transform((v, ctx) => {
    const itemId = v.itemId ?? v.templateItemId;
    if (!itemId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "itemId is required" });
      return z.NEVER;
    }
    // condition mirrors statusOut (move-out) when present, else statusIn, else provided condition.
    const condition = v.statusOut ?? v.condition ?? v.statusIn ?? "Not Applicable";
    return {
      itemId,
      condition,
      statusIn: v.statusIn ?? null,
      statusOut: v.statusOut ?? null,
      qty: v.qty ?? null,
      chargeKes: v.chargeKes ?? null,
      responsibility: v.responsibility ?? null,
      actionRequired: v.actionRequired ?? null,
      note: v.note ?? v.tenantNotes ?? null,
      photoUrl: v.photoUrl ?? null,
      photoInUrl: v.photoInUrl ?? null,
      photoOutUrl: v.photoOutUrl ?? null,
      customFields: v.customFields ?? undefined,
    };
  });

void CONDITIONS;

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
      statusIn: e.statusIn,
      statusOut: e.statusOut,
      qty: e.qty,
      chargeKes: e.chargeKes,
      responsibility: e.responsibility,
      actionRequired: e.actionRequired,
      note: e.note,
      photoUrl: e.photoUrl,
      photoInUrl: e.photoInUrl,
      photoOutUrl: e.photoOutUrl,
      customFields: e.customFields as import("@prisma/client").Prisma.InputJsonValue | undefined,
    })),
  });

  const entries = await prisma.tenantChecklistEntry.findMany({ where: { checklistId: params.id } });
  return Response.json({ data: entries });
});
