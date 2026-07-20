import { prisma } from "@/lib/server/db";
import { withErrorHandler } from "@/lib/server/http";
import { parseStkCallback, type StkCallbackBody } from "@/lib/server/payments/daraja";
import { applyInvoicePayment } from "@/lib/server/payments/apply-invoice-payment";

// Public endpoint — Safaricom calls this directly (no Authorization header, no actor).
// Must be defensively parsed, and idempotent against callback retries.
export const POST = withErrorHandler(async (req: Request) => {
  const body = (await req.json()) as StkCallbackBody;
  const parsed = parseStkCallback(body);

  const request = await prisma.darajaStkRequest.findUnique({ where: { checkoutRequestId: parsed.checkoutRequestId } });
  if (!request) {
    // Unknown checkout request — acknowledge so Safaricom stops retrying, but do nothing.
    return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
  if (request.status !== "pending") {
    // Already processed — same response every time, no duplicate ledger entries.
    return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const success = parsed.resultCode === 0;
  await prisma.darajaStkRequest.update({
    where: { checkoutRequestId: parsed.checkoutRequestId },
    data: {
      status: success ? "success" : "failed",
      resultCode: parsed.resultCode,
      resultDesc: parsed.resultDesc,
      mpesaReceiptNumber: parsed.mpesaReceiptNumber,
      transactionDate: parsed.transactionDate,
      rawCallbackJson: JSON.stringify(body),
    },
  });

  if (success) {
    await applyInvoicePayment({
      invoiceId: request.invoiceId,
      amountKes: parsed.amount ?? request.amountKes,
      paymentMethod: "mpesa_stk",
      mpesaReference: parsed.mpesaReceiptNumber,
      idempotencyKey: parsed.checkoutRequestId,
    });
  }

  return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
})
