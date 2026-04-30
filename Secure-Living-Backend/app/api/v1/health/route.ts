import { withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async () => {
  return Response.json({ ok: true, ts: Date.now() });
})
