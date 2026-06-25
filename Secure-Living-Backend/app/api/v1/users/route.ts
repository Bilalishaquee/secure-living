import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const excludeProviders = searchParams.get("excludeProviders") === "true";
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);
  const isGlobal = actor.role === "super_admin" || actor.permissions.includes("*");

  const providerUserIds = excludeProviders
    ? (await prisma.serviceProvider.findMany({ select: { userId: true } })).map((p) => p.userId)
    : [];

  const rows = await prisma.appUser.findMany({
    where: {
      ...(isGlobal ? {} : { roleAssignments: { some: { organizationId: { in: actor.orgIds } } } }),
      ...(providerUserIds.length ? { id: { notIn: providerUserIds } } : {}),
      ...(q
        ? {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, fullName: true, email: true, phone: true, status: true },
    orderBy: { fullName: "asc" },
    take: limit,
  });

  return Response.json({
    data: rows.map((u) => ({
      id: u.id,
      name: u.fullName,
      email: u.email,
      phone: u.phone,
      status: u.status,
    })),
  });
});
