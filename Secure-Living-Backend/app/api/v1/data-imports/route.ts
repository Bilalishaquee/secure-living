import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";

const createSchema = z.object({
  organizationId: z.string().min(1),
  branchId: z.string().optional(),
  importType: z.enum(["properties", "units", "tenants", "leases", "past_rent", "utilities"]),
  fileName: z.string().min(1),
  fileFormat: z.enum(["csv", "excel", "json"]),
  columnMapping: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const organizationId = url.searchParams.get("organizationId") || actor.orgIds?.[0];

  if (!organizationId) return Response.json({ data: [] });

  const rows = await prisma.dataImportJob.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;

  const row = await prisma.dataImportJob.create({
    data: {
      id: randomUUID(),
      organizationId: parsed.data.organizationId,
      branchId: parsed.data.branchId ?? null,
      importType: parsed.data.importType,
      fileName: parsed.data.fileName,
      fileFormat: parsed.data.fileFormat,
      columnMapping: parsed.data.columnMapping as import("@prisma/client").Prisma.InputJsonValue,
      createdBy: actor.userId,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
