"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, Shield, Clock, CheckCircle, Plus } from "lucide-react";

interface DepositTransfer {
  id: string;
  leaseId: string;
  outgoingTenantId: string;
  propertyId: string;
  unitId: string;
  depositAmountKes: number;
  platformFeeKes: number;
  incomingTenantId: string | null;
  status: string;
  listedAt: string;
  expiresAt: string;
  buyerPaidAt?: string;
  releasedAt?: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "info" | "warning" | "neutral" }> = {
  LISTED: { label: "Available", variant: "info" },
  BUYER_PAID: { label: "Payment Received", variant: "warning" },
  LANDLORD_APPROVED: { label: "Landlord Approved", variant: "warning" },
  INSPECTION_COMPLETE: { label: "Inspection Done", variant: "warning" },
  RELEASED: { label: "Released", variant: "success" },
  EXPIRED: { label: "Expired", variant: "neutral" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
};

export default function DepositTransferPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [myTransfers, setMyTransfers] = useState<DepositTransfer[]>([]);
  const [availableTransfers, setAvailableTransfers] = useState<DepositTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"my" | "available">("my");

  // List deposit form
  const [showList, setShowList] = useState(false);
  const [leaseId, setLeaseId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [listing, setListing] = useState(false);

  function authHeader() {
    return { Authorization: `Bearer ${user?.authToken ?? ""}`, "Content-Type": "application/json" };
  }

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    try {
      const [myRes, availRes] = await Promise.all([
        fetch("/api/v1/deposit-transfers?own=true", { headers: authHeader() }),
        fetch("/api/v1/deposit-transfers", { headers: authHeader() }),
      ]);
      if (myRes.ok) {
        const j = (await myRes.json()) as { data: DepositTransfer[] };
        setMyTransfers(j.data);
      }
      if (availRes.ok) {
        const j = (await availRes.json()) as { data: DepositTransfer[] };
        setAvailableTransfers(j.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchData(); }, [user]);

  async function listDeposit() {
    if (!leaseId || !depositAmount) return;
    setListing(true);
    try {
      const res = await fetch("/api/v1/deposit-transfers", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ leaseId, depositAmountKes: parseFloat(depositAmount) }),
      });
      if (res.ok) {
        toast("Deposit listed for transfer. Expires in 30 days.", "success");
        setShowList(false);
        setLeaseId("");
        setDepositAmount("");
        await fetchData();
      } else {
        const err = (await res.json()) as { error: string };
        toast(err.error ?? "Failed to list deposit.", "error");
      }
    } finally {
      setListing(false);
    }
  }

  async function payDeposit(transferId: string) {
    const res = await fetch(`/api/v1/deposit-transfers?action=pay`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({ transferId }),
    });
    if (res.ok) {
      toast("Payment confirmed. Awaiting landlord approval.", "success");
      await fetchData();
    } else {
      const err = (await res.json()) as { error: string };
      toast(err.error ?? "Payment failed.", "error");
    }
  }

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Deposit Transfer</h1>
          <p className="app-page-lead">
            Transfer your deposit directly to an incoming tenant — no cash, no delays.
          </p>
        </div>
        <Button type="button" onClick={() => setShowList(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> List My Deposit
        </Button>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader><CardTitle>How It Works</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4 text-center">
            {[
              { icon: <Plus className="h-5 w-5 text-blue-600" />, step: "1", title: "List your deposit", desc: "Outgoing tenant lists the deposit amount from their signed lease." },
              { icon: <ArrowRight className="h-5 w-5 text-green-600" />, step: "2", title: "Incoming tenant pays", desc: "Incoming tenant pays via M-Pesa into platform escrow." },
              { icon: <Shield className="h-5 w-5 text-purple-600" />, step: "3", title: "Landlord approves", desc: "Landlord reviews and approves the incoming tenant." },
              { icon: <CheckCircle className="h-5 w-5 text-emerald-600" />, step: "4", title: "Funds released", desc: "After move-out inspection, deposit is released to outgoing tenant's wallet. KES 500 platform fee deducted." },
            ].map((s) => (
              <div key={s.step} className="space-y-2 rounded-lg border border-slate-100 p-4">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">{s.icon}</div>
                <p className="text-xs font-bold text-slate-500">Step {s.step}</p>
                <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400 text-center">
            Both parties must be Level 1 verified. Platform charges KES 500 facilitation fee per transfer.
            If no incoming tenant is found within 30 days, the listing expires.
          </p>
        </CardContent>
      </Card>

      {/* List deposit form */}
      {showList && (
        <Card>
          <CardHeader><CardTitle>List Your Deposit for Transfer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Lease ID</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={leaseId}
                onChange={(e) => setLeaseId(e.target.value)}
                placeholder="Your lease ID"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Deposit amount (KES)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Must match your signed lease"
              />
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              The deposit amount you enter must exactly match the amount in your signed lease on this platform.
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={listDeposit} disabled={listing || !leaseId || !depositAmount}>
                {listing ? "Listing…" : "List Deposit"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowList(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { key: "my" as const, label: "My Transfers" },
          { key: "available" as const, label: "Available Deposits" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-600 hover:text-slate-900"}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : tab === "my" ? (
        myTransfers.length ? (
          <div className="space-y-3">
            {myTransfers.map((t) => {
              const statusInfo = STATUS_LABELS[t.status] ?? { label: t.status, variant: "neutral" as const };
              const releaseAmount = Number(t.depositAmountKes) - Number(t.platformFeeKes);
              return (
                <Card key={t.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">KES {Number(t.depositAmountKes).toLocaleString()}</span>
                        <Badge variant={statusInfo.variant} className="text-[10px]">{statusInfo.label}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">Listed {new Date(t.listedAt).toLocaleDateString()} · Expires {new Date(t.expiresAt).toLocaleDateString()}</p>
                      {t.status === "RELEASED" && <p className="text-xs text-green-600">Released: KES {releaseAmount.toLocaleString()} (after KES {Number(t.platformFeeKes).toLocaleString()} fee)</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {t.status === "LISTED" && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          Awaiting incoming tenant
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-400">You have no deposit transfers listed.</p>
              <Button type="button" className="mt-4" onClick={() => setShowList(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> List My Deposit
              </Button>
            </CardContent>
          </Card>
        )
      ) : (
        availableTransfers.length ? (
          <div className="space-y-3">
            {availableTransfers.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-800">KES {Number(t.depositAmountKes).toLocaleString()} deposit</span>
                    <p className="text-xs text-slate-500">Unit: {t.unitId} · Listed {new Date(t.listedAt).toLocaleDateString()} · Expires {new Date(t.expiresAt).toLocaleDateString()}</p>
                  </div>
                  <Button type="button" size="sm" onClick={() => void payDeposit(t.id)}>
                    Pay via Escrow <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-400">No deposit transfers available in your area right now.</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
