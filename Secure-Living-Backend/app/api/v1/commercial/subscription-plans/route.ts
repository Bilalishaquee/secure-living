import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { jsonError, parseBody, requireActor, withErrorHandler } from "@/lib/server/http";
import { z } from "zod";

const planSchema = z.object({
  name: z.string().min(2),
  tier: z.enum(["FREE", "LISTING_ONLY", "STARTER", "PROFESSIONAL", "BUSINESS", "ENTERPRISE", "CUSTOM"]),
  listingSlots: z.number().int().nonnegative().default(0),
  hasServiceRequests: z.boolean().default(true),
  serviceRequestMonthlyLimit: z.number().int().nonnegative().nullable().optional(),
  monthlyPriceKes: z.number().nonnegative().default(0),
  isListingOnly: z.boolean().default(false),
  annualDiscountEligible: z.boolean().default(true),
  overageSlotFeeKes: z.number().nonnegative().default(150),
  isActive: z.boolean().default(true),
});

function canManageCommercial(role: string, permissions: string[]) {
  return role === "super_admin" || role === "admin" || permissions.includes("*") || permissions.includes("org:manage");
}

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const rows = await prisma.package.findMany({ orderBy: [{ isActive: "desc" }, { monthlyPriceKes: "asc" }] });
  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!canManageCommercial(actor.role, actor.permissions)) return jsonError(403, "Forbidden");

  const parsed = await parseBody(req, planSchema);
  if (!parsed.ok) return parsed.response;

  const row = await prisma.package.create({ data: parsed.data });
  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "commercial.subscription_plan.created",
    resourceType: "package",
    resourceId: row.id,
    afterJson: row,
  });
  return Response.json({ data: row }, { status: 201 });
});
