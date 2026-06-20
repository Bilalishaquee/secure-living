import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, withErrorHandler } from "@/lib/server/http";

const updateMeSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
});

export const PATCH = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, updateMeSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.appUser.update({
    where: { id: actor.userId },
    data: {
      ...(parsed.data.fullName !== undefined && { fullName: parsed.data.fullName }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
    },
    select: { id: true, email: true, fullName: true, phone: true },
  });

  return Response.json({ data: updated });
});