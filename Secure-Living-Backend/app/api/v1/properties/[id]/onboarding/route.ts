import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

const configSchema = z.object({
  isShortStayEnabled: z.boolean().default(false),
  visitorApprovalRequired: z.boolean().default(false),
  gateAccessRequired: z.boolean().default(false),
  maintenanceSla: z.string().optional(),
  customOnboardingFields: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property) return jsonError(404, "Property not found");

  const config = await prisma.propertyOnboardingConfig.findUnique({
    where: { propertyId: params.id },
  });

  if (!config) return jsonError(404, "Onboarding config not found");

  return Response.json({ data: config });
});

export const PUT = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const property = await prisma.property.findUnique({ where: { id: params.id } });
  if (!property) return jsonError(404, "Property not found");

  const parsed = await parseBody(req, configSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const config = await prisma.propertyOnboardingConfig.upsert({
    where: { propertyId: params.id },
    create: {
      id: randomUUID(),
      propertyId: params.id,
      isShortStayEnabled: body.isShortStayEnabled,
      visitorApprovalRequired: body.visitorApprovalRequired,
      gateAccessRequired: body.gateAccessRequired,
      maintenanceSla: body.maintenanceSla ?? null,
      customOnboardingFields: body.customOnboardingFields as import("@prisma/client").Prisma.InputJsonValue,
    },
    update: {
      isShortStayEnabled: body.isShortStayEnabled,
      visitorApprovalRequired: body.visitorApprovalRequired,
      gateAccessRequired: body.gateAccessRequired,
      maintenanceSla: body.maintenanceSla ?? null,
      customOnboardingFields: body.customOnboardingFields as import("@prisma/client").Prisma.InputJsonValue,
    },
  });

  return Response.json({ data: config });
});
