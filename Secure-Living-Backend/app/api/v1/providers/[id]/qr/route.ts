import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

// Public endpoint — no auth required. QR code links to public provider identity page.
export const GET = withErrorHandler(async (_req: Request, { params }: Ctx) => {
  const provider = await prisma.serviceProvider.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      qrCodeUrl: true,
      status: true,
      userId: true,
    },
  });
  if (!provider) return jsonError(404, "Provider not found");

  // Log QR scan event
  await prisma.serviceProviderAuditLog.create({
    data: {
      id: randomUUID(),
      providerId: params.id,
      action: "qr_scanned",
      reviewedBy: "public",
    },
  });

  // Emit outbox event
  await prisma.outboxEvent.create({
    data: {
      id: randomUUID(),
      eventType: "provider.qr_scanned",
      payload: { providerId: params.id, scannedAt: new Date().toISOString() },
    },
  });

  return Response.json({
    data: {
      providerId: provider.id,
      qrCodeUrl: provider.qrCodeUrl,
      providerName: provider.userId,
      status: provider.status,
    },
  });
});
