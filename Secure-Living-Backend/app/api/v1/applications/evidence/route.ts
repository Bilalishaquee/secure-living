import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  applicationId: z.string().min(1),
  evidenceType: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  filePath: z.string().min(1),
  fileSizeBytes: z.number().int().min(0),
  isRequired: z.boolean().default(false),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const applicationId = url.searchParams.get("applicationId");

  const where: Record<string, unknown> = {};
  if (applicationId) where.applicationId = applicationId;

  const rows = await prisma.applicationEvidence.findMany({
    where,
    orderBy: { uploadedAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;

  const row = await prisma.applicationEvidence.create({
    data: {
      id: randomUUID(),
      applicationId: parsed.data.applicationId,
      evidenceType: parsed.data.evidenceType,
      fileName: parsed.data.fileName,
      mimeType: parsed.data.mimeType,
      filePath: parsed.data.filePath,
      fileSizeBytes: parsed.data.fileSizeBytes,
      isRequired: parsed.data.isRequired,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
