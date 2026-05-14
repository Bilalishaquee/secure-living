import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError, withErrorHandler } from "@/lib/server/http";

const createVacatingSchema = z.object({
  leaseId: z.string().min(1),
  intendedMoveOut: z.string().min(1),
  noticePeriodDays: z.number().int().positive().default(30),
  tenantNote: z.string().optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "vacating:view");
  if (denied) return denied;

  const orgId = actor.orgIds?.[0];
  const url = new URL(req.url);
  const unitId = url.searchParams.get("unitId");
  const tenantId = url.searchParams.get("tenantId");

  const rows = await prisma.vacatingNotice.findMany({
    where: {
      organizationId: orgId ?? undefined,
      ...(unitId && { unitId }),
      ...(tenantId && { tenantId }),
    },
    include: {
      inspection: { include: { deductions: true } },
      depositRefund: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "vacating:create");
  if (denied) return denied;

  const parsed = await parseBody(req, createVacatingSchema);
  if (!parsed.ok) return parsed.response;

  const lease = await prisma.lease.findUnique({ where: { id: parsed.data.leaseId } });
  if (!lease) return jsonError(404, "Lease not found");
  if (lease.status !== "active") return jsonError(400, "Lease is not active");

  const existing = await prisma.vacatingNotice.findUnique({ where: { leaseId: parsed.data.leaseId } });
  if (existing) return jsonError(409, "Vacating notice already submitted for this lease");

  const noticeDate = new Date();
  const intendedMoveOut = new Date(parsed.data.intendedMoveOut);
  const noticePeriodDays = parsed.data.noticePeriodDays ?? 30;
  const enforcedMoveOut = new Date(noticeDate);
  enforcedMoveOut.setDate(enforcedMoveOut.getDate() + noticePeriodDays);

  const row = await prisma.vacatingNotice.create({
    data: {
      leaseId: parsed.data.leaseId,
      unitId: lease.unitId,
      tenantId: lease.tenantUserId,
      organizationId: lease.organizationId,
      noticeDate,
      intendedMoveOut,
      enforcedMoveOut,
      noticePeriodDays,
      tenantNote: parsed.data.tenantNote,
      status: "PENDING",
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
