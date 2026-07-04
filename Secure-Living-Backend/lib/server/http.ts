import { z } from "zod";
import { actorFromAuthorizationHeader, canAccessBranch, canAccessOrg, hasPermission, type ApiActor } from "@/lib/server/authz";

export function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (req: Request, ctx?: any) => Promise<Response>;

function logError(method: string, pathname: string, err: Error) {
  const ts = new Date().toISOString();
  console.error(`[${ts}] ${method} ${pathname} → ${err.message}`);
  if (process.env.NODE_ENV !== "production") console.error(err.stack);
}

function isDatabaseConnectivityError(err: Error) {
  return (
    err.name === "PrismaClientInitializationError" ||
    err.message.includes("Can't reach database server") ||
    err.message.includes("Timed out fetching a new connection")
  );
}

export function withErrorHandler(fn: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      logError(req.method, new URL(req.url).pathname, err);
      if (isDatabaseConnectivityError(err)) {
        return Response.json(
          {
            error: "Database unavailable",
            detail: "The API cannot reach the configured database. Check DATABASE_URL, database status, VPN/firewall, or use a reachable local Postgres database.",
          },
          { status: 503 }
        );
      }
      return Response.json(
        {
          error: "Internal server error",
          ...(process.env.NODE_ENV !== "production" && { detail: err.message }),
        },
        { status: 500 }
      );
    }
  };
}

export function requireActor(req: Request): ApiActor | Response {
  const actor = actorFromAuthorizationHeader(req.headers.get("authorization"));
  if (!actor) return jsonError(401, "Unauthorized");
  return actor;
}

export function requirePermission(actor: ApiActor, permission: string): Response | null {
  if (!hasPermission(actor, permission)) return jsonError(403, "Forbidden");
  return null;
}

export function requireScope(actor: ApiActor, orgId: string, branchId: string): Response | null {
  if (!canAccessOrg(actor, orgId) || !canAccessBranch(actor, branchId)) {
    return jsonError(403, "Out of scope");
  }
  return null;
}

export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: Response }> {
  try {
    const raw = await req.json();
    const data = schema.parse(raw);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, response: jsonError(400, e.issues[0]?.message ?? "Invalid body") };
    }
    return { ok: false, response: jsonError(400, "Invalid JSON") };
  }
}
