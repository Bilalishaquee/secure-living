"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type InquiryStatus = "SUBMITTED" | "UNDER_REVIEW" | "ASSIGNED" | "INVITATION_SENT" | "ACCEPTED" | "DECLINED" | "CLOSED";

type Inquiry = {
  id: string;
  propertyId: string;
  landlordId: string;
  branchId: string;
  status: InquiryStatus;
  region: string | null;
  assignedAdminId: string | null;
  escalatedToSuperAdmin: boolean;
  escalationReason: string | null;
  declineReason: string | null;
  message: string | null;
  createdAt: string;
};

const STATUS_CONFIG: Record<InquiryStatus, { label: string; color: string }> = {
  SUBMITTED:       { label: "Submitted", color: "bg-amber-100 text-amber-700" },
  UNDER_REVIEW:    { label: "Under Review", color: "bg-blue-100 text-blue-700" },
  ASSIGNED:        { label: "Assigned", color: "bg-indigo-100 text-indigo-700" },
  INVITATION_SENT: { label: "Invitation Sent — awaiting landlord", color: "bg-sky-100 text-sky-700" },
  ACCEPTED:        { label: "Accepted", color: "bg-emerald-100 text-emerald-700" },
  DECLINED:        { label: "Declined", color: "bg-red-100 text-red-700" },
  CLOSED:          { label: "Closed", color: "bg-slate-100 text-slate-600" },
};

const ACTIVE_STATUSES: InquiryStatus[] = ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "INVITATION_SENT"];

export default function ManagementInquiriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [showEscalatedOnly, setShowEscalatedOnly] = useState(false);
  const [declineTarget, setDeclineTarget] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [escalateTarget, setEscalateTarget] = useState<string | null>(null);
  const [escalateReason, setEscalateReason] = useState("");

  const isSuperAdmin = user?.permissions?.includes("*") ?? false;

  const load = useCallback(async () => {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const url = showEscalatedOnly ? "/api/v1/management-inquiries?escalated=true" : "/api/v1/management-inquiries";
      const res = await fetch(url, { headers: { Authorization: `Bearer ${user.authToken}` } });
      if (res.ok) {
        const json = (await res.json()) as { data: Inquiry[] };
        setInquiries(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.authToken, showEscalatedOnly]);

  useEffect(() => { void load(); }, [load]);

  async function callAction(id: string, path: string, body?: Record<string, unknown>) {
    if (!user?.authToken) return false;
    setActingId(id);
    try {
      const res = await fetch(`/api/v1/management-inquiries/${id}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.authToken}` },
        body: JSON.stringify(body ?? {}),
      });
      if (res.ok) {
        await load();
        return true;
      }
      const j = (await res.json()) as { error?: string };
      toast(j.error ?? "Failed", "error");
      return false;
    } finally {
      setActingId(null);
    }
  }

  async function claim(id: string) {
    if (await callAction(id, "/claim")) toast("Inquiry claimed — now under your review", "success");
  }
  async function invite(id: string) {
    if (await callAction(id, "/respond", { action: "invite" })) toast("Invitation sent to landlord", "success");
  }
  async function activate(id: string) {
    if (await callAction(id, "/respond", { action: "activate" })) toast("Takeover activated", "success");
  }
  async function close(id: string) {
    if (await callAction(id, "/close")) toast("Inquiry closed", "success");
  }
  async function submitDecline() {
    if (!declineTarget || !declineReason.trim()) return;
    const ok = await callAction(declineTarget, "/respond", { action: "decline", reason: declineReason.trim() });
    if (ok) { toast("Inquiry declined", "success"); setDeclineTarget(null); setDeclineReason(""); }
  }
  async function submitEscalate() {
    if (!escalateTarget || !escalateReason.trim()) return;
    const ok = await callAction(escalateTarget, "/escalate", { reason: escalateReason.trim() });
    if (ok) { toast("Escalated to Super Admin", "success"); setEscalateTarget(null); setEscalateReason(""); }
  }

  const active = inquiries.filter((i) => ACTIVE_STATUSES.includes(i.status));
  const resolved = inquiries.filter((i) => !ACTIVE_STATUSES.includes(i.status));

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Management Assistance Inquiries</h1>
          <p className="app-page-lead">
            Submitted → Under Review → Assigned → Invitation Sent → Accepted/Declined → Closed. Self-managed
            landlords requesting professional management; regional admins can escalate to Super Admin if needed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Button
              variant={showEscalatedOnly ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowEscalatedOnly((v) => !v)}
            >
              <AlertTriangle className="mr-1.5 h-4 w-4" /> {showEscalatedOnly ? "Showing Escalated" : "Show Escalated Only"}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : active.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-300" />
          <p className="text-lg font-medium text-slate-700">No active inquiries</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((i) => {
            const sc = STATUS_CONFIG[i.status];
            return (
              <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 shrink-0 text-brand-blue" />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Property {i.propertyId.slice(0, 8)}… {i.region && <span className="ml-1 text-xs font-normal text-slate-400">Region: {i.region}</span>}
                    </p>
                    <p className="text-xs text-slate-500">Submitted {new Date(i.createdAt).toLocaleDateString()}</p>
                    {i.message && <p className="mt-1 text-sm text-slate-600">{i.message}</p>}
                    {i.assignedAdminId && <p className="mt-1 text-xs text-slate-400">Assigned to {i.assignedAdminId.slice(0, 8)}…</p>}
                    {i.escalatedToSuperAdmin && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> Escalated to Super Admin{i.escalationReason ? `: ${i.escalationReason}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.color}`}>{sc.label}</span>
                  {i.status === "SUBMITTED" && (
                    <Button size="sm" variant="secondary" onClick={() => void claim(i.id)} disabled={actingId === i.id}>
                      Claim
                    </Button>
                  )}
                  {(i.status === "SUBMITTED" || i.status === "UNDER_REVIEW" || i.status === "ASSIGNED") && (
                    <>
                      <Button size="sm" onClick={() => void invite(i.id)} disabled={actingId === i.id}>
                        Send Invitation
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => void activate(i.id)} disabled={actingId === i.id}>
                        Activate Now
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDeclineTarget(i.id)} disabled={actingId === i.id}>
                        Decline
                      </Button>
                      {!i.escalatedToSuperAdmin && (
                        <Button size="sm" variant="outline" onClick={() => setEscalateTarget(i.id)} disabled={actingId === i.id}>
                          Escalate
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resolved.length > 0 && (
        <details className="rounded-xl border border-surface-border bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">Resolved inquiries ({resolved.length})</summary>
          <div className="mt-3 space-y-2">
            {resolved.map((i) => {
              const sc = STATUS_CONFIG[i.status];
              return (
                <div key={i.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <div>
                    <span>Property {i.propertyId.slice(0, 8)}…</span>
                    {i.declineReason && <span className="ml-2 text-xs text-slate-400">— {i.declineReason}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.color}`}>{sc.label}</span>
                    {(i.status === "ACCEPTED" || i.status === "DECLINED") && (
                      <Button size="sm" variant="ghost" onClick={() => void close(i.id)} disabled={actingId === i.id}>
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}

      <Modal open={!!declineTarget} onOpenChange={(open) => { if (!open) { setDeclineTarget(null); setDeclineReason(""); } }} title="Decline Inquiry">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">A reason is required so the landlord understands why.</p>
          <textarea
            className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Reason for declining…"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeclineTarget(null)}>Cancel</Button>
            <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => { void submitDecline(); }} disabled={!declineReason.trim()}>
              Confirm Decline
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!escalateTarget} onOpenChange={(open) => { if (!open) { setEscalateTarget(null); setEscalateReason(""); } }} title="Escalate to Super Admin">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Explain why this needs Super Admin attention.</p>
          <textarea
            className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Reason for escalation…"
            value={escalateReason}
            onChange={(e) => setEscalateReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEscalateTarget(null)}>Cancel</Button>
            <Button onClick={() => { void submitEscalate(); }} disabled={!escalateReason.trim()}>
              Escalate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
