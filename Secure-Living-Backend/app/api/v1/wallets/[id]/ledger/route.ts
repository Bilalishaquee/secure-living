import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:view");
  if (denied) return denied;
  const rows = await prisma.ledgerEntry.findMany({
    where: { walletId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ data: rows });
})
