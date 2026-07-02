import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

const uploadRoot = path.join(process.cwd(), "uploads", "application-documents");

type Ctx = { params: { filename: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const safeName = path.basename(params.filename);
  if (safeName !== params.filename) return jsonError(400, "Invalid file name");

  const fileUrl = `/api/v1/applications/documents/${safeName}`;
  const value = await prisma.applicationCustomFieldValue.findFirst({
    where: { fileUrl },
    include: { application: { include: { listing: true } } },
  });
  if (!value) return jsonError(404, "File not found");

  const isApplicant = value.application.applicantId === actor.userId;
  const isOrgStaff = actor.permissions.includes("*") || actor.orgIds.includes(value.application.listing.organizationId);
  if (!isApplicant && !isOrgStaff) return jsonError(403, "Forbidden");

  try {
    const bytes = await readFile(path.join(uploadRoot, safeName));
    const lower = safeName.toLowerCase();
    const contentType = lower.endsWith(".pdf")
      ? "application/pdf"
      : lower.endsWith(".png")
        ? "image/png"
        : lower.endsWith(".jpg") || lower.endsWith(".jpeg")
          ? "image/jpeg"
          : "application/octet-stream";
    return new Response(bytes, {
      headers: { "content-type": contentType, "content-disposition": `inline; filename="${safeName}"` },
    });
  } catch {
    return jsonError(404, "File not found");
  }
});
