"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Clock, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

type Invitation = {
  id: string;
  inviteeEmail: string;
  roleSlug: string;
  status: string;
  propertyIdsCsv: string | null;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  caretaker: "Caretaker",
  property_manager: "Property Manager",
  accountant: "Accountant",
  full_delegate: "Full Delegate",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  caretaker: "Log maintenance, view occupancy, handle tenant requests. No financial access.",
  property_manager: "Add/remove units, request repairs, view lease details. Partial financial view.",
  accountant: "View all financial reports and statements. Cannot approve payments.",
  full_delegate: "Almost full access — approve payments up to configurable limits.",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-amber-500" />,
  accepted: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  revoked: <XCircle className="h-4 w-4 text-slate-400" />,
  expired: <XCircle className="h-4 w-4 text-red-400" />,
};


type InviteForm = {
  inviteeEmail: string;
  roleSlug: string;
  propertyIdsCsv: string;
};

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState<InviteForm>({ inviteeEmail: "", roleSlug: "caretaker", propertyIdsCsv: "" });
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/team?organizationId=${user.organizationId ?? ""}`, {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: Invitation[] };
        setInvitations(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.authToken, user?.organizationId]);

  useEffect(() => { void load(); }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.authToken || !form.inviteeEmail) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.authToken}`,
        },
        body: JSON.stringify({
          organizationId: user.organizationId,
          branchId: user.branchId,
          inviteeEmail: form.inviteeEmail.trim().toLowerCase(),
          roleSlug: form.roleSlug,
          propertyIdsCsv: form.propertyIdsCsv || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast(err.error ?? "Failed to send invitation", "error");
        return;
      }
      toast(`Invitation sent to ${form.inviteeEmail}`, "success");
      setShowInvite(false);
      setForm({ inviteeEmail: "", roleSlug: "caretaker", propertyIdsCsv: "" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(id: string, email: string) {
    if (!user?.authToken) return;
    setRevoking(id);
    try {
      const res = await fetch(`/api/v1/team/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (!res.ok) {
        toast("Failed to revoke invitation", "error");
        return;
      }
      toast(`Invitation to ${email} revoked`, "success");
      await load();
    } finally {
      setRevoking(null);
    }
  }

  function isExpired(inv: Invitation): boolean {
    return inv.status === "pending" && new Date(inv.expiresAt) < new Date();
  }

  const pending = invitations.filter((i) => i.status === "pending" && !isExpired(i));
  const accepted = invitations.filter((i) => i.status === "accepted");
  const revoked = invitations.filter((i) => i.status === "revoked" || isExpired(i));

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Team Management</h1>
          <p className="app-page-lead">
            Invite caretakers, property managers, and accountants to help manage your portfolio.
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Invite Team Member
        </Button>
      </div>

      {/* Role guide */}
      <Card>
        <CardHeader>
          <CardTitle>Available Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(ROLE_LABELS).map(([slug, label]) => (
              <div key={slug} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{ROLE_DESCRIPTIONS[slug]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Members */}
      {accepted.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            Active Team Members ({accepted.length})
          </h2>
          <div className="space-y-2">
            {accepted.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                    {inv.inviteeEmail[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{inv.inviteeEmail}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{ROLE_LABELS[inv.roleSlug] ?? inv.roleSlug}</p>
                    {inv.propertyIdsCsv && (
                      <p className="text-xs text-[var(--text-muted)]">Limited to specific properties</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="success">Active</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    disabled={revoking === inv.id}
                    onClick={() => { void handleRevoke(inv.id, inv.inviteeEmail); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending Invitations */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            Pending Invitations ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  {STATUS_ICONS.pending}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{inv.inviteeEmail}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {ROLE_LABELS[inv.roleSlug] ?? inv.roleSlug} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="warning">Pending</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    disabled={revoking === inv.id}
                    onClick={() => { void handleRevoke(inv.id, inv.inviteeEmail); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && pending.length === 0 && accepted.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
          <UserPlus className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">No team members yet.</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Invite a caretaker, property manager, or accountant to collaborate.
          </p>
          <Button className="mt-4" onClick={() => setShowInvite(true)}>
            <Plus className="mr-2 h-4 w-4" /> Send First Invitation
          </Button>
        </div>
      )}

      {/* Revoked / Expired */}
      {revoked.length > 0 && (
        <details className="rounded-xl border border-surface-border bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--text-secondary)]">
            Revoked / Expired ({revoked.length})
          </summary>
          <div className="mt-3 space-y-2">
            {revoked.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm opacity-70">
                {STATUS_ICONS.revoked}
                <span>{inv.inviteeEmail}</span>
                <span className="text-[var(--text-muted)]">— {ROLE_LABELS[inv.roleSlug] ?? inv.roleSlug}</span>
                <Badge variant="neutral" className="ml-auto capitalize">{isExpired(inv) ? "Expired" : "Revoked"}</Badge>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Invite Modal */}
      <Modal
        open={showInvite}
        onOpenChange={(open) => { if (!open) { setShowInvite(false); setForm({ inviteeEmail: "", roleSlug: "caretaker", propertyIdsCsv: "" }); } }}
        title="Invite Team Member"
      >
        <form onSubmit={(e) => { void handleInvite(e); }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="email"
              value={form.inviteeEmail}
              onChange={(e) => setForm((f) => ({ ...f, inviteeEmail: e.target.value }))}
              placeholder="caretaker@example.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Role</label>
            <select
              value={form.roleSlug}
              onChange={(e) => setForm((f) => ({ ...f, roleSlug: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
            >
              {Object.entries(ROLE_LABELS).map(([slug, label]) => (
                <option key={slug} value={slug}>{label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {ROLE_DESCRIPTIONS[form.roleSlug]}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Property Restriction (optional)
            </label>
            <input
              value={form.propertyIdsCsv}
              onChange={(e) => setForm((f) => ({ ...f, propertyIdsCsv: e.target.value }))}
              placeholder="Leave blank for all properties, or paste property IDs separated by commas"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
            />
          </div>

          <div className="rounded-lg bg-sky-50 border border-sky-200 px-3 py-2 text-sm text-sky-800">
            An invitation link will be generated (expires in 7 days). The invitee accepts it and sets their password.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline"
              onClick={() => setShowInvite(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Sending…" : "Send Invitation"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
