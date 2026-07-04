import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/server/db";
import { jsonError, requireActor, withErrorHandler } from "@/lib/server/http";

type Ctx = { params: { id: string } };

function contentDisposition(fileName: string): string {
  const safeName = fileName.replace(/["\r\n]/g, "_");
  return `inline; filename="${safeName}"`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function candidatePaths(filePath: string): string[] {
  if (path.isAbsolute(filePath)) return [filePath];
  return [
    path.join(process.cwd(), filePath),
    path.join(process.cwd(), "uploads", filePath),
    path.join(process.cwd(), "uploads", "kyc", filePath.replace(/^kyc[\\/]/, "")),
  ];
}

export const GET = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const doc = await prisma.kycDocument.findUnique({ where: { id: params.id } });
  if (!doc) return jsonError(404, "Document not found");

  const canReview = actor.permissions.includes("*") || actor.permissions.includes("kyc:review");
  const ownsDocument = doc.userId === actor.userId;
  const inOrganization = !!doc.organizationId && actor.orgIds.includes(doc.organizationId);
  if (!canReview && !ownsDocument && !inOrganization) return jsonError(403, "Forbidden");

  let bytes: Buffer | null = doc.fileBytes ? Buffer.from(doc.fileBytes) : null;
  if (!bytes) {
    for (const filePath of candidatePaths(doc.filePath)) {
      try {
        bytes = await readFile(filePath);
        break;
      } catch {
        // Try the next known storage path shape. Older demo rows used relative paths.
      }
    }
  }

  if (!bytes) {
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(doc.documentType)} - ${escapeHtml(doc.fileName)}</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;margin:0;background:#f8fafc;color:#0f172a}
    main{max-width:760px;margin:48px auto;padding:32px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 20px 50px rgba(15,23,42,.08)}
    h1{font-size:24px;margin:0 0 8px}
    p{line-height:1.6;color:#475569}
    dl{display:grid;grid-template-columns:160px 1fr;gap:12px;margin-top:24px}
    dt{font-weight:700;color:#334155}
    dd{margin:0;color:#0f172a;word-break:break-word}
    .notice{margin-top:24px;padding:14px 16px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412}
  </style>
</head>
<body>
  <main>
    <h1>KYC Document Preview</h1>
    <p>This document record is available for review, but the original uploaded file is not present on this server storage.</p>
    <dl>
      <dt>Document type</dt><dd>${escapeHtml(doc.documentType)}</dd>
      <dt>File name</dt><dd>${escapeHtml(doc.fileName)}</dd>
      <dt>Status</dt><dd>${escapeHtml(doc.status)}</dd>
      <dt>Uploaded</dt><dd>${doc.uploadedAt.toISOString()}</dd>
    </dl>
    <div class="notice">For live uploads, the original file opens here. This seeded/demo row needs its source file restored to storage.</div>
  </main>
</body>
</html>`;
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, max-age=60",
      },
    });
  }

  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  return new Response(body, {
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Disposition": contentDisposition(doc.fileName),
      "Cache-Control": "private, max-age=60",
    },
  });
});
