"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { formatKes } from "@/lib/utils";

type RentInvoice = {
  id: string;
  unitId: string;
  tenantId: string;
  totalDueKes: number;
  balanceKes: number;
  dueDate: string;
  status: string;
};

const emptyInvoiceForm = {
  leaseId: "",
  tenantId: "",
  propertyId: "",
  unitId: "",
  periodStart: "",
  periodEnd: "",
  dueDate: "",
  rentAmountKes: "",
  lateFeeKes: "0",
  otherChargesKes: "0",
};

export default function RentCollectionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<RentInvoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [paying, setPaying] = useState<RentInvoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [paymentForm, setPaymentForm] = useState({
    amountKes: "",
    paymentMethod: "cash",
    mpesaReference: "",
  });

  async function load() {
    if (!user) return;
    const res = await fetch("/api/v1/rent-invoices", {
      headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
    });
    if (!res.ok) {
      setError("Unable to load rent roll.");
      return;
    }
    const json = (await res.json()) as { data: RentInvoice[] };
    setRows(json.data);
    setError(null);
  }

  useEffect(() => { void load(); }, [user]);

  async function createInvoice() {
    if (!user?.authToken) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/rent-invoices", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId: invoiceForm.leaseId,
          tenantId: invoiceForm.tenantId,
          landlordId: user.id,
          propertyId: invoiceForm.propertyId,
          unitId: invoiceForm.unitId,
          invoiceNumber: `INV-${Date.now()}`,
          periodStart: new Date(invoiceForm.periodStart).toISOString(),
          periodEnd: new Date(invoiceForm.periodEnd).toISOString(),
          dueDate: new Date(invoiceForm.dueDate).toISOString(),
          rentAmountKes: Number(invoiceForm.rentAmountKes),
          lateFeeKes: Number(invoiceForm.lateFeeKes || 0),
          otherChargesKes: Number(invoiceForm.otherChargesKes || 0),
        }),
      });
      const json = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) {
        toast(json.error ?? "Unable to create invoice.", "error");
        return;
      }
      toast("Invoice created.", "success");
      setShowInvoice(false);
      setInvoiceForm(emptyInvoiceForm);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function recordPayment() {
    if (!user?.authToken || !paying) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/rent-invoices/${paying.id}/pay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amountKes: Number(paymentForm.amountKes),
          paymentMethod: paymentForm.paymentMethod,
          mpesaReference: paymentForm.mpesaReference || undefined,
        }),
      });
      const json = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) {
        toast(json.error ?? "Unable to record payment.", "error");
        return;
      }
      toast("Payment recorded.", "success");
      setPaying(null);
      setPaymentForm({ amountKes: "", paymentMethod: "cash", mpesaReference: "" });
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Rent Collection</h1>
          <p className="app-page-lead">Payment tracking, reminders, and delinquency monitoring.</p>
        </div>
        <Button onClick={() => setShowInvoice(true)}>Create invoice</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rent Roll</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border border-surface-border px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {row.unitId} - {row.tenantId}
                  </p>
                  <p className="font-mono-data text-sm">{formatKes(row.totalDueKes)}</p>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Due {new Date(row.dueDate).toLocaleDateString()} - Status: {row.status} - Balance: {formatKes(row.balanceKes ?? row.totalDueKes)}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPaying(row);
                      setPaymentForm((f) => ({ ...f, amountKes: String(row.balanceKes ?? row.totalDueKes) }));
                    }}
                  >
                    Record payment
                  </Button>
                </div>
              </div>
            ))}
            {rows.length === 0 && !error ? (
              <p className="text-sm text-[var(--text-secondary)]">No rent invoices found.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Modal open={showInvoice} onOpenChange={setShowInvoice} title="Create rent invoice">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Lease ID", "leaseId"],
            ["Tenant ID", "tenantId"],
            ["Property ID", "propertyId"],
            ["Unit ID", "unitId"],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium">{label}</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={invoiceForm[key as keyof typeof invoiceForm]}
                onChange={(e) => setInvoiceForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-sm font-medium">Period start</label>
            <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={invoiceForm.periodStart} onChange={(e) => setInvoiceForm((f) => ({ ...f, periodStart: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Period end</label>
            <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={invoiceForm.periodEnd} onChange={(e) => setInvoiceForm((f) => ({ ...f, periodEnd: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Due date</label>
            <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm((f) => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Rent amount (KES)</label>
            <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={invoiceForm.rentAmountKes} onChange={(e) => setInvoiceForm((f) => ({ ...f, rentAmountKes: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Late fee (KES)</label>
            <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={invoiceForm.lateFeeKes} onChange={(e) => setInvoiceForm((f) => ({ ...f, lateFeeKes: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Other charges (KES)</label>
            <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={invoiceForm.otherChargesKes} onChange={(e) => setInvoiceForm((f) => ({ ...f, otherChargesKes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button variant="outline" onClick={() => setShowInvoice(false)}>Cancel</Button>
            <Button onClick={() => void createInvoice()} disabled={saving}>Create invoice</Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(paying)} onOpenChange={(open) => { if (!open) setPaying(null); }} title="Record payment">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Invoice {paying?.id}</p>
          <div>
            <label className="mb-1 block text-sm font-medium">Amount paid (KES)</label>
            <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={paymentForm.amountKes} onChange={(e) => setPaymentForm((f) => ({ ...f, amountKes: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Payment method</label>
            <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
              <option value="cash">Cash</option>
              <option value="mpesa_paybill">M-Pesa Paybill</option>
              <option value="bank_transfer_eft">Bank transfer</option>
              <option value="card">Card</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Reference</label>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={paymentForm.mpesaReference} onChange={(e) => setPaymentForm((f) => ({ ...f, mpesaReference: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setPaying(null)}>Cancel</Button>
            <Button onClick={() => void recordPayment()} disabled={saving}>Record payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
