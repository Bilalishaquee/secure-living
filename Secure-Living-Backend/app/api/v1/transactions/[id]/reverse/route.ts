import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, jsonError , withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:approve");
  if (denied) return denied;
  const original = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!original) return jsonError(404, "Transaction not found");
  if (original.reversalTransactionId) return jsonError(400, "Already reversed");

  const reversal = await prisma.transaction.create({
    data: {
      id: randomUUID(),
      organizationId: original.organizationId,
      propertyId: original.propertyId,
      unitId: original.unitId,
      fromWalletId: original.toWalletId,
      toWalletId: original.fromWalletId,
      amountKes: original.amountKes,
      feeKes: 0,
      netKes: original.amountKes,
      transactionType: "reversal",
      paymentMethod: original.paymentMethod,
      status: "completed",
      description: `Reversal of ${original.id}`,
    },
  });
  await prisma.transaction.update({
    where: { id: original.id },
    data: { reversalTransactionId: reversal.id, reversedAt: new Date() },
  });
  return Response.json({ data: reversal });
})
