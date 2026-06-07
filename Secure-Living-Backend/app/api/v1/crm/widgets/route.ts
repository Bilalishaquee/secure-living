import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const upsertWidgetSchema = z.object({
  widgetType: z.string().min(1),
  label: z.string().optional(),
  position: z.number().int().default(0),
  isVisible: z.boolean().default(true),
  configJson: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const rows = await prisma.dashboardWidget.findMany({
    where: { userId: actor.userId },
    orderBy: { position: "asc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, upsertWidgetSchema);
  if (!parsed.ok) return parsed.response;

  const existing = await prisma.dashboardWidget.findUnique({
    where: { userId_widgetType: { userId: actor.userId, widgetType: parsed.data.widgetType } },
  });

  if (existing) {
    const updated = await prisma.dashboardWidget.update({
      where: { id: existing.id },
      data: {
        label: parsed.data.label,
        position: parsed.data.position,
        isVisible: parsed.data.isVisible,
        configJson: parsed.data.configJson as import("@prisma/client").Prisma.InputJsonValue,
      },
    });
    return Response.json({ data: updated });
  }

  const row = await prisma.dashboardWidget.create({
    data: {
      id: randomUUID(),
      userId: actor.userId,
      organizationId: actor.orgIds?.[0] ?? null,
      widgetType: parsed.data.widgetType,
      label: parsed.data.label,
      position: parsed.data.position,
      isVisible: parsed.data.isVisible,
      configJson: parsed.data.configJson as import("@prisma/client").Prisma.InputJsonValue,
    },
  });

  return Response.json({ data: row }, { status: 201 });
});

export const DELETE = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonError(400, "id query parameter is required");

  const existing = await prisma.dashboardWidget.findUnique({ where: { id } });
  if (!existing) return jsonError(404, "Widget not found");
  if (existing.userId !== actor.userId) return jsonError(403, "Forbidden");

  await prisma.dashboardWidget.delete({ where: { id } });
  return Response.json({ data: { deleted: true } });
});
