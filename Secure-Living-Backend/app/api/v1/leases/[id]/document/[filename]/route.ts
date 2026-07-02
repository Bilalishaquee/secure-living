import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/server/db";
import { requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";

const uploadRoot = path.join(process.cwd(), "uploads", "lease-documents");

type Ctx = { params: { id: string; filename: string } };

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:view");
  if (denied) return denied;

  const lease = await prisma.lease.findUnique({ where: { id: params.id } });
  if (!lease) return jsonError(404, "Lease not found");
  const scoped = requireScope(actor, lease.organizationId, lease.branchId);
  if (scoped) return scoped;

  const safeName = path.basename(params.filename);
  if (safeName !== params.filename) return jsonError(400, "Invalid file name");

  try {
    const bytes = await readFile(path.join(uploadRoot, safeName));
    const isPdf = safeName.toLowerCase().endsWith(".pdf");
    return new Response(bytes, {
      headers: {
        "content-type": isPdf ? "application/pdf" : "application/octet-stream",
        "content-disposition": `inline; filename="${safeName}"`,
      },
    });
  } catch {
    return jsonError(404, "File not found");
  }
});
