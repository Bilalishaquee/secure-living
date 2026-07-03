import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

// Admin queue of Management Assistance inquiries, scoped to the admin's own
// branches ("admins of the concerned geographical locations") unless they hold "*".
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "org:manage");
  if (denied) return denied;

  const isSuperAdmin = actor.permissions.includes("*");
  const url = new URL(req.url);
  const escalatedOnly = url.searchParams.get("escalated") === "true";

  const rows = await prisma.managementInquiry.findMany({
    where: {
      ...(isSuperAdmin ? {} : { organizationId: { in: actor.orgIds }, branchId: { in: actor.branchIds } }),
      ...(escalatedOnly && { escalatedToSuperAdmin: true }),
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});
