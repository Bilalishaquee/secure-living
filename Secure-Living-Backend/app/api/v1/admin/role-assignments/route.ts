import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

// "Can assign duties and restrict managers" (UPDATE.md Super Admin dashboard spec).
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "rbac:manage");
  if (denied) return denied;

  const url = new URL(req.url);
  const roleSlug = url.searchParams.get("roleSlug");
  const organizationId = url.searchParams.get("organizationId");

  const rows = await prisma.userRoleAssignment.findMany({
    where: {
      ...(roleSlug ? { role: { slug: roleSlug } } : {}),
      ...(organizationId ? { organizationId } : {}),
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      role: { select: { id: true, slug: true, displayName: true } },
      organization: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return Response.json({ data: rows });
});
