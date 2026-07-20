"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Receipt, Smartphone } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatKes } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

type RentInvoice = {
  id: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  totalDueKes: number;
  amountPaidKes: number;
  balanceKes: number;
  status: string;
  paidAt: string | null;
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "neutral"> = {
  paid:     "success",
  sent:     "neutral",
  pending:  "warning",
  overdue:  "error",
};

type StkState =
  | { step: "idle" }
  | { step: "sending" }
  | { step: "waiting"; checkoutRequestId: string }
  | { step: "success" }
  | { step: "failed"; reason: string };

export default function TenantPaymentSchedulePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const leaseId = searchParams.get("leaseId");
  const [invoices, setInvoices] = useState<RentInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState<RentInvoice | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [stk, setStk] = useState<StkState>({ step: "idle" });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadInvoices() {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const url = leaseId ? `/api/v1/rent-invoices?leaseId=${leaseId}` : "/api/v1/rent-invoices";
      const res = await fetch(url, { headers: { Authorization: `Bearer ${user.authToken}` } });
      if (res.ok) {
        const json = (await res.json()) as { data: RentInvoice[] };
        setInvoices(json.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.authToken, leaseId]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  function openPayModal(inv: RentInvoice) {
    setPayingInvoice(inv);
    setPhoneNumber("");
    setStk({ step: "idle" });
  }

  async function sendStkPush() {
    if (!payingInvoice || !user?.authToken) return;
    setStk({ step: "sending" });
    try {
      const res = await fetch("/api/v1/payments/daraja/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.authToken}` },
        body: JSON.stringify({ invoiceId: payingInvoice.id, phoneNumber }),
      });
      const json = (await res.json()) as { data?: { checkoutRequestId: string }; error?: string };
      if (!res.ok || !json.data) {
        setStk({ step: "failed", reason: json.error ?? "Could not start the M-Pesa payment." });
        return;
      }
      const checkoutRequestId = json.data.checkoutRequestId;
      setStk({ step: "waiting", checkoutRequestId });

      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts += 1;
        const statusRes = await fetch(`/api/v1/payments/daraja/stk-push/${checkoutRequestId}`, {
          headers: { Authorization: `Bearer ${user.authToken}` },
        });
        if (statusRes.ok) {
          const statusJson = (await statusRes.json()) as { data: { status: string; resultDesc?: string } };
          if (statusJson.data.status === "success") {
            if (pollRef.current) clearInterval(pollRef.current);
            setStk({ step: "success" });
            void loadInvoices();
            return;
          }
          if (statusJson.data.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setStk({ step: "failed", reason: statusJson.data.resultDesc ?? "Payment was not completed." });
            return;
          }
        }
        if (attempts >= 20) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStk({ step: "failed", reason: "No confirmation received yet. Check your phone, or try again." });
        }
      }, 3000);
    } catch {
      setStk({ step: "failed", reason: "Could not reach the payment service." });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tenant/lease"><ArrowLeft className="mr-1 h-4 w-4" /> My Lease</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment Schedule</h1>
        <p className="mt-1 text-sm text-slate-500">Rent invoices for your lease — due dates, amounts, and payment status.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Receipt className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No invoices yet</p>
            <p className="mt-1 text-sm text-slate-500">Your rent invoices will appear here once generated.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Due Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Amount Due</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(inv.periodStart).toLocaleDateString("en-GB")} – {new Date(inv.periodEnd).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{new Date(inv.dueDate).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatKes(inv.totalDueKes)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatKes(inv.balanceKes)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[inv.status] ?? "neutral"}>{inv.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.balanceKes > 0 ? (
                        <Button size="sm" onClick={() => openPayModal(inv)}>
                          <Smartphone className="mr-1 h-4 w-4" /> Pay with M-Pesa
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Modal
        open={Boolean(payingInvoice)}
        onOpenChange={(open) => { if (!open) { if (pollRef.current) clearInterval(pollRef.current); setPayingInvoice(null); } }}
        title="Pay with M-Pesa"
        description={payingInvoice ? `Invoice ${payingInvoice.invoiceNumber} — balance ${formatKes(payingInvoice.balanceKes)}` : undefined}
      >
        {stk.step === "idle" || stk.step === "sending" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">M-Pesa phone number</label>
              <input
                type="tel"
                placeholder="e.g. 0712345678"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">You&apos;ll receive an M-Pesa prompt on this number to approve the payment.</p>
            </div>
            <Button className="w-full" disabled={stk.step === "sending" || phoneNumber.trim().length < 9} onClick={() => void sendStkPush()}>
              {stk.step === "sending" ? "Sending prompt…" : "Send M-Pesa prompt"}
            </Button>
          </div>
        ) : stk.step === "waiting" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
            <p className="text-sm font-medium text-slate-700">Check your phone and enter your M-Pesa PIN to complete the payment.</p>
            <p className="text-xs text-slate-500">Waiting for confirmation…</p>
          </div>
        ) : stk.step === "success" ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-lg font-semibold text-emerald-600">Payment received</p>
            <p className="text-sm text-slate-500">Your invoice has been updated.</p>
            <Button className="mt-2" onClick={() => setPayingInvoice(null)}>Done</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm font-medium text-red-600">{stk.reason}</p>
            <Button variant="secondary" className="mt-2" onClick={() => setStk({ step: "idle" })}>Try again</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
