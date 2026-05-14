"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Plus, Trash2 } from "lucide-react";
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

type Deduction = { description: string; amount: string };

type Notice = {
  id: string;
  status: string;
  noticeDate: string;
  intendedMoveOut: string;
  enforcedMoveOut: string;
  noticePeriodDays: number;
  lease: { id: string; tenantUserId: string; depositAmount: number };
  unit: { id: string; unitNumber: string };
  inspection: {
    id: string;
    scheduledDate: string;
    status: string;
    notes: string | null;
    deductions: Array<{ id: string; description: string; amount: number; photoUrl: string | null }>;
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

export default function VacatingDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [schedDate, setSchedDate] = useState("");
  const [inspNotes, setInspNotes] = useState("");
  const [deductions, setDeductions] = useState<Deduction[]>([{ description: "", amount: "" }]);
  const [depositAmt, setDepositAmt] = useState("");
  const [voucherNum, setVoucherNum] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/vacating-notices/${params.id}`, {
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        const j = await res.json();
        setNotice(j.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  async function handleSchedule() {
    if (!schedDate) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/vacating-notices/${params.id}/schedule-inspection`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({ scheduledDate: schedDate }),
      });
      if (res.ok) {
        toast({ title: "Inspection scheduled", variant: "success" });
        setScheduleOpen(false);
        load();
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteInspection() {
    setSaving(true);
    try {
      const validDeductions = deductions.filter((d) => d.description && d.amount);
      const res = await fetch(`/api/v1/vacating-notices/${params.id}/complete-inspection`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({
          notes: inspNotes || null,
          deductions: validDeductions.map((d) => ({ description: d.description, amount: parseFloat(d.amount) })),
        }),
      });
      if (res.ok) {
        toast({ title: "Inspection completed", variant: "success" });
        setInspectOpen(false);
        load();
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleProcessRefund() {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/vacating-notices/${params.id}/process-refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({ depositAmount: depositAmt ? parseFloat(depositAmt) : undefined }),
      });
      if (res.ok) {
        toast({ title: "Refund processed", variant: "success" });
        load();
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handlePayRefund() {
    if (!voucherNum) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/vacating-notices/${params.id}/pay-refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({ voucherNumber: voucherNum }),
      });
      if (res.ok) {
        toast({ title: "Refund marked as paid", variant: "success" });
        setPayOpen(false);
        load();
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  const currentStepIdx = notice ? STEPS.findIndex((s) => s.key === notice.status) : -1;

  if (loading) return <div className="h-64 animate-pulse rounded-xl bg-slate-100" />;
  if (!notice) return <p className="text-slate-500">Notice not found</p>;

  const totalDeductions = deductions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/vacating" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Vacating Notices
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Unit {notice.unit?.unitNumber}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Notice: {new Date(notice.noticeDate).toLocaleDateString()} ·
            Enforced move-out: {new Date(notice.enforcedMoveOut).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {notice.status === "ACKNOWLEDGED" && (
            <Button onClick={() => setScheduleOpen(true)}>Schedule Inspection</Button>
          )}
          {notice.status === "INSPECTION_SCHEDULED" && (
            <Button onClick={() => setInspectOpen(true)}>Complete Inspection</Button>
          )}
          {notice.status === "INSPECTION_DONE" && (
            <Button onClick={handleProcessRefund} disabled={saving}>Process Refund</Button>
          )}
          {notice.status === "DEPOSIT_PROCESSING" && (
            <Button onClick={() => setPayOpen(true)}>Mark Refund Paid</Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {STEPS.map((step, idx) => {
              const done = idx <= currentStepIdx;
              const current = idx === currentStepIdx;
              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? "bg-green-100" : "bg-slate-100"}`}>
                    {done ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5 text-slate-400" />}
                  </div>
                  <p className={`flex-1 text-sm font-medium ${current ? "text-blue-700" : done ? "text-slate-900" : "text-slate-400"}`}>
                    {step.label}
                  </p>
                  {current && <span className="text-xs font-medium text-blue-600">Current</span>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Inspection card */}
      {notice.inspection && (
        <Card>
          <CardHeader><CardTitle>Inspection Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="font-medium">Scheduled:</span> {new Date(notice.inspection.scheduledDate).toLocaleDateString()}</p>
            <p><span className="font-medium">Status:</span> {notice.inspection.status}</p>
            {notice.inspection.notes && <p><span className="font-medium">Notes:</span> {notice.inspection.notes}</p>}

            {notice.inspection.deductions.length > 0 && (
              <div>
                <p className="mb-2 font-medium">Deductions:</p>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs text-slate-500 py-1">Description</th>
                      <th className="text-right text-xs text-slate-500 py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {notice.inspection.deductions.map((d) => (
                      <tr key={d.id}>
                        <td className="py-2 text-slate-700">{d.description}</td>
                        <td className="py-2 text-right font-medium text-red-600">KES {d.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deposit refund card */}
      {notice.depositRefund && (
        <Card>
          <CardHeader><CardTitle>Deposit Refund</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Deposit Held</span><span className="font-medium">KES {notice.depositRefund.depositAmount.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Total Deductions</span><span className="font-medium text-red-600">− KES {notice.depositRefund.totalDeductions.toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-2"><span className="font-semibold text-slate-900">Net Refund</span><span className="font-bold text-green-700">KES {notice.depositRefund.refundAmount.toLocaleString()}</span></div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-600">Status</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${notice.depositRefund.status === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {notice.depositRefund.status}
              </span>
            </div>
            {notice.depositRefund.voucherNumber && (
              <p className="text-xs text-slate-500">Voucher: {notice.depositRefund.voucherNumber}</p>
            )}
            {notice.depositRefund.paidAt && (
              <p className="text-xs text-slate-500">Paid: {new Date(notice.depositRefund.paidAt).toLocaleDateString()}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedule Inspection Modal */}
      <Modal open={scheduleOpen} onOpenChange={setScheduleOpen} title="Schedule Inspection">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Inspection Date *</label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={schedDate}
              onChange={(e) => setSchedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setScheduleOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSchedule} disabled={!schedDate || saving} className="flex-1">
              {saving ? "Scheduling…" : "Schedule"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Complete Inspection Modal */}
      <Modal open={inspectOpen} onOpenChange={setInspectOpen} title="Complete Inspection">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Inspection Notes</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={3}
              value={inspNotes}
              onChange={(e) => setInspNotes(e.target.value)}
              placeholder="Describe the condition of the unit…"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Deductions</label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeductions((d) => [...d, { description: "", amount: "" }])}
                className="gap-1"
              >
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {deductions.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Description"
                    value={d.description}
                    onChange={(e) => setDeductions((prev) => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                  />
                  <input
                    type="number"
                    className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Amount"
                    value={d.amount}
                    onChange={(e) => setDeductions((prev) => prev.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                  />
                  {deductions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDeductions((prev) => prev.filter((_, j) => j !== i))}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {totalDeductions > 0 && (
              <p className="mt-2 text-right text-sm font-medium text-red-600">
                Total deductions: KES {totalDeductions.toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setInspectOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleCompleteInspection} disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Complete Inspection"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mark Paid Modal */}
      <Modal open={payOpen} onOpenChange={setPayOpen} title="Mark Refund as Paid">
        <div className="space-y-4">
          {notice.depositRefund && (
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <p className="font-medium">Refund Amount: <span className="text-green-700">KES {notice.depositRefund.refundAmount.toLocaleString()}</span></p>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Voucher / Reference Number *</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="e.g. MPESA-ABC123"
              value={voucherNum}
              onChange={(e) => setVoucherNum(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setPayOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handlePayRefund} disabled={!voucherNum || saving} className="flex-1">
              {saving ? "Saving…" : "Confirm Payment"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
