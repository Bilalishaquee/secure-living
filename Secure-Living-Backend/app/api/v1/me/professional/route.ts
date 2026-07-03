import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";
import { z } from "zod";

const upsertProfessionalSchema = z.object({
  profession: z.string().min(2),
  skills: z.array(z.string().min(1)).min(1),
  bio: z.string().max(500).optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const profile = await prisma.professionalProfile.findFirst({
    where: { userId: actor.userId },
  });

  return Response.json({ data: profile });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, upsertProfessionalSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const existing = await prisma.professionalProfile.findFirst({
    where: { userId: actor.userId },
  });

  if (existing) {
    const updated = await prisma.professionalProfile.update({
      where: { id: existing.id },
      data: {
        profession: body.profession,
        skillsCsv: body.skills.join(","),
        bio: body.bio,
        verificationStatus: "pending",
        isActive: true,
      },
    });

    await appendAudit({
      userId: actor.userId, role: actor.role, action: "professional.updated",
      resourceType: "professional", resourceId: updated.id,
      orgId: actor.orgIds[0] ?? null, branchId: actor.branchIds[0] ?? null,
      afterJson: updated,
    });

    return Response.json({ data: updated });
  }

  const row = await prisma.professionalProfile.create({
    data: {
      id: randomUUID(),
      userId: actor.userId,
      organizationId: actor.orgIds[0] ?? null,
      branchId: actor.branchIds[0] ?? null,
      profession: body.profession,
      skillsCsv: body.skills.join(","),
      verificationStatus: "pending",
      bio: body.bio,
      isActive: true,
    },
  });

  await appendAudit({
    userId: actor.userId, role: actor.role, action: "professional.created",
    resourceType: "professional", resourceId: row.id,
    orgId: row.organizationId, branchId: row.branchId,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: 201 });
});
