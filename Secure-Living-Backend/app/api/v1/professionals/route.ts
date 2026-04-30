import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope , withErrorHandler } from "@/lib/server/http";
import { createProfessionalSchema } from "@/lib/server/validation";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "services:view");
  if (denied) return denied;

  const url = new URL(req.url);
  const branchId = url.searchParams.get("branchId");
  const profession = url.searchParams.get("profession");

  const rows = await prisma.professionalProfile.findMany({
    where: {
      isActive: true,
      ...(profession ? { profession } : {}),
      ...(branchId ? { branchId } : {}),
      ...(!actor.permissions.includes("*")
        ? { OR: [{ branchId: { in: actor.branchIds } }, { organizationId: { in: actor.orgIds } }] }
        : {}),
    },
    orderBy: [{ verificationStatus: "asc" }, { rating: "desc" }],
  });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "services:contractor_admin");
  if (denied) return denied;

  const parsed = await parseBody(req, createProfessionalSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (body.organizationId && body.branchId) {
    const scoped = requireScope(actor, body.organizationId, body.branchId);
    if (scoped) return scoped;
  }

  const row = await prisma.professionalProfile.create({
    data: {
      id: randomUUID(),
      userId: body.userId,
      organizationId: body.organizationId,
      branchId: body.branchId,
      profession: body.profession,
      skillsCsv: body.skills.join(","),
      verificationStatus: body.verificationStatus,
      bio: body.bio,
      isActive: true,
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "professional.created",
    resourceType: "professional",
    resourceId: row.id,
    orgId: row.organizationId,
    branchId: row.branchId,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: 201 });
})
