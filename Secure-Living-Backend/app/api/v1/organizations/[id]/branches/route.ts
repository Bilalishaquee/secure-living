import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, jsonError , withErrorHandler } from "@/lib/server/http";
import { z } from "zod";

const createBranchSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional(),
});

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "org:manage");
  if (denied) return denied;
  if (!actor.permissions.includes("*") && !actor.orgIds.includes(params.id)) {
    return jsonError(403, "Out of scope");
  }
  const parsed = await parseBody(req, createBranchSchema);
  if (!parsed.ok) return parsed.response;
  const branch = await prisma.branch.create({
    data: {
      id: randomUUID(),
      organizationId: params.id,
      name: parsed.data.name,
      location: parsed.data.location,
    },
  });
  return Response.json({ data: branch }, { status: 201 });
})
