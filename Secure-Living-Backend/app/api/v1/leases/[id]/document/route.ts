import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";

const uploadRoot = path.join(process.cwd(), "uploads", "lease-documents");

type Ctx = { params: { id: string } };

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:edit");
  if (denied) return denied;

  const lease = await prisma.lease.findUnique({ where: { id: params.id } });
  if (!lease) return jsonError(404, "Lease not found");
  const scoped = requireScope(actor, lease.organizationId, lease.branchId);
  if (scoped) return scoped;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError(400, "file is required");
  if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
    return jsonError(400, "Only PDF or image files are accepted for lease documents");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  await mkdir(uploadRoot, { recursive: true });
  const id = randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const savedPath = path.join(uploadRoot, `${id}-${safeName}`);
  await writeFile(savedPath, bytes);

  const updated = await prisma.lease.update({
    where: { id: params.id },
    data: {
      documentUrl: `/api/v1/leases/${params.id}/document/${id}-${safeName}`,
      documentFileName: file.name,
      documentUploadedAt: new Date(),
    },
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "LEASE_DOCUMENT_UPLOADED",
    resourceType: "Lease",
    resourceId: lease.id,
    orgId: lease.organizationId,
    branchId: lease.branchId,
    afterJson: { documentFileName: file.name },
  });

  return Response.json({ data: updated }, { status: 201 });
});
