import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  listingId: z.string().optional(),
  unitId: z.string().optional(),
  applicantName: z.string().min(1),
  applicantPhone: z.string().min(1),
  applicantEmail: z.string().email().optional(),
  metadataJson: z.record(z.string(), z.unknown()).optional(),
});

function generateQrToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "QR-";
  for (let i = 0; i < 32; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const listingId = url.searchParams.get("listingId");
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (listingId) where.listingId = listingId;
  if (status) where.status = status;

  const rows = await prisma.qrApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (body.listingId) {
    const listing = await prisma.listing.findUnique({ where: { id: body.listingId } });
    if (!listing) return Response.json({ error: "Listing not found" }, { status: 400 });
  }

  const row = await prisma.qrApplication.create({
    data: {
      id: randomUUID(),
      listingId: body.listingId ?? null,
      unitId: body.unitId ?? null,
      applicantName: body.applicantName,
      applicantPhone: body.applicantPhone,
      applicantEmail: body.applicantEmail ?? null,
      qrToken: generateQrToken(),
      status: "PENDING",
      metadataJson: body.metadataJson as import("@prisma/client").Prisma.InputJsonValue,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
