import { prisma } from "@/lib/server/db";
import { withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async () => {
  await prisma.$queryRaw`SELECT 1`;
  return Response.json({ data: { ok: true } });
});
