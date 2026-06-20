"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, CheckCircle2, Calculator } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const CONDITION_OPTIONS = ["New", "Excellent", "Good", "Fair", "Poor", "Damaged", "Missing", "Not Applicable"];
const RESPONSIBILITY_OPTIONS = ["TENANT", "LANDLORD", "WEAR_TEAR", "CONTRACTOR", "UNKNOWN"];
const ACTION_OPTIONS = ["REPAIR", "REPLACE", "MONITOR", "NO_ACTION"];
const EVIDENCE_OPTIONS = ["STRONG", "MEDIUM", "WEAK"];

// Condition Difference Engine — mirrors the backend ranking for a live preview.
const RANK: Record<string, number> = {
  New: 5, Excellent: 4, Good: 3, Fair: 2, Poor: 1, Damaged: 0, Missing: -1, "Not Applicable": 99,
};
function flagFor(statusIn: string, statusOut: string): "NO_ACTION" | "REVIEW_REQUIRED" | "POTENTIAL_DEDUCTION" {
  if (statusOut === "Missing" || statusOut === "Damaged") return "POTENTIAL_DEDUCTION";
  if (!statusIn || !statusOut) return "NO_ACTION";
  const a = RANK[statusIn] ?? 3, b = RANK[statusOut] ?? 3;
  if (a === 99 || b === 99) return "NO_ACTION";
  if (b < a - 1) return "POTENTIAL_DEDUCTION";
  if (b < a) return "REVIEW_REQUIRED";
  return "NO_ACTION";
}

type TemplateItem = {
  id: string;
  section: string;
  item: string;
  defaultQty?: number;
  order: number;
  isUtilityMeter?: boolean;
};
type Entry = {
  itemId: string;
  statusIn: string | null;
  statusOut: string | null;
  qty: number | null;
  chargeKes: number | null;
  replacementCostKes: number | null;
  followUpDate: string | null;
  evidenceScore: string | null;
  responsibility: string | null;
  actionRequired: string | null;
  note: string | null;
  photoInUrl: string | null;
  photoOutUrl: string | null;
};
type TenantChecklist = {
  id: string;
  type: string;
  status: string;
  signedAt: string | null;
  createdAt: string;
  template: { id: string; name: string; category: string | null; items: TemplateItem[] };
  entries: Entry[];
};
type RowState = {
  statusIn: string;
  statusOut: string;
  qty: number;
  charge: string;
  replacementCost: string;
  followUpDate: string;
  evidenceScore: string;
  responsibility: string;
  actionRequired: string;
  note: string;
  photoInUrl: string;
  photoOutUrl: string;
};
type Reconciliation = {
  depositAmount: number; totalCharges: number; totalDeductions: number; refundAmount: number; flaggedCount: number;
};

const fmtKes = (n: number) => `KES ${n.toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;
const FLAG_BADGE: Record<string, string> = {
  POTENTIAL_DEDUCTION: "bg-red-100 text-red-700",
  REVIEW_REQUIRED: "bg-amber-100 text-amber-700",
  NO_ACTION: "bg-slate-100 text-slate-500",
};

export default function TenantChecklistPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checklists, setChecklists] = useState<TenantChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TenantChecklist | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [recon, setRecon] = useState<Reconciliation | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/tenant-checklists`, { headers: { Authorization: `Bearer ${user?.authToken}` } });
      if (res.ok) {
        const j = await res.json();
        setChecklists(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadChecklist(id: string) {
    const res = await fetch(`/api/v1/tenant-checklists/${id}`, { headers: { Authorization: `Bearer ${user?.authToken}` } });
    if (res.ok) {
      const j = await res.json();
      const cl = j.data as TenantChecklist;
      setSelected(cl);
      setRecon(null);
      const byItem = new Map(cl.entries.map((e) => [e.itemId, e]));
      const init: Record<string, RowState> = {};
      cl.template.items.forEach((it) => {
        const e = byItem.get(it.id);
        init[it.id] = {
          statusIn: e?.statusIn ?? "",
          statusOut: e?.statusOut ?? "",
          qty: e?.qty ?? it.defaultQty ?? 1,
          charge: e?.chargeKes != null ? String(e.chargeKes) : "",
          replacementCost: e?.replacementCostKes != null ? String(e.replacementCostKes) : "",
          followUpDate: e?.followUpDate ? new Date(e.followUpDate).toISOString().slice(0, 10) : "",
          evidenceScore: e?.evidenceScore ?? "",
          responsibility: e?.responsibility ?? "",
          actionRequired: e?.actionRequired ?? "",
          note: e?.note ?? "",
          photoInUrl: e?.photoInUrl ?? "",
          photoOutUrl: e?.photoOutUrl ?? "",
        };
      });
      setRows(init);
    }
  }

  useEffect(() => { if (user?.authToken) load(); /* eslint-disable-next-line */ }, [user?.authToken]);

  function setRow(itemId: string, field: keyof RowState, value: string | number) {
    setRows((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
  }

  function buildPayload() {
    if (!selected) return [];
    return selected.template.items.map((it) => {
      const r = rows[it.id] ?? { statusIn: "", statusOut: "", qty: 1, charge: "", replacementCost: "", followUpDate: "", evidenceScore: "", responsibility: "", actionRequired: "", note: "", photoInUrl: "", photoOutUrl: "" };
      return {
        itemId: it.id,
        statusIn: r.statusIn || null,
        statusOut: r.statusOut || null,
        qty: r.qty || null,
        chargeKes: r.charge ? parseFloat(r.charge) : null,
        replacementCostKes: r.replacementCost ? parseFloat(r.replacementCost) : null,
        followUpDate: r.followUpDate ? new Date(r.followUpDate).toISOString() : null,
        evidenceScore: r.evidenceScore || null,
        responsibility: r.responsibility || null,
        actionRequired: r.actionRequired || null,
        note: r.note || null,
        photoInUrl: r.photoInUrl || null,
        photoOutUrl: r.photoOutUrl || null,
      };
    });
  }

  async function handleSave(silent = false): Promise<boolean> {
    if (!selected) return false;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/tenant-checklists/${selected.id}/entries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({ entries: buildPayload() }),
      });
      if (res.ok) {
        if (!silent) toast("Checklist saved", "success");
        return true;
      }
      const j = await res.json().catch(() => ({}));
      toast(j.error ?? "Failed", "error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function loadReconciliation() {
    if (!selected) return;
    const ok = await handleSave(true);
    if (!ok) return;
    const res = await fetch(`/api/v1/tenant-checklists/${selected.id}/reconciliation`, {
      headers: { Authorization: `Bearer ${user?.authToken}` },
    });
    if (res.ok) {
      const j = await res.json();
      setRecon(j.data);
    } else {
      toast("Failed to compute reconciliation", "error");
    }
  }

  async function handleSign() {
    if (!selected) return;
    setSigning(true);
    try {
      const ok = await handleSave(true);
      if (!ok) return;
      const res = await fetch(`/api/v1/tenant-checklists/${selected.id}/sign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        toast("Checklist signed!", "success");
        setSelected(null);
        load();
      } else {
        const j = await res.json().catch(() => ({}));
        toast(j.error ?? "Failed to sign — complete all items first", "error");
      }
    } finally {
      setSigning(false);
    }
  }

  const isMoveIn = selected?.type === "MOVE_IN";
  const allFilled = selected
    ? selected.template.items.every((it) => {
        const r = rows[it.id];
        return isMoveIn ? !!r?.statusIn : !!r?.statusOut;
      })
    : false;

  const liveTotalCharges = selected
    ? selected.template.items.reduce((s, it) => s + (parseFloat(rows[it.id]?.charge || "0") || 0), 0)
    : 0;
  const liveFlagged = selected
    ? selected.template.items.filter((it) => {
        const r = rows[it.id];
        return r && !it.isUtilityMeter && flagFor(r.statusIn, r.statusOut) !== "NO_ACTION";
      }).length
    : 0;

  const isSigned = selected?.status === "SIGNED";

  if (selected) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{selected.template.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {selected.type.replace("_", "-")} inspection · {selected.status}
            </p>
          </div>
          <Button variant="ghost" onClick={() => setSelected(null)}>Back</Button>
        </div>

        {isSigned && (
          <Card>
            <CardContent className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="mb-3 h-10 w-10 text-green-500" />
              <p className="text-lg font-semibold text-slate-900">Checklist signed</p>
              <p className="mt-1 text-sm text-slate-500">Signed on {selected.signedAt ? new Date(selected.signedAt).toLocaleDateString() : "—"}</p>
            </CardContent>
          </Card>
        )}

        {/* Live engine summary */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Flagged items</p><p className="text-2xl font-bold text-slate-900">{liveFlagged}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Total charges</p><p className="text-2xl font-bold text-slate-900">{fmtKes(liveTotalCharges)}</p></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-slate-500">Deposit reconciliation</p><p className="text-sm text-slate-700">{recon ? `${fmtKes(recon.refundAmount)} refund` : "Not computed"}</p></div><Button size="sm" variant="outline" onClick={loadReconciliation} className="gap-1"><Calculator className="h-3.5 w-3.5" /> Run</Button></CardContent></Card>
        </div>

        {recon && (
          <Card>
            <CardHeader><CardTitle className="text-base">Deposit Reconciliation Report</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Deposit Held</span><span className="font-medium">{fmtKes(recon.depositAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Charges</span><span>{fmtKes(recon.totalCharges)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Tenant-Attributable Deductions</span><span className="font-medium text-red-600">− {fmtKes(recon.totalDeductions)}</span></div>
                <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-semibold"><span>Refund Due</span><span className="text-emerald-700">{fmtKes(recon.refundAmount)}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[1400px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Area / Item</th>
                  <th className="px-3 py-2 text-left w-14">Qty</th>
                  <th className="px-3 py-2 text-left w-32">Status In</th>
                  <th className="px-3 py-2 text-left w-32">Status Out</th>
                  <th className="px-3 py-2 text-left w-24">Charge (KES)</th>
                  <th className="px-3 py-2 text-left w-24">Replacement (KES)</th>
                  <th className="px-3 py-2 text-left w-32">Responsibility</th>
                  <th className="px-3 py-2 text-left w-28">Action Required</th>
                  <th className="px-3 py-2 text-left w-24">Evidence</th>
                  <th className="px-3 py-2 text-left w-28">Follow-Up</th>
                  <th className="px-3 py-2 text-left w-32">Photo In URL</th>
                  <th className="px-3 py-2 text-left w-32">Photo Out URL</th>
                  <th className="px-3 py-2 text-left">Notes</th>
                  <th className="px-3 py-2 text-left w-28">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selected.template.items.slice().sort((a, b) => a.order - b.order).map((it) => {
                  const r = rows[it.id] ?? { statusIn: "", statusOut: "", qty: 1, charge: "", replacementCost: "", followUpDate: "", evidenceScore: "", responsibility: "", actionRequired: "", note: "", photoInUrl: "", photoOutUrl: "" };
                  const isUtility = !!it.isUtilityMeter;
                  const flag = isUtility ? "NO_ACTION" : flagFor(r.statusIn, r.statusOut);
                  const meterUsage = isUtility && r.statusIn && r.statusOut
                    ? parseFloat(r.statusOut) - parseFloat(r.statusIn)
                    : null;
                  return (
                    <tr key={it.id} className={isUtility ? "bg-blue-50/40" : ""}>
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-900">{it.item}</p>
                        <p className="text-xs text-slate-400">{it.section}</p>
                        {isUtility && (
                          <p className="text-[10px] font-semibold text-blue-600 mt-0.5">METER</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={1} disabled={isSigned} className="w-12 rounded border border-slate-200 px-2 py-1" value={r.qty}
                          onChange={(e) => setRow(it.id, "qty", parseInt(e.target.value, 10) || 1)} />
                      </td>
                      <td className="px-3 py-2">
                        {isUtility ? (
                          <div>
                            <input type="number" disabled={isSigned} className="w-full rounded border border-slate-200 px-2 py-1" placeholder="Reading" value={r.statusIn}
                              onChange={(e) => setRow(it.id, "statusIn", e.target.value)} />
                            <p className="text-[10px] text-slate-400 mt-0.5">Reading In</p>
                          </div>
                        ) : (
                          <select disabled={isSigned} className="w-full rounded border border-slate-200 px-2 py-1" value={r.statusIn}
                            onChange={(e) => setRow(it.id, "statusIn", e.target.value)}>
                            <option value="">—</option>
                            {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {isUtility ? (
                          <div>
                            <input type="number" disabled={isSigned || isMoveIn} className="w-full rounded border border-slate-200 px-2 py-1 disabled:bg-slate-50" placeholder="Reading" value={r.statusOut}
                              onChange={(e) => setRow(it.id, "statusOut", e.target.value)} />
                            {meterUsage !== null && !isNaN(meterUsage) && (
                              <p className="text-[10px] text-blue-600 mt-0.5 font-medium">Usage: {meterUsage}</p>
                            )}
                          </div>
                        ) : (
                          <select disabled={isSigned || isMoveIn} className="w-full rounded border border-slate-200 px-2 py-1 disabled:bg-slate-50" value={r.statusOut}
                            onChange={(e) => setRow(it.id, "statusOut", e.target.value)}>
                            <option value="">—</option>
                            {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} disabled={isSigned} className="w-20 rounded border border-slate-200 px-2 py-1" placeholder="0" value={r.charge}
                          onChange={(e) => setRow(it.id, "charge", e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} disabled={isSigned} className="w-20 rounded border border-slate-200 px-2 py-1" placeholder="0" value={r.replacementCost}
                          onChange={(e) => setRow(it.id, "replacementCost", e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <select disabled={isSigned} className="w-full rounded border border-slate-200 px-2 py-1" value={r.responsibility}
                          onChange={(e) => setRow(it.id, "responsibility", e.target.value)}>
                          <option value="">—</option>
                          {RESPONSIBILITY_OPTIONS.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select disabled={isSigned} className="w-full rounded border border-slate-200 px-2 py-1" value={r.actionRequired}
                          onChange={(e) => setRow(it.id, "actionRequired", e.target.value)}>
                          <option value="">—</option>
                          {ACTION_OPTIONS.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select disabled={isSigned} className="w-full rounded border border-slate-200 px-2 py-1" value={r.evidenceScore}
                          onChange={(e) => setRow(it.id, "evidenceScore", e.target.value)}>
                          <option value="">—</option>
                          {EVIDENCE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="date" disabled={isSigned} className="w-full rounded border border-slate-200 px-2 py-1" value={r.followUpDate}
                          onChange={(e) => setRow(it.id, "followUpDate", e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input disabled={isSigned} className="w-full rounded border border-slate-200 px-2 py-1" placeholder="URL or ref…" value={r.photoInUrl}
                          onChange={(e) => setRow(it.id, "photoInUrl", e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input disabled={isSigned} className="w-full rounded border border-slate-200 px-2 py-1" placeholder="URL or ref…" value={r.photoOutUrl}
                          onChange={(e) => setRow(it.id, "photoOutUrl", e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input disabled={isSigned} className="w-full rounded border border-slate-200 px-2 py-1" placeholder="Damage notes…" value={r.note}
                          onChange={(e) => setRow(it.id, "note", e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        {isUtility ? (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700">METER</span>
                        ) : (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${FLAG_BADGE[flag]}`}>{flag.replace(/_/g, " ")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {!isSigned && (
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => handleSave()} disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Save Progress"}
            </Button>
            <Button onClick={handleSign} disabled={!allFilled || signing} className="flex-1"
              title={!allFilled ? "Complete a status for every item before signing" : ""}>
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
        <h1 className="text-2xl font-bold text-slate-900">My Inspection Checklists</h1>
        <p className="mt-1 text-sm text-slate-500">Move-in, move-out and inspection condition checklists for your unit</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>
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
            <Card key={cl.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => loadChecklist(cl.id)}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="font-semibold text-slate-900">{cl.template.name}</p>
                  <p className="text-sm text-slate-500">
                    {cl.type.replace("_", "-")} ·
                    {cl.status === "SIGNED" ? ` Signed ${cl.signedAt ? new Date(cl.signedAt).toLocaleDateString() : ""}` : ` ${cl.status}`}
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
