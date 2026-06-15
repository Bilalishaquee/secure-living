import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { withErrorHandler, jsonError } from "@/lib/server/http";

// Public endpoint — no auth required.
// Used by the QR scan landing page to verify a token and log the scan.
export const GET = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) return jsonError(400, "token is required");

  const application = await prisma.qrApplication.findUnique({
    where: { qrToken: token },
    select: {
      id: true,
      qrToken: true,
      applicantName: true,
      applicantPhone: true,
      applicantEmail: true,
      listingId: true,
      unitId: true,
      status: true,
      createdAt: true,
    },
  });

  if (!application) return jsonError(404, "QR token not found or expired");

  // Log the scan silently
  await prisma.qrAccessLog.create({
    data: {
      id: randomUUID(),
      qrToken: token,
      accessType: "QR_SCAN",
      granted: application.status !== "EXPIRED",
      reason: application.status === "EXPIRED" ? "Application expired" : null,
    },
  }).catch(() => null); // non-fatal

  return Response.json({ data: application });
});
