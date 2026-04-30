"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PermissionToggle } from "@/components/ui/PermissionToggle";
import { SlideOver } from "@/components/ui/SlideOver";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

type RbacAction = "view" | "create" | "edit" | "delete" | "approve" | "release" | "manage" | "upload" | "assign" | "escalate";
type RbacModule = string;
type Matrix = Record<string, Record<string, Record<RbacAction, boolean>>>;

const rbacActions: RbacAction[] = ["view", "create", "edit", "delete", "approve", "release", "manage", "upload", "assign", "escalate"];

const roleDots: Record<string, string> = {
  Admin: "bg-brand-navy",
  Landlord: "bg-brand-blue",
  Tenant: "bg-brand-teal",
  Professional: "bg-brand-gold",
  Staff: "bg-slate-500",
  "Field Agent": "bg-slate-600",
};

const roleProfiles: Record<
  string,
  {
    scope: string;
    activeUsers: number;
    accessLevel: string;
    policy: string;
  }
> = {
  Admin: {
    scope: "Global org access",
    activeUsers: 3,
    accessLevel: "Full control",
    policy: "Can approve and release across all modules.",
  },
  Landlord: {
    scope: "Owned portfolio only",
    activeUsers: 18,
    accessLevel: "Portfolio manager",
    policy: "Can approve tenant and transaction workflows.",
  },
  Tenant: {
    scope: "Self-service profile",
    activeUsers: 1240,
    accessLevel: "Restricted",
    policy: "Read-only on most modules; KYC submission enabled.",
  },
  Professional: {
    scope: "Assigned jobs and records",
    activeUsers: 147,
    accessLevel: "Service execution",
    policy: "Can update service milestones without financial release access.",
  },
  Staff: {
    scope: "Branch operations",
    activeUsers: 42,
    accessLevel: "Operations",
    policy: "Can edit properties and tenants, no release actions.",
  },
  "Field Agent": {
    scope: "On-ground inspections",
    activeUsers: 25,
    accessLevel: "Field verification",
    policy: "Property updates and reports only; no tenant approvals.",
  },
};

export default function RbacPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matrix, setMatrix] = useState<Matrix>({});
  const [selected, setSelected] = useState("");
  const [roleMap, setRoleMap] = useState<Record<string, string>>({});
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [slideOpen, setSlideOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const roleList = Object.keys(matrix);
  const rbacModules = useMemo(
    () =>
      Array.from(
        new Set(
          allPermissions.map((p) => {
            const [mod] = p.split(":");
            return mod ?? "general";
          })
        )
      ),
    [allPermissions]
  );

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [rolesRes, permsRes] = await Promise.all([
        fetch("/api/v1/rbac/roles", { headers: { Authorization: `Bearer ${user.authToken ?? ""}` } }),
        fetch("/api/v1/rbac/permissions", { headers: { Authorization: `Bearer ${user.authToken ?? ""}` } }),
      ]);
      if (!rolesRes.ok || !permsRes.ok) return;
      const rolesJson = (await rolesRes.json()) as {
        data: { id: string; slug: string; displayName: string; permissions: string[] }[];
      };
      const permsJson = (await permsRes.json()) as { data: { code: string }[] };
      const permissionCodes = permsJson.data.map((p) => p.code).filter((p) => p !== "*");
      setAllPermissions(permissionCodes);
      const nextMatrix: Matrix = {};
      const nextRoleMap: Record<string, string> = {};
      for (const role of rolesJson.data) {
        nextRoleMap[role.displayName] = role.id;
        const moduleState: Record<string, Record<RbacAction, boolean>> = {};
        for (const code of permissionCodes) {
          const [module, actionRaw] = code.split(":");
          if (!moduleState[module]) {
            moduleState[module] = {
              view: false, create: false, edit: false, delete: false, approve: false,
              release: false, manage: false, upload: false, assign: false, escalate: false,
            };
          }
          const action = actionRaw as RbacAction;
          if (rbacActions.includes(action)) moduleState[module][action] = role.permissions.includes(code);
        }
        nextMatrix[role.displayName] = moduleState;
      }
      setRoleMap(nextRoleMap);
      setMatrix(nextMatrix);
      setSelected(Object.keys(nextMatrix)[0] ?? "");
    })();
  }, [user]);

  const perms = useMemo(() => matrix[selected] ?? {}, [matrix, selected]);
  const profile = roleProfiles[selected] ?? null;
  const enabledCount = useMemo(
    () =>
      rbacModules.reduce(
        (total, mod) =>
          total + rbacActions.reduce((acc, act) => acc + ((perms[mod]?.[act] ?? false) ? 1 : 0), 0),
        0
      ),
    [perms, rbacModules]
  );

  const setCell = useCallback(
    (mod: RbacModule, act: RbacAction, val: boolean) => {
      let updatedRoleState: Record<string, Record<RbacAction, boolean>> | null = null;
      setMatrix((m) => {
        const next = { ...m, [selected]: { ...(m[selected] ?? {}) } };
        next[selected] = {
          ...next[selected],
          [mod]: {
            view: false, create: false, edit: false, delete: false, approve: false,
            release: false, manage: false, upload: false, assign: false, escalate: false,
            ...(next[selected][mod] ?? {}),
            [act]: val,
          },
        };
        updatedRoleState = next[selected];
        return next;
      });
      const roleId = roleMap[selected];
      if (!roleId || !user) return;
      const roleModules = nextPermissions(updatedRoleState ?? {});
      void fetch(`/api/v1/rbac/roles/${roleId}/permissions`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${user.authToken ?? ""}`,
        },
        body: JSON.stringify({ permissions: roleModules }),
      });
      toast("Permission updated", "success");
    },
    [selected, toast, roleMap, user]
  );

  function nextPermissions(roleState: Record<string, Record<RbacAction, boolean>>): string[] {
    const out: string[] = [];
    for (const [module, actions] of Object.entries(roleState)) {
      for (const action of rbacActions) {
        if (actions[action]) out.push(`${module}:${action}`);
      }
    }
    return out;
  }

  const actionLabels: Record<RbacAction, string> = useMemo(
    () => ({
      view: "View",
      create: "Create",
      edit: "Edit",
      delete: "Delete",
      approve: "Approve",
      release: "Release",
      manage: "Manage",
      upload: "Upload",
      assign: "Assign",
      escalate: "Escalate",
    }),
    []
  );

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Role-based access</h1>
          <p className="app-page-lead">Toggle permissions and persist them to RBAC APIs.</p>
        </div>
        <Button type="button" className="shrink-0" onClick={() => setSlideOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <SlideOver
        open={slideOpen}
        onOpenChange={setSlideOpen}
        title="Create custom role"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Name your role and persist it with access rules from existing templates.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor="new-role" className="text-sm font-medium text-[var(--text-primary)]">
            Role name
          </label>
          <input
            id="new-role"
            className="w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            placeholder="e.g. Portfolio Analyst"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            onClick={() => {
              if (!newRoleName.trim()) {
                toast("Enter a role name", "error");
                return;
              }
              if (!user) return;
              const slug = newRoleName.trim().toLowerCase().replace(/\s+/g, "_");
              void fetch("/api/v1/rbac/roles", {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  Authorization: `Bearer ${user.authToken ?? ""}`,
                },
                body: JSON.stringify({ slug, displayName: newRoleName.trim() }),
              }).then(async (r) => {
                if (!r.ok) return;
                const json = (await r.json()) as { data: { id: string; displayName: string } };
                setMatrix((m) => ({
                  ...m,
                  [json.data.displayName]: {},
                }));
                setRoleMap((s) => ({ ...s, [json.data.displayName]: json.data.id }));
                setSelected(json.data.displayName);
              });
              toast(`Role "${newRoleName.trim()}" created`, "success");
              setNewRoleName("");
              setSlideOpen(false);
            }}
          >
            Create role
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => {
              setSlideOpen(false);
              setNewRoleName("");
            }}
          >
            Cancel
          </Button>
        </div>
      </SlideOver>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="app-glass-panel p-3">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Roles
          </p>
          <ul className="space-y-1">
            {roleList.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  onClick={() => setSelected(r)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue",
                    selected === r
                      ? "bg-gradient-to-r from-sky-100/90 to-escrow text-brand-navy shadow-sm ring-1 ring-brand-blue/15"
                      : "hover:bg-slate-100/80"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      roleDots[r] ?? "bg-slate-400"
                    )}
                    aria-hidden
                  />
                  {r}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-4">
          <section className="app-glass-panel grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-white/60 bg-slate-50/80 p-3 shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Scope
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {profile?.scope ?? "Custom scope"}
              </p>
            </div>
            <div className="rounded-lg border border-white/60 bg-slate-50/80 p-3 shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Active users
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {(profile?.activeUsers ?? 0).toLocaleString("en-KE")}
              </p>
            </div>
            <div className="rounded-lg border border-white/60 bg-slate-50/80 p-3 shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Access level
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {profile?.accessLevel ?? "Custom"}
              </p>
            </div>
            <div className="rounded-lg border border-white/60 bg-slate-50/80 p-3 shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Enabled permissions
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {enabledCount} / {rbacModules.length * rbacActions.length}
              </p>
            </div>
            <p className="sm:col-span-2 lg:col-span-4 text-xs text-[var(--text-secondary)]">
              {profile?.policy ?? "Custom role policy not configured yet."}
            </p>
          </section>

          <div className="app-glass-panel app-touch-x-scroll overflow-x-auto p-0">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50/95 to-sky-50/30 text-left">
                <th className="sticky left-0 z-10 bg-slate-50/95 px-4 py-3 font-semibold text-brand-navy backdrop-blur-sm">
                  Module
                </th>
                {rbacActions.map((a) => (
                  <th key={a} className="px-2 py-3 text-center font-medium text-[var(--text-secondary)]">
                    {actionLabels[a]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rbacModules.map((mod) => (
                <tr key={mod} className="border-b border-slate-200/50 transition-colors hover:bg-sky-50/40">
                  <td className="sticky left-0 z-10 bg-white/90 px-4 py-3 font-medium backdrop-blur-sm">
                    {mod}
                  </td>
                  {rbacActions.map((act) => (
                    <td key={act} className="px-2 py-2 text-center">
                      <PermissionToggle
                        id={`${selected}-${mod}-${act}`}
                        label={`${selected} ${mod} ${act}`}
                        checked={perms[mod]?.[act] ?? false}
                        onCheckedChange={(v) => setCell(mod, act, v)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      <section className="app-glass-panel p-6">
        <h2 className="font-display text-lg font-semibold text-brand-navy">Scope rules</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Roles can be limited to specific organizations and branches before users inherit
          effective permissions.
        </p>
        <div className="app-touch-x-scroll mt-6 overflow-x-auto font-mono-data text-xs text-[var(--text-primary)]">
          <pre className="rounded-lg border border-slate-200/60 bg-slate-50/70 p-4 leading-relaxed backdrop-blur-sm">
{`Secure Living Systems (org)
├── Main (branch)
│   └── Admin users — full matrix
Mwakaba Properties (org)
├── Nairobi HQ (branch)
│   └── Landlord + Staff — scoped properties
└── Coastal Office (branch)
    └── Staff — Mombasa portfolio only`}
          </pre>
        </div>
      </section>
    </div>
  );
}
