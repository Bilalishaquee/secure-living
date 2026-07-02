"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Download, CalendarClock, MessageCircleQuestion, Wrench, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { formatKes } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

type Lease = {
  id: string;
  status: string;
  propertyName: string | null;
  unitNumber: string | null;
  leaseType: string;
  rentAmount: number;
  depositAmount: number | null;
  depositModel: string;
  paymentFrequency: string | null;
  startDate: string;
  endDate: string;
  documentUrl: string | null;
  documentFileName: string | null;
  declineReason: string | null;
  renewalRequestedAt: string | null;
};

type LeaseQuestion = {
  id: string;
  question: string;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

// Tenant Portal "My Lease" (Update-2.md): the property manager authors the lease —
// pricing, dates, terms, renewals, compliance — the tenant only ever responds to it.
export default function TenantLeasePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Record<string, LeaseQuestion[]>>({});
  const [askOpen, setAskOpen] = useState<string | null>(null);
  const [questionDraft, setQuestionDraft] = useState("");
  const [reviewOpen, setReviewOpen] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [busy, setBusy] = useState(false);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function load() {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/leases", { headers: authHeader() });
      if (res.ok) {
        const json = (await res.json()) as { data: Lease[] };
        setLeases(json.data);
        for (const lease of json.data) {
          if (lease.status === "offered") void loadQuestions(lease.id);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions(leaseId: string) {
    const res = await fetch(`/api/v1/leases/${leaseId}/questions`, { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: LeaseQuestion[] };
      setQuestions((q) => ({ ...q, [leaseId]: json.data }));
    }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.authToken]);

  async function handleAskQuestion() {
    if (!askOpen || !questionDraft.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/leases/${askOpen}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ question: questionDraft.trim() }),
      });
      if (res.ok) {
        toast("Question sent to your landlord", "success");
        setQuestionDraft("");
        setAskOpen(null);
        void loadQuestions(askOpen);
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to send question", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleAcceptSign(leaseId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/leases/${leaseId}/respond-to-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ action: "accept" }),
      });
      if (res.ok) {
        toast("Lease signed! It's now your active lease.", "success");
        void load();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to sign lease", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDecline() {
    if (!declineOpen) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/leases/${declineOpen}/respond-to-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ action: "decline", reason: declineReason.trim() || undefined }),
      });
      if (res.ok) {
        toast("Lease offer declined", "success");
        setDeclineOpen(null);
        setDeclineReason("");
        void load();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to decline lease", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestRenewal(leaseId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/leases/${leaseId}/request-renewal`, {
        method: "POST",
        headers: authHeader(),
      });
      if (res.ok) {
        toast("Renewal request sent to your landlord", "success");
        void load();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to request renewal", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  const activeLease = leases.find((l) => l.status === "active");
  const offeredLease = leases.find((l) => l.status === "offered");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Lease</h1>
        <p className="mt-1 text-sm text-slate-500">Your current lease and any pending offer from your landlord.</p>
      </div>

      {!activeLease && !offeredLease && (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileText className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No lease yet</p>
            <p className="mt-1 text-sm text-slate-500">Once your landlord sends you a lease offer, it will appear here.</p>
          </CardContent>
        </Card>
      )}

      {offeredLease && (
        <Card className="border-sky-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lease Offer</CardTitle>
              <Badge variant="info">Awaiting Your Signature</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <LeaseSummary lease={offeredLease} />

            {(questions[offeredLease.id] ?? []).length > 0 && (
              <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your Questions</p>
                {(questions[offeredLease.id] ?? []).map((q) => (
                  <div key={q.id} className="text-sm">
                    <p className="font-medium text-slate-800">{q.question}</p>
                    {q.answer ? (
                      <p className="mt-0.5 text-slate-600">↳ {q.answer}</p>
                    ) : (
                      <p className="mt-0.5 text-xs text-slate-400">Waiting for a reply…</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => setReviewOpen(offeredLease.id)}>
                Review Lease
              </Button>
              {offeredLease.documentUrl && (
                <Button size="sm" variant="outline" asChild>
                  <a href={offeredLease.documentUrl} target="_blank" rel="noreferrer" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Download Draft
                  </a>
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setAskOpen(offeredLease.id)} className="gap-1.5">
                <MessageCircleQuestion className="h-3.5 w-3.5" /> Ask Questions
              </Button>
              <Button size="sm" onClick={() => { void handleAcceptSign(offeredLease.id); }} disabled={busy} className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Accept & Sign
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 text-red-600 hover:bg-red-50"
                onClick={() => setDeclineOpen(offeredLease.id)}>
                <XCircle className="h-3.5 w-3.5" /> Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeLease && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Lease</CardTitle>
              <Badge variant="success">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <LeaseSummary lease={activeLease} />

            {activeLease.renewalRequestedAt && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Renewal requested on {fmtDate(activeLease.renewalRequestedAt)} — your landlord has been notified.
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {activeLease.documentUrl ? (
                <Button size="sm" variant="outline" asChild>
                  <a href={activeLease.documentUrl} target="_blank" rel="noreferrer">View Lease</a>
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>View Lease</Button>
              )}
              {activeLease.documentUrl && (
                <Button size="sm" variant="outline" asChild>
                  <a href={activeLease.documentUrl} download={activeLease.documentFileName ?? undefined} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Download Lease
                  </a>
                </Button>
              )}
              <Button size="sm" variant="outline" asChild>
                <Link href={`/tenant/lease/payments?leaseId=${activeLease.id}`}>View Payment Schedule</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={busy || !!activeLease.renewalRequestedAt}
                onClick={() => { void handleRequestRenewal(activeLease.id); }}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                {activeLease.renewalRequestedAt ? "Renewal Requested" : "Request Renewal"}
              </Button>
              <Button size="sm" variant="outline" asChild className="gap-1.5">
                <Link href="/service-requests"><Wrench className="h-3.5 w-3.5" /> Report Issue</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Lease Modal — full terms, read-only (the tenant reviews, never edits) */}
      <Modal open={!!reviewOpen} onOpenChange={(open) => { if (!open) setReviewOpen(null); }} title="Review Lease Terms">
        {(() => {
          const lease = leases.find((l) => l.id === reviewOpen);
          if (!lease) return null;
          return (
            <div className="space-y-3 text-sm">
              <Row label="Property" value={lease.propertyName ?? "—"} />
              <Row label="Unit" value={lease.unitNumber ?? "—"} />
              <Row label="Lease Type" value={lease.leaseType.replace(/_/g, " ")} />
              <Row label="Monthly Rent" value={formatKes(lease.rentAmount)} />
              <Row label="Deposit" value={lease.depositAmount ? formatKes(lease.depositAmount) : "—"} />
              <Row label="Deposit Model" value={lease.depositModel === "DEPOSIT_ESCROW" ? "Deposit Escrow" : "Landlord Reserve"} />
              <Row label="Payment Frequency" value={lease.paymentFrequency ?? "—"} />
              <Row label="Start Date" value={fmtDate(lease.startDate)} />
              <Row label="End Date" value={fmtDate(lease.endDate)} />
              <p className="pt-2 text-xs text-slate-400">
                These are the terms your landlord set. If anything is unclear, use Ask Questions before you Accept & Sign.
              </p>
              <div className="flex justify-end pt-2">
                <Button variant="ghost" onClick={() => setReviewOpen(null)}>Close</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Ask Questions Modal */}
      <Modal open={!!askOpen} onOpenChange={(open) => { if (!open) setAskOpen(null); }} title="Ask About This Lease">
        <div className="space-y-4">
          <textarea
            className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Is the deposit refundable if I leave early?"
            value={questionDraft}
            onChange={(e) => setQuestionDraft(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAskOpen(null)}>Cancel</Button>
            <Button onClick={() => { void handleAskQuestion(); }} disabled={busy || !questionDraft.trim()}>
              {busy ? "Sending…" : "Send Question"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Decline Modal */}
      <Modal open={!!declineOpen} onOpenChange={(open) => { if (!open) setDeclineOpen(null); }} title="Decline Lease Offer">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Let your landlord know why, if you'd like — this is optional.</p>
          <textarea
            className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Reason (optional)…"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeclineOpen(null)}>Cancel</Button>
            <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => { void handleDecline(); }} disabled={busy}>
              {busy ? "Declining…" : "Confirm Decline"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function LeaseSummary({ lease }: { lease: Lease }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div><p className="text-xs text-slate-400">Property</p><p className="font-semibold text-slate-800">{lease.propertyName ?? "—"}</p></div>
      <div><p className="text-xs text-slate-400">Unit</p><p className="font-semibold text-slate-800">{lease.unitNumber ?? "—"}</p></div>
      <div><p className="text-xs text-slate-400">Rent</p><p className="font-semibold text-slate-800">{formatKes(lease.rentAmount)}</p></div>
      <div><p className="text-xs text-slate-400">Deposit</p><p className="font-semibold text-slate-800">{lease.depositAmount ? formatKes(lease.depositAmount) : "—"}</p></div>
      <div><p className="text-xs text-slate-400">Start</p><p className="font-semibold text-slate-800">{fmtDate(lease.startDate)}</p></div>
      <div><p className="text-xs text-slate-400">End</p><p className="font-semibold text-slate-800">{fmtDate(lease.endDate)}</p></div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
