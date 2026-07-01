import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

// Accept both the backend model field names and the shorter aliases the
// frontend sends, then normalise to the canonical model names.
const rawConfigSchema = z.object({
  isShortStayEnabled: z.boolean().optional(),
  shortStayEnabled: z.boolean().optional(),
  visitorApprovalRequired: z.boolean().optional(),
  gateAccessRequired: z.boolean().optional(),
  maintenanceSla: z.string().optional(),
  customOnboardingFields: z.record(z.string(), z.unknown()).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

const configSchema = rawConfigSchema.transform((v) => ({
  isShortStayEnabled: v.isShortStayEnabled ?? v.shortStayEnabled ?? false,
  visitorApprovalRequired: v.visitorApprovalRequired ?? false,
  gateAccessRequired: v.gateAccessRequired ?? false,
  maintenanceSla: v.maintenanceSla,
  customOnboardingFields: v.customOnboardingFields ?? v.customFields,
}));

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

// Alias: the frontend issues PATCH for partial saves; reuse the same upsert handler.
export const PATCH = PUT;
