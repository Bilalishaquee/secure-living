import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { createTenantApplicationSchema } from "@/lib/server/validation";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "tenant:view");
  if (denied) return denied;
  const rows = await prisma.tenantApplication.findMany({
    where: { listingId: params.id },
    orderBy: { appliedAt: "desc" },
  });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "tenant:create");
  if (denied) return denied;
  const parsed = await parseBody(req, createTenantApplicationSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const row = await prisma.tenantApplication.create({
    data: {
      id: randomUUID(),
      listingId: params.id,
      unitId: body.unitId,
      applicantName: body.applicantName,
      applicantEmail: body.applicantEmail,
      applicantPhone: body.applicantPhone,
      nationalIdNumber: body.nationalIdNumber,
      employerName: body.employerName,
      monthlyIncomeKes: body.monthlyIncomeKes,
      motivationLetter: body.motivationLetter,
      status: "submitted",
    },
  });
  return Response.json({ data: row }, { status: 201 });
})
