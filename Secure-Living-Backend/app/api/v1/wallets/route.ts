import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { createWalletSchema } from "@/lib/server/validation";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:view");
  if (denied) return denied;
  const rows = await prisma.wallet.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:approve");
  if (denied) return denied;
  const parsed = await parseBody(req, createWalletSchema);
  if (!parsed.ok) return parsed.response;
  const row = await prisma.wallet.create({
    data: { id: randomUUID(), ...parsed.data },
  });
  return Response.json({ data: row }, { status: 201 });
})
