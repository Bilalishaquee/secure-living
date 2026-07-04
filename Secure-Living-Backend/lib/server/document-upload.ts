import { randomUUID } from "crypto";

export const MAX_DOCUMENT_BYTES = 12 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export type PreparedDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  fileBytes: Buffer;
  fileSizeBytes: number;
  storagePath: string;
};

function extensionOf(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? "";
}

function safeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function prepareUploadedDocument(file: File): Promise<
  | { ok: true; data: PreparedDocument }
  | { ok: false; status: number; message: string }
> {
  const fileName = file.name || "document";
  const extension = extensionOf(fileName);
  const mimeType = file.type || "application/octet-stream";

  if (!ALLOWED_MIME_TYPES.has(mimeType) && !ALLOWED_EXTENSIONS.has(extension)) {
    return {
      ok: false,
      status: 400,
      message: "Unsupported document type. Upload PDF, Word document, JPG, PNG, WEBP, or GIF.",
    };
  }

  const fileBytes = Buffer.from(await file.arrayBuffer());
  if (fileBytes.byteLength === 0) {
    return { ok: false, status: 400, message: "Uploaded document is empty" };
  }
  if (fileBytes.byteLength > MAX_DOCUMENT_BYTES) {
    return { ok: false, status: 413, message: "Document must be 12MB or smaller" };
  }

  const id = randomUUID();
  return {
    ok: true,
    data: {
      id,
      fileName,
      mimeType,
      fileBytes,
      fileSizeBytes: fileBytes.byteLength,
      storagePath: `db://kyc/${id}/${safeFileName(fileName)}`,
    },
  };
}
