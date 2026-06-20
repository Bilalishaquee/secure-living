import { prisma } from "@/lib/server/db";
import { withErrorHandler, jsonError } from "@/lib/server/http";

// Public route — no auth required so applicants can check their QR token
export const GET = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return jsonError(400, "token query param required");

  const row = await prisma.qrApplication.findUnique({ where: { qrToken: token } });
  if (!row) return jsonError(404, "QR application not found");

  return Response.json({ data: row });
});