import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  serviceType: z.string().min(1),
  mode: z.enum(["ALLOWED", "BLOCKED"]),
  reason: z.string().optional(),
});

// Admin-only: list all restrictions, optionally scoped to an org/user.
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "platform:service-restrictions:manage");
  if (denied) return denied;

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId");
  const userId = url.searchParams.get("userId");

  const rows = await prisma.serviceAccessRestriction.findMany({
    where: {
      ...(organizationId ? { organizationId } : {}),
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "platform:service-restrictions:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const existing = await prisma.serviceAccessRestriction.findFirst({
    where: {
      organizationId: body.organizationId ?? null,
      userId: body.userId ?? null,
      serviceType: body.serviceType,
    },
  });

  const row = existing
    ? await prisma.serviceAccessRestriction.update({
        where: { id: existing.id },
        data: { mode: body.mode, reason: body.reason ?? null },
      })
    : await prisma.serviceAccessRestriction.create({
        data: {
          id: randomUUID(),
          organizationId: body.organizationId ?? null,
          userId: body.userId ?? null,
          serviceType: body.serviceType,
          mode: body.mode,
          reason: body.reason ?? null,
          createdBy: actor.userId,
        },
      });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: existing ? "service_access_restriction.updated" : "service_access_restriction.created",
    resourceType: "ServiceAccessRestriction",
    resourceId: row.id,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: existing ? 200 : 201 });
});
