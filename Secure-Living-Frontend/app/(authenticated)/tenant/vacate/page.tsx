"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, AlertCircle, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";


const STEPS = [
  { key: "PENDING",              label: "Notice Submitted" },
  { key: "ACKNOWLEDGED",         label: "Acknowledged" },
  { key: "INSPECTION_SCHEDULED", label: "Inspection Scheduled" },
  { key: "INSPECTION_DONE",      label: "Inspection Done" },
  { key: "DEPOSIT_PROCESSING",   label: "Deposit Processing" },
  { key: "COMPLETED",            label: "Completed" },
];

const DEDUCTION_STATUS_BADGE: Record<string, string> = {
  proposed: "bg-amber-100 text-amber-700",
  accepted: "bg-green-100 text-green-700",
  disputed: "bg-red-100 text-red-700",
  finalised: "bg-blue-100 text-blue-700",
};

type VacatingNotice = {
  id: string;
  status: string;
  noticeDate: string;
  intendedMoveOut: string;
  enforcedMoveOut: string;
  noticePeriodDays: number;
  inspection: {
    scheduledDate: string;
    status: string;
    notes: string | null;
    deductions: Array<{
      id: string; description: string; amount: number; photoUrl: string | null; status: string;
      beforePhotoUrl: string | null; afterPhotoUrl: string | null; inspectorNote: string | null; billOrMeterRef: string | null;
    }>;
  } | null;
  depositRefund: {
    depositAmount: number;
    totalDeductions: number;
    refundAmount: number;
    status: string;
    voucherNumber: string | null;
    paidAt: string | null;
  } | null;
};

export default function TenantVacatePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notice, setNotice] = useState<VacatingNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [intendedDate, setIntendedDate] = useState("");
  const [tenantNote, setTenantNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [disputeId, setDisputeId] = useState<string | null>(null);
  const [disputeNote, setDisputeNote] = useState("");
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/vacating-notices?tenantId=${user?.id}`, {
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        const j = await res.json();
        if (j.data?.length > 0) setNotice(j.data[0]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  async function handleSubmit() {
    if (!intendedDate) return;
    setSaving(true);
    try {
      // First get the active lease
      const lr = await fetch(`/api/v1/leases?status=active`, { headers: { Authorization: `Bearer ${user?.authToken}` } });
      if (!lr.ok) { toast("Could not find active lease", "error"); return; }
      const leases = (await lr.json()).data ?? [];
      const activeLease = leases.find((l: Record<string, unknown>) => l.tenantUserId === user?.id);
      if (!activeLease) { toast("No active lease found", "error"); return; }

      const res = await fetch(`/api/v1/vacating-notices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({ leaseId: activeLease.id, intendedMoveOut: intendedDate, tenantNote }),
      });
      if (res.ok) {
        toast("Vacating notice submitted", "success");
        setSubmitOpen(false);
        load();
      } else {
        const j = await res.json();
        toast((j as { error?: string }).error ?? "Failed", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRespond(deductionId: string, action: "accept" | "dispute", note?: string) {
    setRespondingId(deductionId);
    try {
      const res = await fetch(`/api/v1/deductions/${deductionId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({ action, note }),
      });
      if (res.ok) {
        toast(action === "accept" ? "Deduction accepted" : "Deduction disputed — landlord has been notified", "success");
        setDisputeId(null);
        setDisputeNote("");
        load();
      } else {
        const j = await res.json().catch(() => ({}));
        toast(j.error ?? "Failed", "error");
      }
    } finally {
      setRespondingId(null);
    }
  }

  const currentStepIdx = notice ? STEPS.findIndex((s) => s.key === notice.status) : -1;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Move-Out Notice</h1>
        <p className="mt-1 text-sm text-slate-500">Submit your vacating notice and track the move-out process</p>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
      ) : !notice ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <LogOut className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No vacating notice submitted</p>
            <p className="mt-1 text-sm text-slate-500">Submit a notice when you intend to move out</p>
            {!submitOpen ? (
              <Button onClick={() => setSubmitOpen(true)} className="mt-4">Submit Vacating Notice</Button>
            ) : (
              <div className="mt-6 w-full max-w-sm space-y-4 text-left">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Intended Move-Out Date *</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={intendedDate}
                    onChange={(e) => setIntendedDate(e.target.value)}
                    min={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                  />
                  {intendedDate && (
                    <p className="mt-1 text-xs text-slate-500">
                      Your notice period is 30 days. Earliest move-out: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Note (optional)</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    rows={2}
                    value={tenantNote}
                    onChange={(e) => setTenantNote(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setSubmitOpen(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleSubmit} disabled={!intendedDate || saving} className="flex-1">
                    {saving ? "Submitting…" : "Submit Notice"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Status Timeline */}
          <Card>
            <CardHeader><CardTitle>Move-Out Progress</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {STEPS.map((step, idx) => {
                  const done = idx <= currentStepIdx;
                  const current = idx === currentStepIdx;
                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? "bg-green-100" : "bg-slate-100"}`}>
                        {done ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5 text-slate-400" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${current ? "text-blue-700" : done ? "text-slate-900" : "text-slate-400"}`}>
                          {step.label}
                        </p>
                      </div>
                      {current && <span className="text-xs text-blue-600 font-medium">Current</span>}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
                <p><span className="font-medium">Notice date:</span> {new Date(notice.noticeDate).toLocaleDateString()}</p>
                <p><span className="font-medium">Intended move-out:</span> {new Date(notice.intendedMoveOut).toLocaleDateString()}</p>
                <p><span className="font-medium">Enforced move-out:</span> {new Date(notice.enforcedMoveOut).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Inspection details */}
          {notice.inspection && (
            <Card>
              <CardHeader><CardTitle>Inspection</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm"><span className="font-medium">Scheduled:</span> {new Date(notice.inspection.scheduledDate).toLocaleDateString()}</p>
                <p className="text-sm"><span className="font-medium">Status:</span> {notice.inspection.status}</p>
                {notice.inspection.notes && <p className="text-sm"><span className="font-medium">Notes:</span> {notice.inspection.notes}</p>}
                {notice.inspection.deductions.length > 0 && (
                  <div>
                    <p className="mb-2 font-medium text-sm">Deductions:</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left py-1 text-xs text-slate-500">Item</th>
                          <th className="text-left py-1 text-xs text-slate-500">Status</th>
                          <th className="text-right py-1 text-xs text-slate-500">Amount</th>
                          <th className="py-1" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {notice.inspection.deductions.map((d) => (
                          <tr key={d.id}>
                            <td className="py-2 text-slate-700 align-top">{d.description}</td>
                            <td className="py-2 align-top">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DEDUCTION_STATUS_BADGE[d.status] ?? "bg-slate-100 text-slate-600"}`}>
                                {d.status}
                              </span>
                            </td>
                            <td className="py-2 text-right text-red-600 align-top">KES {d.amount.toLocaleString()}</td>
                            <td className="py-2 text-right align-top">
                              {d.status === "proposed" && (
                                <div className="flex justify-end gap-1.5">
                                  <Button size="sm" onClick={() => handleRespond(d.id, "accept")} disabled={respondingId === d.id}>
                                    Accept
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setDisputeId(d.id)} disabled={respondingId === d.id}>
                                    Dispute
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Deposit refund */}
          {notice.depositRefund && (
            <Card>
              <CardHeader><CardTitle>Deposit Refund</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Deposit Held</span><span className="font-medium">KES {notice.depositRefund.depositAmount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Total Deductions</span><span className="font-medium text-red-600">− KES {notice.depositRefund.totalDeductions.toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-slate-100 pt-2"><span className="font-semibold text-slate-900">Net Refund</span><span className="font-bold text-green-700">KES {notice.depositRefund.refundAmount.toLocaleString()}</span></div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-600">Status</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${notice.depositRefund.status === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {notice.depositRefund.status}
                  </span>
                </div>
                {notice.depositRefund.voucherNumber && (
                  <p className="text-xs text-slate-500">Voucher: {notice.depositRefund.voucherNumber}</p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dispute Deduction Modal */}
      <Modal open={!!disputeId} onOpenChange={(open) => { if (!open) { setDisputeId(null); setDisputeNote(""); } }} title="Dispute Deduction">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Tell your landlord why you disagree with this charge. They can add more evidence and resubmit it for your review.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={3}
              value={disputeNote}
              onChange={(e) => setDisputeNote(e.target.value)}
              placeholder="e.g. This damage was already present at move-in…"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => { setDisputeId(null); setDisputeNote(""); }} className="flex-1">Cancel</Button>
            <Button
              onClick={() => disputeId && handleRespond(disputeId, "dispute", disputeNote || undefined)}
              disabled={!disputeId || respondingId === disputeId}
              className="flex-1"
            >
              {respondingId === disputeId ? "Submitting…" : "Submit Dispute"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
