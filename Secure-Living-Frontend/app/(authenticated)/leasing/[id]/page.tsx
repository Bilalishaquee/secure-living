"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { formatKes } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

type Lease = {
  id: string;
  propertyId: string;
  unitId: string;
  tenantUserId: string;
  leaseType: string;
  rentAmount: number;
  depositAmount: number | null;
  depositModel: string;
  depositEscrow?: {
    currentBalance: number;
    healthStatus: string;
    walletWatchActive: boolean;
    status: string;
  } | null;
  status: string;
  startDate: string;
  endDate: string;
  paymentFrequency: string | null;
  signedAt: string | null;
  terminatedAt: string | null;
  documentUrl: string | null;
  documentFileName: string | null;
  documentUploadedAt: string | null;
  createdAt: string;
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "neutral" | "info"> = {
  active:     "success",
  draft:      "neutral",
  pending:    "warning",
  terminated: "error",
  expired:    "neutral",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft:      ["active", "terminated"],
  active:     ["terminated", "expired"],
  terminated: [],
  expired:    [],
};

type PageProps = { params: { id: string } };

export default function LeaseDetailPage({ params }: PageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [renewForm, setRenewForm] = useState({ startDate: "", endDate: "", rentAmount: "", depositAmount: "", paymentFrequency: "" });
  const [topUpForm, setTopUpForm] = useState({ amount: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  async function handleUploadDocument(file: File) {
    if (!lease) return;
    setUploadingDoc(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/v1/leases/${lease.id}/document`, {
        method: "POST",
        headers: authHeader(),
        body: form,
      });
      if (res.ok) {
        toast("Lease document uploaded", "success");
        const refreshed = await fetch(`/api/v1/leases/${lease.id}`, { headers: authHeader() });
        if (refreshed.ok) {
          const json = (await refreshed.json()) as { data: Lease };
          setLease(json.data);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error ?? "Failed to upload lease document", "error");
      }
    } finally {
      setUploadingDoc(false);
    }
  }

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/leases/${params.id}`, { headers: authHeader() });
        if (!res.ok) { toast("Lease not found.", "error"); router.replace("/leasing"); return; }
        const json = (await res.json()) as { data: Lease };
        setLease(json.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, params.id]);

  async function handleStatusChange() {
    if (!lease || !pendingStatus) return;
    setSaving(true);
    try {
      const body: Record<string, string> = { status: pendingStatus };
      if (pendingStatus === "active") body.signedAt = new Date().toISOString();
      if (pendingStatus === "terminated") body.terminatedAt = new Date().toISOString();

      const res = await fetch(`/api/v1/leases/${lease.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const json = (await res.json()) as { data: Lease };
        setLease(json.data);
        toast(`Lease status updated to ${pendingStatus}.`, "success");
        setShowStatusModal(false);
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to update status.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  function openRenewModal() {
    if (!lease) return;
    const nextStart = new Date(lease.endDate);
    nextStart.setDate(nextStart.getDate() + 1);
    const nextEnd = new Date(nextStart);
    nextEnd.setFullYear(nextEnd.getFullYear() + 1);
    nextEnd.setDate(nextEnd.getDate() - 1);
    setRenewForm({
      startDate: nextStart.toISOString().slice(0, 10),
      endDate: nextEnd.toISOString().slice(0, 10),
      rentAmount: lease.rentAmount.toString(),
      depositAmount: lease.depositAmount?.toString() ?? "",
      paymentFrequency: lease.paymentFrequency ?? "monthly",
    });
    setShowRenewModal(true);
  }

  async function handleRenewLease() {
    if (!lease) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/leases/${lease.id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          startDate: renewForm.startDate,
          endDate: renewForm.endDate,
          rentAmount: Number(renewForm.rentAmount),
          depositAmount: renewForm.depositAmount ? Number(renewForm.depositAmount) : undefined,
          paymentFrequency: renewForm.paymentFrequency || undefined,
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { data: Lease };
        toast("Renewal draft created. Activate it after review/signing.", "success");
        router.push(`/leasing/${json.data.id}`);
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to renew lease.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTopUpRequest() {
    if (!lease) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/deposit/top-up", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ leaseId: lease.id, amount: Number(topUpForm.amount), reason: topUpForm.reason }),
      });
      if (res.ok) {
        toast("Top-up request submitted.", "success");
        setShowTopUpModal(false);
        setTopUpForm({ amount: "", reason: "" });
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to submit top-up.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCaptureDeposit() {
    if (!lease) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/deposit/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ leaseId: lease.id }),
      });
      if (res.ok) toast("Deposit captured for deduction processing.", "success");
      else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Unable to capture deposit.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!lease) return null;

  const transitions = STATUS_TRANSITIONS[lease.status] ?? [];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/leasing">
            <ArrowLeft className="mr-1 h-4 w-4" /> Leases
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="app-page-title flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Lease Detail
          </h1>
          <p className="app-page-lead font-mono text-xs">{lease.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[lease.status] ?? "neutral"} className="text-sm px-3 py-1">
            {lease.status}
          </Badge>
          {transitions.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setPendingStatus(transitions[0]); setShowStatusModal(true); }}
            >
              Change Status
            </Button>
          )}
          {["active", "expired", "terminated"].includes(lease.status) && (
            <Button size="sm" onClick={openRenewModal}>
              Renew Lease
            </Button>
          )}
          <label className="inline-flex">
            <input
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              disabled={uploadingDoc}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUploadDocument(file);
                e.target.value = "";
              }}
            />
            <span className="inline-flex cursor-pointer items-center rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {uploadingDoc ? "Uploading…" : lease.documentUrl ? "Replace Lease Document" : "Upload Lease"}
            </span>
          </label>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lease Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Type" value={lease.leaseType.replace(/_/g, " ")} />
            <Row label="Monthly Rent" value={formatKes(lease.rentAmount)} mono />
            <Row label="Deposit" value={lease.depositAmount ? formatKes(lease.depositAmount) : "—"} mono />
            <Row label="Payment" value={lease.paymentFrequency ?? "—"} />
            <Row label="Start Date" value={new Date(lease.startDate).toLocaleDateString("en-GB")} />
            <Row label="End Date" value={new Date(lease.endDate).toLocaleDateString("en-GB")} />
            {lease.signedAt && <Row label="Signed" value={new Date(lease.signedAt).toLocaleDateString("en-GB")} />}
            {lease.terminatedAt && <Row label="Terminated" value={new Date(lease.terminatedAt).toLocaleDateString("en-GB")} />}
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Document</span>
              {lease.documentUrl ? (
                <a
                  href={lease.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="max-w-[60%] truncate text-right text-blue-600 hover:underline"
                >
                  {lease.documentFileName ?? "View document"}
                </a>
              ) : (
                <span className="text-slate-400">Not uploaded</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tenant</span>
              <Link href={`/tenants/${lease.tenantUserId}`} className="font-medium text-blue-600 hover:underline">
                {lease.tenantUserId.slice(0, 16)}…
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Property</span>
              <Link href={`/properties/${lease.propertyId}`} className="font-medium text-blue-600 hover:underline">
                {lease.propertyId.slice(0, 16)}…
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Unit</span>
              <Link
                href={`/properties/${lease.propertyId}/units/${lease.unitId}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {lease.unitId.slice(0, 16)}…
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deposit Protection</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-4">
          <Row label="Model" value={lease.depositModel === "DEPOSIT_ESCROW" ? "Deposit Escrow + Top-Ups" : "Landlord Reserve"} />
          <Row label="Balance" value={formatKes(lease.depositEscrow?.currentBalance ?? lease.depositAmount ?? 0)} mono />
          <Row label="Health" value={(lease.depositEscrow?.healthStatus ?? "fully_covered").replace(/_/g, " ")} />
          <Row label="Wallet Watch" value={lease.depositEscrow?.walletWatchActive ? "Active" : "Inactive"} />
          <div className="sm:col-span-4 flex flex-wrap gap-2">
            {lease.depositModel === "DEPOSIT_ESCROW" ? (
              <Button size="sm" onClick={() => setShowTopUpModal(true)}>Request Top-Up</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => { void handleCaptureDeposit(); }} disabled={saving}>
                Capture Reserve
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-0">
            {(["draft", "active", "terminated"] as const).map((s, i, arr) => {
              const reached = s === lease.status ||
                (s === "draft" && ["active", "terminated", "expired"].includes(lease.status)) ||
                (s === "active" && ["terminated", "expired"].includes(lease.status));
              return (
                <div key={s} className="flex flex-1 items-center">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${reached ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {reached ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <span className={`ml-1.5 text-xs font-medium ${reached ? "text-blue-700" : "text-slate-400"}`}>{s}</span>
                  {i < arr.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${reached ? "bg-blue-200" : "bg-slate-100"}`} />}
                </div>
              );
            })}
            {lease.status === "expired" && (
              <div className="flex items-center">
                <div className="mx-2 h-0.5 flex-1 bg-slate-100" />
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                  <XCircle className="h-4 w-4 text-slate-500" />
                </div>
                <span className="ml-1.5 text-xs font-medium text-slate-500">expired</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Status Modal */}
      <Modal open={showStatusModal} onOpenChange={setShowStatusModal} title="Change Lease Status">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Transition this lease from <strong>{lease.status}</strong> to:
          </p>
          <div className="flex flex-wrap gap-2">
            {transitions.map((s) => (
              <button
                key={s}
                onClick={() => setPendingStatus(s)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  pendingStatus === s
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>Cancel</Button>
            <Button onClick={() => { void handleStatusChange(); }} disabled={!pendingStatus || saving}>
              {saving ? "Saving…" : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showRenewModal} onOpenChange={setShowRenewModal} title="Renew Lease">
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            A terminated lease is kept as a historical record. Renewal creates a new draft lease for the same tenant and unit, then it can be activated after review/signing.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Start Date</label>
              <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={renewForm.startDate} onChange={(e) => setRenewForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">End Date</label>
              <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={renewForm.endDate} onChange={(e) => setRenewForm((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Rent Amount</label>
              <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={renewForm.rentAmount} onChange={(e) => setRenewForm((f) => ({ ...f, rentAmount: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Deposit Amount</label>
              <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={renewForm.depositAmount} onChange={(e) => setRenewForm((f) => ({ ...f, depositAmount: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Payment Frequency</label>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={renewForm.paymentFrequency} onChange={(e) => setRenewForm((f) => ({ ...f, paymentFrequency: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowRenewModal(false)}>Cancel</Button>
            <Button onClick={() => { void handleRenewLease(); }} disabled={!renewForm.startDate || !renewForm.endDate || !renewForm.rentAmount || saving}>
              {saving ? "Creating..." : "Create Renewal Draft"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showTopUpModal} onOpenChange={setShowTopUpModal} title="Deposit Top-Up Request">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Amount (KES)</label>
            <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={topUpForm.amount} onChange={(e) => setTopUpForm((f) => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Reason</label>
            <textarea className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={topUpForm.reason} onChange={(e) => setTopUpForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Rent increase at renewal, damage incident, voluntary extra protection..." />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowTopUpModal(false)}>Cancel</Button>
            <Button onClick={() => { void handleTopUpRequest(); }} disabled={!topUpForm.amount || !topUpForm.reason || saving}>
              Submit Top-Up
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium text-slate-700 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
