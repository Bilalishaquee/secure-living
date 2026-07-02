import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

// Built-in application-form presets — mirrors the checklist-templates preset pattern
// (see app/api/v1/checklist-templates/presets/route.ts). Applying a preset seeds a
// starter set of ApplicationCustomField rows for the org; they remain fully editable
// afterwards (add/remove/reorder), same as a checklist template.
const PRESETS: Record<
  string,
  { name: string; description: string; fields: { fieldLabel: string; fieldType: string; fieldOptions?: string[]; isRequired?: boolean }[] }
> = {
  standard_residential: {
    name: "Standard Residential",
    description: "General residential rental application fields",
    fields: [
      { fieldLabel: "Current Employer", fieldType: "text", isRequired: true },
      { fieldLabel: "Monthly Income (KES)", fieldType: "number", isRequired: true },
      { fieldLabel: "Number of Occupants", fieldType: "number", isRequired: true },
      { fieldLabel: "Do you have pets?", fieldType: "checkbox" },
      { fieldLabel: "National ID / Passport Copy", fieldType: "upload", isRequired: true },
      { fieldLabel: "Preferred Move-In Date", fieldType: "date", isRequired: true },
    ],
  },
  furnished_short_term: {
    name: "Furnished Short-Term",
    description: "Fields tailored to furnished, short-term lets",
    fields: [
      { fieldLabel: "Purpose of Stay", fieldType: "dropdown", fieldOptions: ["Work relocation", "Tourism", "Medical", "Other"], isRequired: true },
      { fieldLabel: "Intended Length of Stay", fieldType: "dropdown", fieldOptions: ["1-3 months", "3-6 months", "6-12 months"], isRequired: true },
      { fieldLabel: "Employer / Sponsor Letter", fieldType: "upload" },
      { fieldLabel: "Emergency Contact", fieldType: "text", isRequired: true },
    ],
  },
  commercial: {
    name: "Commercial",
    description: "Fields for commercial / office space applications",
    fields: [
      { fieldLabel: "Business Name", fieldType: "text", isRequired: true },
      { fieldLabel: "Business Registration Certificate", fieldType: "upload", isRequired: true },
      { fieldLabel: "KRA PIN Certificate", fieldType: "upload", isRequired: true },
      { fieldLabel: "Years in Operation", fieldType: "number" },
      { fieldLabel: "Intended Use of Premises", fieldType: "text", isRequired: true },
    ],
  },
};

const applySchema = z.object({ preset: z.string(), organizationId: z.string().min(1).optional() });

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const data = Object.entries(PRESETS).map(([key, p]) => ({
    key,
    name: p.name,
    description: p.description,
    fieldCount: p.fields.length,
  }));
  return Response.json({ data });
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const parsed = await parseBody(req, applySchema);
  if (!parsed.ok) return parsed.response;

  const preset = PRESETS[parsed.data.preset];
  if (!preset) return jsonError(400, "Unknown preset");

  const organizationId = parsed.data.organizationId || actor.orgIds?.[0];
  if (!organizationId) return jsonError(400, "No organization");

  const existing = await prisma.applicationCustomField.findMany({ where: { organizationId, isActive: true } });
  const startOrder = existing.length;

  await prisma.applicationCustomField.createMany({
    data: preset.fields.map((f, idx) => ({
      id: randomUUID(),
      organizationId,
      fieldLabel: f.fieldLabel,
      fieldType: f.fieldType,
      fieldOptions: f.fieldOptions ?? [],
      isRequired: f.isRequired ?? false,
      displayOrder: startOrder + idx,
    })),
  });

  const rows = await prisma.applicationCustomField.findMany({
    where: { organizationId, isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return Response.json({ data: rows }, { status: 201 });
});
