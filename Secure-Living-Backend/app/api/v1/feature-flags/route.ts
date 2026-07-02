import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";

// Authenticated (any role) — the UI needs to read flags to decide what to render/hide.
// Resolves org-scoped overrides on top of the global defaults.
export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const orgId = actor.orgIds?.[0] ?? null;
  const [globalFlags, orgFlags] = await Promise.all([
    prisma.featureFlag.findMany({ where: { scope: "GLOBAL" } }),
    orgId ? prisma.featureFlag.findMany({ where: { scope: "ORGANIZATION", organizationId: orgId } }) : Promise.resolve([]),
  ]);

  const resolved = new Map(globalFlags.map((f) => [f.key, f]));
  for (const f of orgFlags) resolved.set(f.key, f);

  return Response.json({ data: Array.from(resolved.values()) });
});

const createSchema = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  scope: z.enum(["GLOBAL", "ORGANIZATION"]).default("GLOBAL"),
  organizationId: z.string().optional(),
  isEnabled: z.boolean().default(true),
});

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "platform:feature-flags:manage");
  if (denied) return denied;

  const parsed = await parseBody(req, createSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (body.scope === "ORGANIZATION" && !body.organizationId) {
    return Response.json({ error: "organizationId is required for ORGANIZATION-scoped flags" }, { status: 422 });
  }

  const orgId = body.scope === "GLOBAL" ? null : body.organizationId!;
  const existing = await prisma.featureFlag.findFirst({ where: { key: body.key, organizationId: orgId } });

  const row = existing
    ? await prisma.featureFlag.update({
        where: { id: existing.id },
        data: { label: body.label, description: body.description ?? null, isEnabled: body.isEnabled },
      })
    : await prisma.featureFlag.create({
        data: {
          id: randomUUID(),
          key: body.key,
          label: body.label,
          description: body.description ?? null,
          scope: body.scope,
          organizationId: orgId,
          isEnabled: body.isEnabled,
        },
      });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: existing ? "feature_flag.updated" : "feature_flag.created",
    resourceType: "FeatureFlag",
    resourceId: row.id,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: existing ? 200 : 201 });
});
