import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { notify } from "@/lib/server/notify";

export type ApplyInvoicePaymentInput = {
  invoiceId: string;
  amountKes: number;
  paymentMethod: string;
  mpesaReference?: string | null;
  idempotencyKey?: string | null;
};

/**
 * Single place that marks a rent invoice as (partially) paid and records the
 * matching ledger Transaction — used by both the landlord's manual "Record payment"
 * action and the Daraja STK Push callback, so the two paths can never drift apart.
 */
export async function applyInvoicePayment(input: ApplyInvoicePaymentInput) {
  const inv = await prisma.rentInvoice.findUnique({ where: { id: input.invoiceId } });
  if (!inv) throw new Error("Invoice not found");
  if (inv.balanceKes <= 0) return inv;

  const amountKes = Math.min(input.amountKes, inv.balanceKes);
  const amountPaid = inv.amountPaidKes + amountKes;
  const balance = Math.max(0, inv.totalDueKes - amountPaid);
  const status = balance === 0 ? "paid" : "partially_paid";

  const [updated, lease] = await prisma.$transaction([
    prisma.rentInvoice.update({
      where: { id: input.invoiceId },
      data: {
        amountPaidKes: amountPaid,
        balanceKes: balance,
        paymentMethod: input.paymentMethod,
        mpesaReference: input.mpesaReference ?? undefined,
        status,
        paidAt: balance === 0 ? new Date() : undefined,
      },
    }),
    prisma.lease.findUnique({ where: { id: inv.leaseId }, select: { organizationId: true } }),
  ]);

  await prisma.transaction.create({
    data: {
      id: randomUUID(),
      organizationId: lease?.organizationId,
      propertyId: inv.propertyId,
      unitId: inv.unitId,
      amountKes,
      feeKes: 0,
      netKes: amountKes,
      transactionType: "rent_payment",
      paymentMethod: input.paymentMethod,
      mpesaReference: input.mpesaReference,
      idempotencyKey: input.idempotencyKey,
      status: "completed",
      description: `Rent payment for invoice ${inv.invoiceNumber}`,
    },
  });

  await notify({
    organizationId: lease?.organizationId ?? null,
    roles: ["admin"],
    userIds: [inv.landlordId, inv.tenantId],
    type: "rent_payment_received",
    title: "Rent payment received",
    message: `KES ${amountKes.toLocaleString()} received for invoice ${inv.invoiceNumber}.`,
    resourceType: "rent_invoice",
    resourceId: inv.id,
  });

  return updated;
}
