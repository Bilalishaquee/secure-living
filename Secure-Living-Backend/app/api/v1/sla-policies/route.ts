import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

const createSlaPolicySchema = z.object({
  name: z.string().min(1),
  serviceType: z.string().min(1),
  responseDeadlineMinutes: z.number().int().positive().default(60),
  completionDeadlineMinutes: z.number().int().positive().default(1440),
  escalationAfterMinutes: z.number().int().positive().default(120),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const rows = await prisma.slaPolicy.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, createSlaPolicySchema);
  if (!parsed.ok) return parsed.response;

  const row = await prisma.slaPolicy.create({ data: parsed.data });
  return Response.json({ data: row }, { status: 201 });
});
