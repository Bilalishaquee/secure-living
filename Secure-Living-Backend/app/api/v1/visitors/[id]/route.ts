import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { hasPermission, canAccessOrg } from "@/lib/server/authz";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  idNumber: z.string().nullable().optional(),
  vehicleNumber: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isBlacklisted: z.boolean().optional(),
  blacklistReason: z.string().nullable().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const row = await prisma.visitor.findUnique({ where: { id: params.id } });
  if (!row) return jsonError(404, "Not found");
  if (!canAccessOrg(actor, row.organizationId)) return jsonError(403, "Out of scope");

  return Response.json({ data: row });
});

// Ban/Blacklist workflow: landlords/staff (visitor:manage) can BLACKLIST a visitor and record
// why. Only Super Admin (visitor:blacklist:remove) can WHITELIST — i.e. clear an existing
// blacklist — matching the doc's "landlord can [blacklist] ... super admin for a removal" rule.
export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!hasPermission(actor, "visitor:manage")) return jsonError(403, "Forbidden");

  const existing = await prisma.visitor.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");
  if (!canAccessOrg(actor, existing.organizationId)) return jsonError(403, "Out of scope");

  const parsed = await parseBody(req, updateSchema);
  if (!parsed.ok) return parsed.response;

  const wantsToBlacklist = parsed.data.isBlacklisted === true && !existing.isBlacklisted;
  const wantsToWhitelist = parsed.data.isBlacklisted === false && existing.isBlacklisted;

  if (wantsToWhitelist && !hasPermission(actor, "visitor:blacklist:remove")) {
    return jsonError(403, "Only a Super Admin can remove a visitor from the blacklist");
  }

  const updated = await prisma.visitor.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(parsed.data.email !== undefined && { email: parsed.data.email }),
      ...(parsed.data.idNumber !== undefined && { idNumber: parsed.data.idNumber }),
      ...(parsed.data.vehicleNumber !== undefined && { vehicleNumber: parsed.data.vehicleNumber }),
      ...(parsed.data.photoUrl !== undefined && { photoUrl: parsed.data.photoUrl }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      ...(parsed.data.isBlacklisted !== undefined && { isBlacklisted: parsed.data.isBlacklisted }),
      ...(wantsToBlacklist && {
        blacklistReason: parsed.data.blacklistReason ?? null,
        blacklistedAt: new Date(),
        blacklistedBy: actor.userId,
      }),
      ...(wantsToWhitelist && {
        blacklistReason: null,
        blacklistedAt: null,
        blacklistedBy: null,
      }),
    },
  });

  if (wantsToBlacklist || wantsToWhitelist) {
    await appendAudit({
      userId: actor.userId,
      role: actor.role,
      action: wantsToBlacklist ? "VISITOR_BLACKLISTED" : "VISITOR_WHITELISTED",
      resourceType: "Visitor",
      resourceId: existing.id,
      orgId: existing.organizationId,
      beforeJson: { isBlacklisted: existing.isBlacklisted },
      afterJson: { isBlacklisted: updated.isBlacklisted, reason: parsed.data.blacklistReason ?? null },
    });
  }

  return Response.json({ data: updated });
});

export const DELETE = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  if (!hasPermission(actor, "visitor:manage")) return jsonError(403, "Forbidden");

  const existing = await prisma.visitor.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");
  if (!canAccessOrg(actor, existing.organizationId)) return jsonError(403, "Out of scope");

  const updated = await prisma.visitor.update({
    where: { id: params.id },
    data: {
      isBlacklisted: true,
      blacklistReason: "Removed via delete action",
      blacklistedAt: new Date(),
      blacklistedBy: actor.userId,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "VISITOR_BLACKLISTED",
    resourceType: "Visitor",
    resourceId: existing.id,
    orgId: existing.organizationId,
    beforeJson: { isBlacklisted: existing.isBlacklisted },
    afterJson: { isBlacklisted: updated.isBlacklisted },
  });

  return Response.json({ data: { deleted: true } });
});
