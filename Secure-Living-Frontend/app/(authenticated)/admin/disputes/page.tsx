"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type DisputeStatus = "OPEN" | "LANDLORD_RESPONDED" | "ESCALATED" | "RESOLVED_ACCEPTED" | "RESOLVED_REJECTED" | "RESOLVED_OTHER";

type Dispute = {
  id: string;
  reason: string;
  status: DisputeStatus;
  landlordResponse: string | null;
  adminDecision: string | null;
  resolvedAt: string | null;
  createdAt: string;
  raisedByUserId: string;
  reading: {
    id: string;
    currentReading: number;
    previousReading: number;
    consumption: number;
    readingDate: string;
    meterId: string;
  };
};

const STATUS_CONFIG: Record<DisputeStatus, { label: string; color: string }> = {
  OPEN:               { label: "Open",                color: "bg-red-100 text-red-700" },
  LANDLORD_RESPONDED: { label: "Landlord Responded",  color: "bg-amber-100 text-amber-700" },
  ESCALATED:          { label: "Escalated",           color: "bg-orange-100 text-orange-700" },
  RESOLVED_ACCEPTED:  { label: "Resolved — Approved", color: "bg-emerald-100 text-emerald-700" },
  RESOLVED_REJECTED:  { label: "Resolved — Declined", color: "bg-slate-100 text-slate-600" },
  RESOLVED_OTHER:     { label: "Resolved — Other",    color: "bg-blue-100 text-blue-700" },
};

const REASON_LABELS: Record<string, string> = {
  high_reading: "Reading unusually high",
  wrong_unit: "Wrong unit billed",
  previous_reading_mismatch: "Previous reading mismatch",
  other: "Other reason",
};

const ACTIVE_STATUSES: DisputeStatus[] = ["OPEN", "LANDLORD_RESPONDED", "ESCALATED"];

export default function DisputesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "resolved" | "all">("active");
  const [actionId, setActionId] = useState<string | null>(null);
  const [decision, setDecision] = useState("");

  const load = useCallback(async () => {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/utility-disputes", {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (res.ok) {
        const json = await res.json() as { data: Dispute[] };
        setDisputes(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.authToken]);

  useEffect(() => { void load(); }, [load]);

  async function resolveDispute(disputeId: string, outcome: "approve" | "decline" | "other", dec: string) {
    if (!user?.authToken || !dec.trim()) {
      toast("Enter a resolution note", "error");
      return;
    }
    const res = await fetch("/api/v1/utility-disputes?admin=true", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${user.authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ disputeId, outcome, decision: dec }),
    });
    if (res.ok) {
      toast("Dispute resolved", "success");
      setActionId(null);
      setDecision("");
      void load();
    } else {
      const j = await res.json() as { error?: string };
      toast(j.error ?? "Failed to resolve", "error");
    }
  }

  const filtered = disputes.filter((d) => {
    if (filter === "active") return ACTIVE_STATUSES.includes(d.status);
    if (filter === "resolved") return !ACTIVE_STATUSES.includes(d.status);
    return true;
  });

  const activeCount = disputes.filter((d) => ACTIVE_STATUSES.includes(d.status)).length;

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Disputes</h1>
          <p className="app-page-lead">Utility meter reading disputes raised by tenants</p>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
              {activeCount} active
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["active", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-brand-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-300" />
          <p className="text-lg font-medium text-slate-700">No disputes</p>
          <p className="text-sm text-slate-400">
            {filter === "active" ? "No open disputes — all clear." : "No disputes match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((d) => {
            const sc = STATUS_CONFIG[d.status];
            const isActive = ACTIVE_STATUSES.includes(d.status);
            return (
              <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {REASON_LABELS[d.reason] ?? d.reason}
                      </p>
                      <p className="text-xs text-slate-500">
                        Meter: {d.reading.meterId.slice(0, 12)}… · Raised {new Date(d.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.color}`}>
                    {sc.label}
                  </span>
                </div>

                <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reading Date</p>
                    <p className="mt-0.5 text-slate-800">{new Date(d.reading.readingDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Disputed Reading</p>
                    <p className="mt-0.5 text-slate-800">{d.reading.previousReading} → {d.reading.currentReading} ({d.reading.consumption} units)</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
                    <p className="mt-0.5 text-slate-800">{sc.label}</p>
                  </div>
                </div>

                {d.landlordResponse && (
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1">Landlord Response</p>
                    {d.landlordResponse}
                  </div>
                )}

                {d.adminDecision && (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1">Admin Decision</p>
                    {d.adminDecision}
                  </div>
                )}

                {isActive && (
                  <div className="pt-1">
                    {actionId === d.id ? (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500">
                          Decide this dispute: Approve the tenant's claim, Decline it, or record another resolution. A note is required either way.
                        </p>
                        <textarea
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                          rows={2}
                          placeholder="Resolution note (required)…"
                          value={decision}
                          onChange={(e) => setDecision(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => void resolveDispute(d.id, "approve", decision)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void resolveDispute(d.id, "decline", decision)}>
                            Decline
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => void resolveDispute(d.id, "other", decision)}>
                            Other Resolution
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setActionId(null); setDecision(""); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => setActionId(d.id)}>
                        Resolve Dispute
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
