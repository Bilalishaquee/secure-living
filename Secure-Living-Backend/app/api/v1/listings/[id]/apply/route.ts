import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, withErrorHandler, jsonError } from "@/lib/server/http";
import { actorFromAuthorizationHeader } from "@/lib/server/authz";
import { missingRequiredFields } from "@/lib/server/application-requirements";

type Ctx = { params: { id: string } };

const applySchema = z.object({ message: z.string().optional() });

const uploadRoot = path.join(process.cwd(), "uploads", "application-documents");

// Update-2.md: "the tenants submit the requirements and the form (optionally)" — a
// landlord's ApplicationCustomField list mixes required-document uploads (employment
// letter, business permit, 6-month M-Pesa statement, letter of good conduct) with a
// personal-info form (text/number/date/dropdown/checkbox fields). Submitted as
// multipart/form-data: `message` (text), `values` (JSON array of {fieldId, value} for
// non-upload fields), and one file part per upload field named `file_<fieldId>`.
export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return jsonError(404, "Listing not found");
  if (listing.status !== "PUBLISHED") return jsonError(400, "Listing is not published");

  const actor = actorFromAuthorizationHeader(req.headers.get("authorization"));
  const applicantId = actor?.userId ?? "anonymous";

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    // Backward-compatible simple path: message only, no document requirements checked.
    const parsed = await parseBody(req, applySchema);
    if (!parsed.ok) return parsed.response;
    const application = await prisma.rentalApplication.create({
      data: { listingId: params.id, applicantId, message: parsed.data.message, status: "PENDING" },
    });
    return Response.json({ data: application }, { status: 201 });
  }

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

  const requiredFields = await prisma.applicationCustomField.findMany({
    where: { organizationId: listing.organizationId, isActive: true, isRequired: true },
  });

  const valueByField = new Map(values.map((v) => [v.fieldId, v.value]));
  const missing = missingRequiredFields(requiredFields, {
    hasFile: (fieldId) => form.get(`file_${fieldId}`) instanceof File,
    valueFor: (fieldId) => valueByField.get(fieldId),
  });
  if (missing.length > 0) {
    return jsonError(400, `Missing required fields: ${missing.join(", ")}`);
  }

  const application = await prisma.rentalApplication.create({
    data: {
      listingId: params.id,
      applicantId,
      message: typeof message === "string" ? message : undefined,
      status: "PENDING",
    },
  });

  const allFields = await prisma.applicationCustomField.findMany({
    where: { organizationId: listing.organizationId, isActive: true },
  });

  for (const field of allFields) {
    if (field.fieldType === "upload") {
      const file = form.get(`file_${field.id}`);
      if (!(file instanceof File)) continue;
      const bytes = Buffer.from(await file.arrayBuffer());
      await mkdir(uploadRoot, { recursive: true });
      const id = randomUUID();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      await writeFile(path.join(uploadRoot, `${id}-${safeName}`), bytes);
      await prisma.applicationCustomFieldValue.create({
        data: {
          applicationId: application.id,
          fieldId: field.id,
          fileUrl: `/api/v1/applications/documents/${id}-${safeName}`,
        },
      });
    } else {
      const value = valueByField.get(field.id);
      if (value === undefined) continue;
      await prisma.applicationCustomFieldValue.create({
        data: { applicationId: application.id, fieldId: field.id, value },
      });
    }
  }

  return Response.json({ data: application }, { status: 201 });
});
