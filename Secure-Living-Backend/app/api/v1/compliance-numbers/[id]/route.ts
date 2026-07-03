import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string } };

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED"]),
  revokedReason: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const row = await prisma.complianceNumber.findUnique({ where: { id: params.id } });
  if (!row) return jsonError(404, "Not found");

  return Response.json({ data: row });
});

export const PATCH = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const existing = await prisma.complianceNumber.findUnique({ where: { id: params.id } });
  if (!existing) return jsonError(404, "Not found");

  const parsed = await parseBody(req, updateStatusSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.complianceNumber.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.status === "REVOKED"
        ? { revokedAt: new Date(), revokedReason: parsed.data.revokedReason ?? null }
        : {}),
    },
  });

  if (parsed.data.status === "REVOKED") {
    await notify({
      organizationId: existing.organizationId,
      roles: ["super_admin", "admin"],
      userIds: (existing.subjectType === "TENANT" || existing.subjectType === "USER") && existing.subjectId ? [existing.subjectId] : [],
      excludeUserId: actor.userId,
      type: "compliance_number.revoked",
      severity: "warning",
      title: "Compliance number revoked",
      message: `${existing.complianceId} was revoked${parsed.data.revokedReason ? `: ${parsed.data.revokedReason}` : "."}`,
      resourceType: "ComplianceNumber",
      resourceId: existing.id,
      link: "/compliance",
    });
  }

  return Response.json({ data: updated });
});
