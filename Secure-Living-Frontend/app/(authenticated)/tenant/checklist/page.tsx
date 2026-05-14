"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";


const CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor", "Damaged", "Missing"];

type ChecklistEntry = {
  id: string;
  templateItemId: string;
  condition: string | null;
  tenantNotes: string | null;
  item: { id: string; label: string; description: string | null; sortOrder: number };
};

type TenantChecklist = {
  id: string;
  status: string;
  signedAt: string | null;
  createdAt: string;
  template: { id: string; name: string; type: string };
  entries: ChecklistEntry[];
};

export default function TenantChecklistPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checklists, setChecklists] = useState<TenantChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TenantChecklist | null>(null);
  const [entries, setEntries] = useState<Record<string, { condition: string; notes: string }>>({});
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/tenant-checklists`, {
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        const j = await res.json();
        setChecklists(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadChecklist(id: string) {
    const res = await fetch(`/api/v1/tenant-checklists/${id}`, {
      headers: { Authorization: `Bearer ${user?.authToken}` },
    });
    if (res.ok) {
      const j = await res.json();
      const cl = j.data as TenantChecklist;
      setSelected(cl);
      // Initialize entry state from existing data
      const init: Record<string, { condition: string; notes: string }> = {};
      cl.entries.forEach((e) => {
        init[e.templateItemId] = {
          condition: e.condition ?? "",
          notes: e.tenantNotes ?? "",
        };
      });
      setEntries(init);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  function setEntry(itemId: string, field: "condition" | "notes", value: string) {
    setEntries((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], condition: prev[itemId]?.condition ?? "", notes: prev[itemId]?.notes ?? "", [field]: value },
    }));
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = selected.entries.map((e) => ({
        templateItemId: e.templateItemId,
        condition: entries[e.templateItemId]?.condition || null,
        tenantNotes: entries[e.templateItemId]?.notes || null,
      }));
      const res = await fetch(`/api/v1/tenant-checklists/${selected.id}/entries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({ entries: payload }),
      });
      if (res.ok) {
        toast({ title: "Checklist saved", variant: "success" });
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSign() {
    if (!selected) return;
    setSigning(true);
    try {
      // Save first
      await handleSave();
      const res = await fetch(`/api/v1/tenant-checklists/${selected.id}/sign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        toast({ title: "Checklist signed!", variant: "success" });
        setSelected(null);
        load();
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed to sign — fill all required items first", variant: "error" });
      }
    } finally {
      setSigning(false);
    }
  }

  const allFilled = selected ? selected.entries.every((e) => !!entries[e.templateItemId]?.condition) : false;

  if (selected) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{selected.template.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {selected.template.type === "MOVE_IN" ? "Move-In" : "Move-Out"} checklist · {selected.status}
            </p>
          </div>
          <Button variant="ghost" onClick={() => setSelected(null)}>Back</Button>
        </div>

        {selected.status === "SIGNED" ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <CheckCircle2 className="mb-3 h-12 w-12 text-green-500" />
              <p className="text-lg font-semibold text-slate-900">Checklist signed</p>
              <p className="mt-1 text-sm text-slate-500">
                Signed on {selected.signedAt ? new Date(selected.signedAt).toLocaleDateString() : "—"}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="divide-y divide-slate-100">
            {selected.entries
              .sort((a, b) => a.item.sortOrder - b.item.sortOrder)
              .map((e) => {
                const val = entries[e.templateItemId] ?? { condition: "", notes: "" };
                const isFilled = !!val.condition;
                return (
                  <div key={e.id} className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{e.item.label}</p>
                        {e.item.description && <p className="text-xs text-slate-500 mt-0.5">{e.item.description}</p>}
                      </div>
                      {isFilled ? (
                        <CheckCircle2 className="ml-2 h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <AlertCircle className="ml-2 h-4 w-4 shrink-0 text-slate-300" />
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <select
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={val.condition}
                        onChange={(e) => setEntry(e.templateItemId ?? "", "condition", e.target.value)}
                        disabled={selected.status === "SIGNED"}
                      >
                        <option value="">Select condition…</option>
                        {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="Notes (optional)"
                        value={val.notes}
                        onChange={(ev) => setEntry(e.templateItemId, "notes", ev.target.value)}
                        disabled={selected.status === "SIGNED"}
                      />
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {selected.status !== "SIGNED" && (
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Save Progress"}
            </Button>
            <Button
              onClick={handleSign}
              disabled={!allFilled || signing}
              className="flex-1"
              title={!allFilled ? "Fill all conditions before signing" : ""}
            >
              {signing ? "Signing…" : "Sign Checklist"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Checklists</h1>
        <p className="mt-1 text-sm text-slate-500">Move-in and move-out condition checklists for your unit</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : checklists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ClipboardCheck className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No checklists assigned</p>
            <p className="mt-1 text-sm text-slate-500">Your property manager will assign checklists during move-in or move-out</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {checklists.map((cl) => (
            <Card
              key={cl.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => loadChecklist(cl.id)}
            >
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="font-semibold text-slate-900">{cl.template.name}</p>
                  <p className="text-sm text-slate-500">
                    {cl.template.type === "MOVE_IN" ? "Move-In" : "Move-Out"} ·
                    {cl.status === "SIGNED"
                      ? ` Signed ${cl.signedAt ? new Date(cl.signedAt).toLocaleDateString() : ""}`
                      : ` ${cl.status}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {cl.status === "SIGNED" ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Signed</span>
                  ) : (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">Pending</span>
                  )}
                  <Button size="sm" variant="ghost">Open</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
