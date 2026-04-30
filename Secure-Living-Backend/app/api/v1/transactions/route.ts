import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { createTransactionSchema } from "@/lib/server/validation";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

async function walletBalance(walletId: string): Promise<number> {
  const sum = await prisma.ledgerEntry.aggregate({
    where: { walletId },
    _sum: { amountKes: true },
  });
  return sum._sum.amountKes ?? 0;
}

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:view");
  if (denied) return denied;
  const rows = await prisma.transaction.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:approve");
  if (denied) return denied;
  const parsed = await parseBody(req, createTransactionSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (body.idempotencyKey) {
    const idm = await prisma.idempotencyKey.findUnique({ where: { key: body.idempotencyKey } });
    if (idm?.responseJson) return Response.json(JSON.parse(idm.responseJson));
  }

  const fee = body.feeKes ?? 0;
  const netKes = body.amountKes - fee;
  const txId = randomUUID();
  const tx = await prisma.transaction.create({
    data: {
      id: txId,
      organizationId: body.organizationId,
      propertyId: body.propertyId,
      unitId: body.unitId,
      fromWalletId: body.fromWalletId,
      toWalletId: body.toWalletId,
      amountKes: body.amountKes,
      feeKes: fee,
      netKes,
      transactionType: body.transactionType,
      paymentMethod: body.paymentMethod,
      mpesaReference: body.mpesaReference,
      bankReference: body.bankReference,
      idempotencyKey: body.idempotencyKey,
      status: body.status,
      description: body.description,
    },
  });

  if (body.fromWalletId) {
    const b = await walletBalance(body.fromWalletId);
    await prisma.ledgerEntry.create({
      data: {
        id: randomUUID(),
        walletId: body.fromWalletId,
        transactionId: tx.id,
        entryType: "debit",
        amountKes: -Math.abs(body.amountKes),
        runningBalanceKes: b - Math.abs(body.amountKes),
        description: body.description ?? body.transactionType,
        referenceId: tx.id,
        referenceType: body.transactionType,
      },
    });
  }

  if (body.toWalletId) {
    const b = await walletBalance(body.toWalletId);
    await prisma.ledgerEntry.create({
      data: {
        id: randomUUID(),
        walletId: body.toWalletId,
        transactionId: tx.id,
        entryType: "credit",
        amountKes: Math.abs(netKes),
        runningBalanceKes: b + Math.abs(netKes),
        description: body.description ?? body.transactionType,
        referenceId: tx.id,
        referenceType: body.transactionType,
      },
    });
  }

  const response = { data: tx };
  if (body.idempotencyKey) {
    await prisma.idempotencyKey.upsert({
      where: { key: body.idempotencyKey },
      update: {
        requestHash: JSON.stringify(body),
        responseJson: JSON.stringify(response),
      },
      create: {
        key: body.idempotencyKey,
        requestHash: JSON.stringify(body),
        responseJson: JSON.stringify(response),
      },
    });
  }

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "transaction.created",
    resourceType: "transaction",
    resourceId: tx.id,
    orgId: tx.organizationId,
    afterJson: tx,
  });

  return Response.json(response, { status: 201 });
})
