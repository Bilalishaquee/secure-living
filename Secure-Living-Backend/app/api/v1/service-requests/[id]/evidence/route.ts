import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, requireScope, jsonError , withErrorHandler } from "@/lib/server/http";

const uploadRoot = path.join(process.cwd(), "uploads", "service-evidence");

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "maintenance:view");
  if (denied) return denied;

  const sr = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!sr) return jsonError(404, "Service request not found");
  const scoped = requireScope(actor, sr.organizationId, sr.branchId);
  if (scoped) return scoped;

  const rows = await prisma.serviceRequestEvidence.findMany({
    where: { serviceRequestId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "maintenance:update");
  if (denied) return denied;
  const sr = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
  if (!sr) return jsonError(404, "Service request not found");
  const scoped = requireScope(actor, sr.organizationId, sr.branchId);
  if (scoped) return scoped;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError(400, "file is required");
  const mediaType = String(form.get("mediaType") ?? (file.type.startsWith("video/") ? "video" : "photo"));

  const bytes = Buffer.from(await file.arrayBuffer());
  await mkdir(uploadRoot, { recursive: true });
  const id = randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const savedPath = path.join(uploadRoot, `${id}-${safeName}`);
  await writeFile(savedPath, bytes);

  const row = await prisma.serviceRequestEvidence.create({
    data: {
      id,
      serviceRequestId: params.id,
      uploadedByUserId: actor.userId,
      mediaType,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      filePath: savedPath,
      fileSizeBytes: bytes.byteLength,
    },
  });
  return Response.json({ data: row }, { status: 201 });
})
