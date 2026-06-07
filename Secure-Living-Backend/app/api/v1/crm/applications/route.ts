import { prisma } from "@/lib/server/db";
import { requireActor, withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const rows = await prisma.rentalApplication.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    include: {
      listing: { select: { id: true, title: true, organizationId: true } },
      evidences: true,
      customFieldValues: { include: { field: true } },
    },
  });

  return Response.json({ data: rows });
});
