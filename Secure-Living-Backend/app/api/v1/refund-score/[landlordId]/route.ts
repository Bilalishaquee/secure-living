import { prisma } from "@/lib/server/db";
import { withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { landlordId: string } };

export const GET = withErrorHandler(async (_req: Request, { params }: Ctx) => {
  const score = await prisma.landlordRefundScore.findUnique({ where: { landlordId: params.landlordId } });
  return Response.json({
    data: score ?? {
      landlordId: params.landlordId,
      score: "prompt",
      totalRefunds: 0,
      onTimeRefunds: 0,
      disputedRefunds: 0,
      lastUpdated: null,
    },
  });
});
