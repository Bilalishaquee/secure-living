import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError , withErrorHandler } from "@/lib/server/http";

const uploadRoot = path.join(process.cwd(), "uploads", "kyc");

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const rows = await prisma.kycDocument.findMany({
    where: actor.permissions.includes("*")
      ? {}
      : { OR: [{ userId: actor.userId }, { organizationId: { in: actor.orgIds } }] },
    orderBy: { uploadedAt: "desc" },
    take: 500,
  });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "kyc:upload");
  if (denied) return denied;

  const form = await req.formData();
  const docType = String(form.get("documentType") ?? "");
  const organizationId = String(form.get("organizationId") ?? "") || actor.orgIds[0];
  const branchId = String(form.get("branchId") ?? "") || actor.branchIds[0];
  const file = form.get("file");
  if (!docType || !(file instanceof File)) return jsonError(400, "documentType and file are required");

  const bytes = Buffer.from(await file.arrayBuffer());
  await mkdir(uploadRoot, { recursive: true });
  const fileId = randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const savedPath = path.join(uploadRoot, `${fileId}-${safeName}`);
  await writeFile(savedPath, bytes);

  const row = await prisma.kycDocument.create({
    data: {
      id: fileId,
      userId: actor.userId,
      organizationId: organizationId || null,
      branchId: branchId || null,
      documentType: docType,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      filePath: savedPath,
      fileSizeBytes: bytes.byteLength,
      status: "pending",
    },
  });
  return Response.json({ data: row }, { status: 201 });
})
