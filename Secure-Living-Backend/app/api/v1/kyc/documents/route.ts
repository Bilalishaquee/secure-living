import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError , withErrorHandler } from "@/lib/server/http";
import { prepareUploadedDocument } from "@/lib/server/document-upload";
import { notify } from "@/lib/server/notify";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const rows = await prisma.kycDocument.findMany({
    where: actor.permissions.includes("*")
      ? {}
      : { OR: [{ userId: actor.userId }, { organizationId: { in: actor.orgIds } }] },
    orderBy: { uploadedAt: "desc" },
    take: 500,
    select: {
      id: true,
      userId: true,
      organizationId: true,
      branchId: true,
      documentType: true,
      fileName: true,
      mimeType: true,
      filePath: true,
      fileSizeBytes: true,
      status: true,
      uploadedAt: true,
      reviewedAt: true,
      reviewedByUserId: true,
      rejectionReason: true,
    },
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

  const prepared = await prepareUploadedDocument(file);
  if (!prepared.ok) return jsonError(prepared.status, prepared.message);
  const document = prepared.data;

  const row = await prisma.kycDocument.create({
    data: {
      id: document.id,
      userId: actor.userId,
      organizationId: organizationId || null,
      branchId: branchId || null,
      documentType: docType,
      fileName: document.fileName,
      mimeType: document.mimeType,
      filePath: document.storagePath,
      fileBytes: document.fileBytes,
      fileSizeBytes: document.fileSizeBytes,
      status: "pending",
    },
    select: {
      id: true,
      userId: true,
      organizationId: true,
      branchId: true,
      documentType: true,
      fileName: true,
      mimeType: true,
      filePath: true,
      fileSizeBytes: true,
      status: true,
      uploadedAt: true,
      reviewedAt: true,
      reviewedByUserId: true,
      rejectionReason: true,
    },
  });

  await notify({
    organizationId: row.organizationId,
    branchId: row.branchId,
    excludeUserId: actor.userId,
    type: "kyc.document.submitted",
    severity: "warning",
    title: "KYC document submitted",
    message: `${actor.email} uploaded ${row.documentType.replace(/_/g, " ")} for review.`,
    resourceType: "KycDocument",
    resourceId: row.id,
    link: `/admin/kyc?filter=pending&doc=${row.id}`,
  });

  await notify({
    organizationId: row.organizationId,
    branchId: row.branchId,
    roles: [],
    userIds: [actor.userId],
    type: "kyc.document.received",
    severity: "info",
    title: "KYC document received",
    message: `Your ${row.documentType.replace(/_/g, " ")} was submitted and is pending review.`,
    resourceType: "KycDocument",
    resourceId: row.id,
    link: "/kyc",
  });

  return Response.json({ data: row }, { status: 201 });
})
