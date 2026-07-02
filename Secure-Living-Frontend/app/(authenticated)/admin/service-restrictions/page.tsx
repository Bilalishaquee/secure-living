"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ShieldBan } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

type Restriction = {
  id: string;
  organizationId: string | null;
  userId: string | null;
  serviceType: string;
  mode: "ALLOWED" | "BLOCKED";
  reason: string | null;
  createdAt: string;
};

const emptyForm = { organizationId: "", userId: "", serviceType: "", mode: "BLOCKED" as "ALLOWED" | "BLOCKED", reason: "" };

export default function ServiceRestrictionsAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Restriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/service-access-restrictions`, {
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        const j = await res.json();
        setRows(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/service-access-restrictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({
          organizationId: form.organizationId || undefined,
          userId: form.userId || undefined,
          serviceType: form.serviceType,
          mode: form.mode,
          reason: form.reason || undefined,
        }),
      });
      if (res.ok) {
        toast("Restriction saved", "success");
        setModalOpen(false);
        setForm(emptyForm);
        load();
      } else {
        const j = await res.json().catch(() => ({}));
        toast((j as { error?: string }).error ?? "Failed", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/v1/service-access-restrictions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user?.authToken}` },
    });
    if (res.ok) {
      toast("Restriction removed", "success");
      load();
    } else {
      toast("Failed to remove", "error");
    }
  }

  function scopeLabel(r: Restriction) {
    if (r.userId) return `User ${r.userId.slice(0, 8)}…`;
    if (r.organizationId) return `Org ${r.organizationId.slice(0, 8)}…`;
    return "Platform-wide";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Restrictions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Restrict which service types a user, organization, or the whole platform may offer or access.
            Most specific scope wins (user &gt; organization &gt; platform-wide).
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Restriction
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Scope</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Service Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{scopeLabel(r)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.serviceType}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.mode === "BLOCKED" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {r.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-500">{r.reason ?? "—"}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => handleDelete(r.id)} className="text-slate-400 hover:text-red-500" title="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      <ShieldBan className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      No restrictions configured — all service types are open to everyone
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Modal open={modalOpen} onOpenChange={setModalOpen} title="Add Service Restriction">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Service Type *</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="e.g. LEGAL, CLEANING, MAINTENANCE"
              value={form.serviceType}
              onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value.toUpperCase() }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Organization ID (optional)</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              placeholder="Leave blank for platform-wide"
              value={form.organizationId}
              onChange={(e) => setForm((f) => ({ ...f, organizationId: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">User ID (optional)</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              placeholder="Most specific — overrides org/platform scope"
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mode</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.mode}
              onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as "ALLOWED" | "BLOCKED" }))}
            >
              <option value="BLOCKED">Blocked</option>
              <option value="ALLOWED">Allowed (override a broader block)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.serviceType || saving} className="flex-1">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
