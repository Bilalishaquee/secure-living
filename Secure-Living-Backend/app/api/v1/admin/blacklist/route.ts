import { createHash } from "crypto";
import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError, withErrorHandler, parseBody } from "@/lib/server/http";
import { z } from "zod";

function hashId(nationalId: string): string {
  return createHash("sha256").update(nationalId.trim().toLowerCase()).digest("hex");
}

const addSchema = z.object({
  nationalIdNumber: z.string().optional(),
  phoneNumbers: z.array(z.string()).optional().default([]),
  emailAddresses: z.array(z.string().email()).optional().default([]),
  deviceFingerprints: z.array(z.string()).optional().default([]),
  reason: z.string().min(10),
  evidenceLinks: z.array(z.string()).optional().default([]),
});

// POST — add to blacklist
export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "admin:blacklist");
  if (denied) return denied;

  const parsed = await parseBody(req, addSchema);
  if (!parsed.ok) return parsed.response;
  const { nationalIdNumber, phoneNumbers, emailAddresses, deviceFingerprints, reason, evidenceLinks } = parsed.data;

  const entry = await prisma.blacklistEntry.create({
    data: {
      nationalIdHash: nationalIdNumber ? hashId(nationalIdNumber) : null,
      phoneNumbers,
      emailAddresses,
      deviceFingerprints,
      reason,
      evidenceLinks,
      addedBy: actor.userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      userId: actor.userId,
      role: actor.role ?? "admin",
      action: "blacklist_add",
      resourceType: "BlacklistEntry",
      resourceId: entry.id,
      afterJson: JSON.stringify({ reason, phoneNumbers, emailAddresses }),
    },
  });

  return Response.json({ data: { id: entry.id, message: "Entry added to blacklist" } }, { status: 201 });
});

// GET — list entries (admin only)
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "admin:blacklist");
  if (denied) return denied;

  const entries = await prisma.blacklistEntry.findMany({
    orderBy: { addedAt: "desc" },
    take: 200,
    select: {
      id: true,
      phoneNumbers: true,
      emailAddresses: true,
      reason: true,
      addedBy: true,
      addedAt: true,
    },
  });

  return Response.json({ data: entries });
});

// POST /admin/blacklist/check — registration check (called internally)
export const checkBlacklist = async (params: {
  nationalIdNumber?: string;
  phone?: string;
  email?: string;
  deviceFingerprint?: string;
}): Promise<boolean> => {
  const conditions: object[] = [];

  if (params.nationalIdNumber) {
    conditions.push({ nationalIdHash: hashId(params.nationalIdNumber) });
  }
  if (params.phone) {
    conditions.push({ phoneNumbers: { has: params.phone } });
  }
  if (params.email) {
    conditions.push({ emailAddresses: { has: params.email.toLowerCase() } });
  }
  if (params.deviceFingerprint) {
    conditions.push({ deviceFingerprints: { has: params.deviceFingerprint } });
  }

  if (!conditions.length) return false;

  const match = await prisma.blacklistEntry.findFirst({
    where: { OR: conditions },
  });

  return !!match;
};
