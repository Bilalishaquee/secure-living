import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler } from "@/lib/server/http";
import { missingRequiredFields } from "@/lib/server/application-requirements";
import { notify } from "@/lib/server/notify";

type Ctx = { params: { id: string } };

const uploadRoot = path.join(process.cwd(), "uploads", "application-documents");

// Rectification Process (UPDATE.md): "Application Rejected -> Correct Information ->
// Resubmit". An applicant whose application was sent back for more information
// (status REVIEWING) can correct/add the requested documents and values without
// starting a brand-new application — this flips it back to PENDING for re-review.
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const application = await prisma.rentalApplication.findUnique({
    where: { id: params.id },
    include: { listing: true },
  });
  if (!application) return jsonError(404, "Application not found");
  if (application.applicantId !== actor.userId) return jsonError(403, "You can only resubmit your own application");
  if (application.status !== "REVIEWING") {
    return jsonError(400, "This application is not awaiting more information — resubmission is only available after a 'More Information' request");
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) return jsonError(400, "Expected multipart/form-data");

  const form = await req.formData();
  const message = form.get("message");
  const valuesRaw = form.get("values");

  let values: Array<{ fieldId: string; value?: string }> = [];
  if (typeof valuesRaw === "string" && valuesRaw.trim()) {
    try {
      values = z.array(z.object({ fieldId: z.string().min(1), value: z.string().optional() })).parse(JSON.parse(valuesRaw));
    } catch {
      return jsonError(400, "Invalid values payload");
    }
  }
  const valueByField = new Map(values.map((v) => [v.fieldId, v.value]));

  const allFields = await prisma.applicationCustomField.findMany({
    where: { organizationId: application.listing.organizationId, isActive: true },
  });
  const requiredFields = allFields.filter((f) => f.isRequired);

  // A required field is satisfied if it was already on file OR is being supplied now.
  const existingValues = await prisma.applicationCustomFieldValue.findMany({ where: { applicationId: application.id } });
  const existingByField = new Map(existingValues.map((v) => [v.fieldId, v]));

  const missing = missingRequiredFields(requiredFields, {
    hasFile: (fieldId) => form.get(`file_${fieldId}`) instanceof File || !!existingByField.get(fieldId)?.fileUrl,
    valueFor: (fieldId) => valueByField.get(fieldId) ?? existingByField.get(fieldId)?.value ?? undefined,
  });
  if (missing.length > 0) {
    return jsonError(400, `Missing required fields: ${missing.join(", ")}`);
  }

  for (const field of allFields) {
    if (field.fieldType === "upload") {
      const file = form.get(`file_${field.id}`);
      if (!(file instanceof File)) continue; // keep existing document if not re-uploaded
      const bytes = Buffer.from(await file.arrayBuffer());
      await mkdir(uploadRoot, { recursive: true });
      const id = randomUUID();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      await writeFile(path.join(uploadRoot, `${id}-${safeName}`), bytes);
      await prisma.applicationCustomFieldValue.deleteMany({ where: { applicationId: application.id, fieldId: field.id } });
      await prisma.applicationCustomFieldValue.create({
        data: { applicationId: application.id, fieldId: field.id, fileUrl: `/api/v1/applications/documents/${id}-${safeName}` },
      });
    } else {
      const value = valueByField.get(field.id);
      if (value === undefined) continue; // keep existing value if not resupplied
      await prisma.applicationCustomFieldValue.deleteMany({ where: { applicationId: application.id, fieldId: field.id } });
      await prisma.applicationCustomFieldValue.create({ data: { applicationId: application.id, fieldId: field.id, value } });
    }
  }

  const updated = await prisma.rentalApplication.update({
    where: { id: application.id },
    data: {
      status: "PENDING",
      message: typeof message === "string" && message.trim() ? message : application.message,
    },
  });

  await notify({
    organizationId: application.listing.organizationId,
    roles: ["admin"],
    excludeUserId: actor.userId,
    type: "application.resubmitted",
    severity: "info",
    title: "Applicant resubmitted their application",
    message: `An applicant supplied the requested information for application ${application.id.slice(0, 8)}… — ready for re-review.`,
    resourceType: "RentalApplication",
    resourceId: application.id,
    link: `/listings/${application.listingId}`,
  });

  return Response.json({ data: updated });
});
