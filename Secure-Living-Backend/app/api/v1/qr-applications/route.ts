import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  listingId: z.string().optional(),
  unitId: z.string().optional(),
  applicantName: z.string().min(2),
  applicantPhone: z.string().min(7),
  applicantEmail: z.string().email().optional(),
  metadataJson: z.record(z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "kyc:manage");
  if (denied) return denied;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const listingId = url.searchParams.get("listingId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (listingId) where.listingId = listingId;

  const rows = await prisma.qrApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "kyc:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const b = parsed.data;

  const qrToken = randomUUID().replace(/-/g, "");
  const row = await prisma.qrApplication.create({
    data: {
      id: randomUUID(),
      qrToken,
      listingId: b.listingId ?? null,
      unitId: b.unitId ?? null,
      applicantName: b.applicantName,
      applicantPhone: b.applicantPhone,
      applicantEmail: b.applicantEmail ?? null,
      status: "PENDING",
      metadataJson: b.metadataJson ? (b.metadataJson as import('@prisma/client').Prisma.InputJsonValue) : undefined,
    },
  });
  return Response.json({ data: row }, { status: 201 });
});