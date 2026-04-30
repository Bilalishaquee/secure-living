import { prisma } from "@/lib/server/db";
import { payRentInvoiceSchema } from "@/lib/server/validation";
import { parseBody, requireActor, requirePermission, jsonError , withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "rent_collection:manage");
  if (denied) return denied;
  const parsed = await parseBody(req, payRentInvoiceSchema);
  if (!parsed.ok) return parsed.response;
  const inv = await prisma.rentInvoice.findUnique({ where: { id: params.id } });
  if (!inv) return jsonError(404, "Invoice not found");
  const amountPaid = inv.amountPaidKes + parsed.data.amountKes;
  const balance = Math.max(0, inv.totalDueKes - amountPaid);
  const status = balance === 0 ? "paid" : "partially_paid";
  const updated = await prisma.rentInvoice.update({
    where: { id: params.id },
    data: {
      amountPaidKes: amountPaid,
      balanceKes: balance,
      paymentMethod: parsed.data.paymentMethod,
      mpesaReference: parsed.data.mpesaReference,
      status,
      paidAt: balance === 0 ? new Date() : undefined,
    },
  });
  return Response.json({ data: updated });
})
