import { prisma } from "@/lib/server/db";
import { payRentInvoiceSchema } from "@/lib/server/validation";
import { parseBody, requireActor, requirePermission, jsonError , withErrorHandler } from "@/lib/server/http";
import { applyInvoicePayment } from "@/lib/server/payments/apply-invoice-payment";

type Ctx = { params: { id: string } };

function generatePaymentReference(invoiceId: string) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `PAY-${stamp}-${invoiceId.slice(0, 8).toUpperCase()}`;
}

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "rent_collection:manage");
  if (denied) return denied;
  const parsed = await parseBody(req, payRentInvoiceSchema);
  if (!parsed.ok) return parsed.response;
  const inv = await prisma.rentInvoice.findUnique({ where: { id: params.id } });
  if (!inv) return jsonError(404, "Invoice not found");
  if (inv.balanceKes <= 0) return jsonError(409, "Invoice is already paid");
  if (parsed.data.amountKes > inv.balanceKes) return jsonError(400, "Payment amount cannot exceed the invoice balance");

  const paymentReference = parsed.data.mpesaReference?.trim() || generatePaymentReference(inv.id);
  const updated = await applyInvoicePayment({
    invoiceId: params.id,
    amountKes: parsed.data.amountKes,
    paymentMethod: parsed.data.paymentMethod,
    mpesaReference: paymentReference,
  });
  return Response.json({ data: updated });
})
