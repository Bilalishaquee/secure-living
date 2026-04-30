import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

const schema = z.object({
  walletId: z.string().min(1),
  amountKes: z.number().positive(),
  reason: z.string().min(2),
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:approve");
  if (denied) return denied;
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;
  const row = await prisma.fundHold.create({
    data: {
      id: randomUUID(),
      walletId: parsed.data.walletId,
      amountKes: parsed.data.amountKes,
      reason: parsed.data.reason,
      heldByUserId: actor.userId,
      isActive: true,
    },
  });
  return Response.json({ data: row }, { status: 201 });
})
