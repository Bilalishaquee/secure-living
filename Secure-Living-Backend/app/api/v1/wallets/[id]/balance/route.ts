import { prisma } from "@/lib/server/db";
import { jsonError, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:view");
  if (denied) return denied;
  const wallet = await prisma.wallet.findUnique({ where: { id: params.id } });
  if (!wallet) return jsonError(404, "Wallet not found");
  const sum = await prisma.ledgerEntry.aggregate({
    where: { walletId: params.id },
    _sum: { amountKes: true },
  });
  return Response.json({ data: { walletId: params.id, balanceKes: sum._sum.amountKes ?? 0 } });
})
