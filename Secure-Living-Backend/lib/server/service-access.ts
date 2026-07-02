import { prisma } from "@/lib/server/db";

/**
 * Admin-managed service access restrictions (UPDATE.md: "The admin should be able
 * to restrict which services users can offer or access.").
 *
 * Resolution order (most specific wins): user-scoped row > org-scoped row >
 * platform-wide row (organizationId and userId both null). A missing row means
 * "allowed" — restrictions are opt-in blocks, not an allowlist by default.
 */
export async function isServiceTypeBlocked(
  serviceType: string,
  opts: { userId?: string | null; organizationId?: string | null },
): Promise<{ blocked: boolean; reason?: string | null }> {
  const rows = await prisma.serviceAccessRestriction.findMany({
    where: {
      serviceType,
      OR: [
        opts.userId ? { userId: opts.userId } : undefined,
        opts.organizationId ? { organizationId: opts.organizationId, userId: null } : undefined,
        { organizationId: null, userId: null },
      ].filter(Boolean) as Array<Record<string, unknown>>,
    },
  });

  const userRow = opts.userId ? rows.find((r) => r.userId === opts.userId) : undefined;
  const orgRow = opts.organizationId ? rows.find((r) => r.organizationId === opts.organizationId && !r.userId) : undefined;
  const platformRow = rows.find((r) => !r.organizationId && !r.userId);

  const winner = userRow ?? orgRow ?? platformRow;
  if (!winner) return { blocked: false };
  return { blocked: winner.mode === "BLOCKED", reason: winner.reason };
}
