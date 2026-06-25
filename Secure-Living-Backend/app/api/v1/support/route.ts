import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const module = url.searchParams.get("module") ?? "tickets";
  const isGlobal = actor.role === "super_admin" || actor.permissions.includes("*");
  const orgWhere = isGlobal ? {} : { organizationId: { in: actor.orgIds } };

  if (module === "contacts") {
    const rows = await prisma.contactRequest.findMany({
      where: orgWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return Response.json({ data: rows });
  }

  if (module === "leads") {
    const rows = await prisma.crmLead.findMany({
      where: orgWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return Response.json({ data: rows });
  }

  const rows = await prisma.supportTicket.findMany({
    where: orgWhere,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return Response.json({ data: rows });
});
