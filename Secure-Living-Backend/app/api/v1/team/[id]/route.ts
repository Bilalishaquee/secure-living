import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { requireActor , withErrorHandler } from "@/lib/server/http";

export const DELETE = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const invite = await prisma.teamInvitation.findUnique({ where: { id: params.id } });
  if (!invite) return Response.json({ error: "Invitation not found" }, { status: 404 });

  if (!actor.permissions.includes("*") && !actor.orgIds.includes(invite.organizationId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.teamInvitation.update({
    where: { id: params.id },
    data: { status: "revoked", revokedAt: new Date() },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "team.invitation_revoked",
    resourceType: "team_invitation",
    resourceId: params.id,
    orgId: invite.organizationId,
    branchId: invite.branchId,
    afterJson: { inviteeEmail: invite.inviteeEmail },
  });

  return Response.json({ data: updated });
})

export const GET = withErrorHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  const actor = requireActor(_req);
  if (actor instanceof Response) return actor;

  const invite = await prisma.teamInvitation.findUnique({ where: { id: params.id } });
  if (!invite) return Response.json({ error: "Not found" }, { status: 404 });

  if (!actor.permissions.includes("*") && !actor.orgIds.includes(invite.organizationId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ data: invite });
})
