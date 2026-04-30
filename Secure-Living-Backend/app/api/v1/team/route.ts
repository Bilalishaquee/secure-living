import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor , withErrorHandler } from "@/lib/server/http";

const inviteSchema = z.object({
  organizationId: z.string().min(1),
  branchId: z.string().min(1),
  inviteeEmail: z.string().email(),
  roleSlug: z.enum(["caretaker", "property_manager", "accountant", "full_delegate"]),
  propertyIdsCsv: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const orgId = url.searchParams.get("organizationId");

  const where = actor.permissions.includes("*")
    ? orgId ? { organizationId: orgId } : {}
    : { organizationId: { in: actor.orgIds } };

  const rows = await prisma.teamInvitation.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, inviteSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (!actor.permissions.includes("*") && !actor.orgIds.includes(body.organizationId)) {
    return Response.json({ error: "Out of scope" }, { status: 403 });
  }

  const existing = await prisma.teamInvitation.findFirst({
    where: {
      organizationId: body.organizationId,
      inviteeEmail: body.inviteeEmail.toLowerCase(),
      status: "pending",
    },
  });
  if (existing) {
    return Response.json({ error: "A pending invitation already exists for this email." }, { status: 409 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.teamInvitation.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      branchId: body.branchId,
      invitedByUserId: actor.userId,
      inviteeEmail: body.inviteeEmail.toLowerCase(),
      roleSlug: body.roleSlug,
      propertyIdsCsv: body.propertyIdsCsv,
      status: "pending",
      inviteToken: randomUUID(),
      expiresAt,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "team.invited",
    resourceType: "team_invitation",
    resourceId: invite.id,
    orgId: body.organizationId,
    branchId: body.branchId,
    afterJson: { inviteeEmail: invite.inviteeEmail, roleSlug: invite.roleSlug },
  });

  return Response.json({ data: invite }, { status: 201 });
})
