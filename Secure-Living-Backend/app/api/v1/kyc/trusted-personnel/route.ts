import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const uploadRoot = path.join(process.cwd(), "uploads", "kyc", "good-conduct");

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

  // Verify document is within 12 months (client-declared date — admin will verify)
  const issueDateStr = String(form.get("issueDate") ?? "");
  if (!issueDateStr) return jsonError(400, "issueDate is required");
  const issueDate = new Date(issueDateStr);
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  if (issueDate < twelveMonthsAgo) {
    return jsonError(400, "Good Conduct Certificate must be dated within the last 12 months");
  }

  await mkdir(uploadRoot, { recursive: true });
  const fileId = randomUUID();
  const savedPath = path.join(uploadRoot, `${fileId}-good-conduct.pdf`);
  await writeFile(savedPath, Buffer.from(await file.arrayBuffer()));

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
  await prisma.kycDocument.create({
    data: {
      id: fileId,
      userId: actor.userId,
      documentType: "good_conduct_certificate",
      fileName: file.name,
      mimeType: file.type,
      filePath: savedPath,
      fileSizeBytes: (await file.arrayBuffer()).byteLength,
      status: "pending",
    },
  });

  return Response.json({
    data: { message: "Application submitted. Admin will review within 5 business days." },
  }, { status: 201 });
});
