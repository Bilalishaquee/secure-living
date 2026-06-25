import { prisma } from "@/lib/server/db";

export const DEPOSIT_MODEL_A = "LANDLORD_RESERVE";
export const DEPOSIT_MODEL_B2 = "DEPOSIT_ESCROW";

export function depositHealth(balance: number, obligation: number) {
  if (obligation <= 0) return "fully_covered";
  const ratio = balance / obligation;
  if (ratio >= 1) return "fully_covered";
  if (ratio >= 0.5) return "at_risk";
  return "shortfall";
}

export async function walletBalanceForUser(userId?: string | null) {
  if (!userId) return 0;
  const wallet = await prisma.wallet.findFirst({
    where: { ownerId: userId, walletType: { in: ["LANDLORD", "landlord", "SYSTEM", "system"] } },
    select: { id: true },
  });
  if (!wallet) return 0;
  const ledger = await prisma.ledgerEntry.aggregate({
    where: { walletId: wallet.id },
    _sum: { amountKes: true },
  });
  return ledger._sum.amountKes ?? 0;
}

export async function ensureDepositEscrowForLease(leaseId: string) {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: { depositEscrow: true },
  });
  if (!lease) return null;
  if (lease.depositEscrow) return lease.depositEscrow;

  const property = await prisma.property.findUnique({
    where: { id: lease.propertyId },
    select: { ownerUserId: true, managerUserId: true, createdBy: true },
  });
  const landlordId = property?.ownerUserId ?? property?.managerUserId ?? property?.createdBy ?? lease.createdBy;
  const obligation = lease.depositAmount ?? 0;
  const walletBalance = lease.depositModel === DEPOSIT_MODEL_B2
    ? obligation
    : await walletBalanceForUser(landlordId);

  return prisma.depositEscrow.create({
    data: {
      leaseId: lease.id,
      organizationId: lease.organizationId,
      tenantId: lease.tenantUserId,
      landlordId,
      propertyId: lease.propertyId,
      unitId: lease.unitId,
      model: lease.depositModel,
      baseAmount: obligation,
      currentBalance: lease.depositModel === DEPOSIT_MODEL_B2 ? obligation : walletBalance,
      status: "active",
      topUpLog: [],
      walletWatchActive: shouldActivateWalletWatch(lease.endDate),
      healthStatus: depositHealth(walletBalance, obligation),
    },
  });
}

export function shouldActivateWalletWatch(endDate: Date) {
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  return endDate.getTime() - now <= ninetyDaysMs;
}

export async function refreshDepositHealth(leaseId: string) {
  const escrow = await ensureDepositEscrowForLease(leaseId);
  if (!escrow) return null;
  const lease = await prisma.lease.findUnique({ where: { id: leaseId } });
  if (!lease) return escrow;
  const walletBalance = escrow.model === DEPOSIT_MODEL_B2
    ? escrow.currentBalance
    : await walletBalanceForUser(escrow.landlordId);
  const healthStatus = depositHealth(walletBalance, lease.depositAmount ?? escrow.baseAmount);
  return prisma.depositEscrow.update({
    where: { leaseId },
    data: {
      currentBalance: walletBalance,
      walletWatchActive: shouldActivateWalletWatch(lease.endDate),
      healthStatus,
    },
  });
}
