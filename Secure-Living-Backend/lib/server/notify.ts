import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";

// Real-time(-ish) platform notifications. Called at the moment a significant event
// happens (never derived/re-queried later) — see individual route call sites for what
// triggers each notification type. Every call automatically reaches Super Admin
// (platform-wide) and every Admin scoped to the relevant organization, on top of
// whatever specific roles/users are named for that particular event, so "on any
// operation in the platform, the super-admin, admin, or the related RBACs get
// notified" holds without every call site having to remember to include them.
export type NotifySeverity = "info" | "warning" | "critical";

export type NotifyInput = {
  organizationId?: string | null;
  branchId?: string | null;
  /** Role slugs to fan out to, scoped to organizationId (ignored for super_admin, which is always global). */
  roles?: string[];
  /** Specific user IDs to notify directly, in addition to the role fan-out (e.g. the tenant on a lease, the admin who claimed an inquiry). */
  userIds?: string[];
  /** Exclude the actor who triggered the event from receiving their own notification (default true). */
  excludeUserId?: string | null;
  type: string;
  severity?: NotifySeverity;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  link?: string;
};

async function resolveRoleRecipients(roles: string[], organizationId?: string | null): Promise<string[]> {
  const wantsSuperAdmin = roles.includes("super_admin");
  const scopedRoles = roles.filter((r) => r !== "super_admin");

  const [superAdmins, scoped] = await Promise.all([
    wantsSuperAdmin
      ? prisma.userRoleAssignment.findMany({
          where: { status: "active", role: { slug: "super_admin" } },
          select: { userId: true },
        })
      : Promise.resolve([]),
    scopedRoles.length > 0
      ? prisma.userRoleAssignment.findMany({
          where: {
            status: "active",
            role: { slug: { in: scopedRoles } },
            ...(organizationId ? { organizationId } : {}),
          },
          select: { userId: true },
        })
      : Promise.resolve([]),
  ]);

  return [...superAdmins, ...scoped].map((a) => a.userId);
}

/**
 * Fan out one notification to every relevant recipient. Always includes Super Admin
 * (platform-wide) and Admin (scoped to organizationId, when provided) unless the
 * caller explicitly narrows `roles` to something else — pass `roles: []` together
 * with explicit `userIds` for a fully targeted notification (e.g. tenant-only).
 */
export async function notify(input: NotifyInput): Promise<void> {
  const roles = input.roles ?? ["super_admin", "admin"];
  const excludeUserId = input.excludeUserId ?? null;

  const [roleRecipients] = await Promise.all([resolveRoleRecipients(roles, input.organizationId)]);

  const recipientIds = new Set([...roleRecipients, ...(input.userIds ?? [])]);
  if (excludeUserId) recipientIds.delete(excludeUserId);
  if (recipientIds.size === 0) return;

  await prisma.notification.createMany({
    data: Array.from(recipientIds).map((recipientId) => ({
      id: randomUUID(),
      recipientId,
      organizationId: input.organizationId ?? null,
      branchId: input.branchId ?? null,
      type: input.type,
      severity: input.severity ?? "info",
      title: input.title,
      message: input.message,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      link: input.link,
    })),
  });
}
