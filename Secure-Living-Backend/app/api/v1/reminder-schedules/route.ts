import { randomUUID } from "crypto";
import { canAccessOrg } from "@/lib/server/authz";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { jsonError, parseBody, requireActor, requirePermission, requireScope , withErrorHandler } from "@/lib/server/http";
import { createReminderScheduleSchema } from "@/lib/server/validation";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "rent:collect");
  if (denied) return denied;
  const rows = await prisma.reminderSchedule.findMany({
    where: !actor.permissions.includes("*")
      ? { OR: [{ branchId: { in: actor.branchIds } }, { organizationId: { in: actor.orgIds } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "rent:collect");
  if (denied) return denied;
  const parsed = await parseBody(req, createReminderScheduleSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;

  if (b.organizationId && b.branchId) {
    const scoped = requireScope(actor, b.organizationId, b.branchId);
    if (scoped) return scoped;
  } else if (b.organizationId && !canAccessOrg(actor, b.organizationId)) {
    return jsonError(403, "Out of scope");
  }

  const row = await prisma.reminderSchedule.create({
    data: {
      id: randomUUID(),
      organizationId: b.organizationId,
      branchId: b.branchId,
      targetType: b.targetType,
      targetId: b.targetId,
      channel: b.channel,
      scheduleOffsetDays: b.scheduleOffsetDays,
      messageTemplate: b.messageTemplate,
      isEnabled: b.isEnabled ?? true,
    },
  });
  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "reminder_schedule.created",
    resourceType: "reminder_schedule",
    resourceId: row.id,
    orgId: row.organizationId,
    branchId: row.branchId,
    afterJson: row,
  });
  return Response.json({ data: row }, { status: 201 });
})
