import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { initiateStkPushSchema } from "@/lib/server/validation";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";
import { stkPush } from "@/lib/server/payments/daraja";

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const parsed = await parseBody(req, initiateStkPushSchema);
  if (!parsed.ok) return parsed.response;

  const inv = await prisma.rentInvoice.findUnique({ where: { id: parsed.data.invoiceId } });
  if (!inv) return jsonError(404, "Invoice not found");
  if (inv.tenantId !== actor.userId && !actor.permissions.includes("rent_collection:manage") && actor.role !== "super_admin") {
    return jsonError(403, "Forbidden");
  }
  if (inv.balanceKes <= 0) return jsonError(409, "Invoice is already paid");

  const callbackBase = process.env.DARAJA_CALLBACK_BASE_URL;
  if (!callbackBase) return jsonError(500, "DARAJA_CALLBACK_BASE_URL is not configured");

  const payeeLabel = parsed.data.payeeLabel?.trim();

  const stk = await stkPush({
    phoneNumber: parsed.data.phoneNumber,
    amountKes: inv.balanceKes,
    accountReference: payeeLabel || inv.invoiceNumber,
    transactionDesc: payeeLabel ? `Pay ${payeeLabel}` : "Rent payment",
    callbackUrl: `${callbackBase.replace(/\/$/, "")}/api/v1/payments/daraja/callback`,
  });

  const request = await prisma.darajaStkRequest.create({
    data: {
      id: randomUUID(),
      checkoutRequestId: stk.CheckoutRequestID,
      merchantRequestId: stk.MerchantRequestID,
      invoiceId: inv.id,
      tenantUserId: inv.tenantId,
      phoneNumber: parsed.data.phoneNumber,
      amountKes: inv.balanceKes,
      status: "pending",
    },
  });

  return Response.json({ data: { checkoutRequestId: request.checkoutRequestId, customerMessage: stk.CustomerMessage } });
})
