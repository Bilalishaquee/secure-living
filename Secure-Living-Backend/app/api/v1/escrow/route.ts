import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { createEscrowSchema } from "@/lib/server/validation";
import { parseBody, requireActor, requirePermission , withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:view");
  if (denied) return denied;
  const rows = await prisma.escrowAccount.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "finance:approve");
  if (denied) return denied;
  const parsed = await parseBody(req, createEscrowSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const row = await prisma.escrowAccount.create({
    data: {
      id: randomUUID(),
      ...body,
      status: "held",
      heldAt: new Date(),
    },
  });
  return Response.json({ data: row }, { status: 201 });
})
