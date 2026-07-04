import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler } from "@/lib/server/http";
import { prepareUploadedDocument } from "@/lib/server/document-upload";
import { notify } from "@/lib/server/notify";

// POST /api/v1/kyc/trusted-personnel — apply for Level 3 Trusted Personnel status
export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const user = await prisma.appUser.findUnique({
    where: { id: actor.userId },
    select: {
      verificationLevel: true,
      createdAt: true,
      trustedPersonnelStatus: true,
      trustedPersonnelReviewedAt: true,
    },
  });
  if (!user) return jsonError(404, "User not found");

  if (user.verificationLevel !== "COMPLIANCE_VERIFIED" && user.verificationLevel !== "TRUSTED_PERSONNEL" && user.verificationLevel !== "ENTERPRISE_VERIFIED") {
    return jsonError(400, "Level 2 (Compliance Verified) is required before applying for Trusted Personnel status");
  }

  // Check 3-month active requirement
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  if (user.createdAt > threeMonthsAgo) {
    return jsonError(400, "You must be active on the platform for at least 3 months to apply");
  }

  if (user.trustedPersonnelStatus === "PENDING") {
    return jsonError(400, "A Trusted Personnel application is already under review");
  }

  // Check 30-day reapply rule
  if (user.trustedPersonnelStatus === "DENIED" && user.trustedPersonnelReviewedAt) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (user.trustedPersonnelReviewedAt > thirtyDaysAgo) {
      return jsonError(400, "You may reapply 30 days after a denial");
    }
  }

  const form = await req.formData();
  const file = form.get("goodConductCertificate");
  if (!(file instanceof File)) return jsonError(400, "Good Conduct Certificate PDF is required");
  if (!file.type.includes("pdf")) return jsonError(400, "Good Conduct Certificate must be a PDF");
  const prepared = await prepareUploadedDocument(file);
  if (!prepared.ok) return jsonError(prepared.status, prepared.message);
  const document = prepared.data;

  // Verify document is within 12 months (client-declared date — admin will verify)
  const issueDateStr = String(form.get("issueDate") ?? "");
  if (!issueDateStr) return jsonError(400, "issueDate is required");
  const issueDate = new Date(issueDateStr);
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  if (issueDate < twelveMonthsAgo) {
    return jsonError(400, "Good Conduct Certificate must be dated within the last 12 months");
  }

  const expiryDate = new Date(issueDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  await prisma.appUser.update({
    where: { id: actor.userId },
    data: {
      trustedPersonnelStatus: "PENDING",
      goodConductUploadedAt: new Date(),
      goodConductExpiresAt: expiryDate,
      trustedPersonnelReviewedAt: null,
      trustedPersonnelReviewedBy: null,
    },
  });

  // Store the certificate as a KYC document for admin review
  const kycDoc = await prisma.kycDocument.create({
    data: {
      id: document.id,
      userId: actor.userId,
      documentType: "good_conduct_certificate",
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
      status: true,
    },
  });

  await notify({
    organizationId: kycDoc.organizationId,
    branchId: kycDoc.branchId,
    excludeUserId: actor.userId,
    type: "kyc.trusted_personnel.submitted",
    severity: "warning",
    title: "Trusted Personnel KYC submitted",
    message: `${actor.email} submitted a Good Conduct Certificate for Trusted Personnel review.`,
    resourceType: "KycDocument",
    resourceId: kycDoc.id,
    link: `/admin/kyc?filter=pending&doc=${kycDoc.id}`,
  });

  await notify({
    organizationId: kycDoc.organizationId,
    branchId: kycDoc.branchId,
    roles: [],
    userIds: [actor.userId],
    type: "kyc.trusted_personnel.received",
    severity: "info",
    title: "Trusted Personnel application received",
    message: "Your Good Conduct Certificate was submitted and is pending admin review.",
    resourceType: "KycDocument",
    resourceId: kycDoc.id,
    link: "/kyc",
  });

  return Response.json({
    data: { message: "Application submitted. Admin will review within 5 business days." },
  }, { status: 201 });
});
