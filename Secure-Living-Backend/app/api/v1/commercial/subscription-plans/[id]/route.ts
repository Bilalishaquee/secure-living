import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { jsonError, parseBody, requireActor, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

// Prices are never permanent (UPDATE.md: "No price should be permanent") — admins can
// adjust any package's pricing/limits or discontinue it (isActive=false) at any time.
const updateSchema = z.object({
  name: z.string().min(2).optional(),
  listingSlots: z.number().int().nonnegative().optional(),
  hasServiceRequests: z.boolean().optional(),
  serviceRequestMonthlyLimit: z.number().int().nonnegative().nullable().optional(),
  monthlyPriceKes: z.number().nonnegative().optional(),
  isListingOnly: z.boolean().optional(),
  annualDiscountEligible: z.boolean().optional(),
  overageSlotFeeKes: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

function canManageCommercial(role: string, permissions: string[]) {
  return role === "super_admin" || role === "admin" || permissions.includes("*") || permissions.includes("org:manage");
}

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!canManageCommercial(actor.role, actor.permissions)) return jsonError(403, "Forbidden");

  const existing = await prisma.package.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Package not found");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.package.update({ where: { id: params.id }, data: parsed.data });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "commercial.subscription_plan.updated",
    resourceType: "package",
    resourceId: updated.id,
    orgId: undefined,
    beforeJson: existing,
    afterJson: updated,
  });

  return Response.json({ data: updated });
});

export const PUT = PATCH;
