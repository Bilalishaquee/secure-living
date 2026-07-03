"use client";

import { useCallback, useEffect, useState } from "react";
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

type LeaseOption = {
  id: string;
  label: string;
  tenantUserId: string;
  tenantName?: string | null;
  tenantEmail?: string | null;
  propertyId: string;
  propertyName?: string | null;
  unitId: string;
  unitNumber?: string | null;
  rentAmount: number;
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

function hasPermission(user: ReturnType<typeof useAuth>["user"], permission: string) {
  return user?.permissions?.includes("*") || user?.permissions?.includes(permission);
}

function generatePaymentReference(invoice: RentInvoice) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `PAY-${stamp}-${invoice.id.slice(0, 8).toUpperCase()}`;
}

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
    amountKes: "", paymentMethod: "cash", mpesaReference: "",
  });

  const [leases, setLeases] = useState<LeaseOption[]>([]);

  const isTenant = user?.role === "tenant";
  const canCreateInvoice = !isTenant && hasPermission(user, "lease:create");
  const canRecordPayment = !isTenant && hasPermission(user, "rent_collection:manage");
  const authHeader = useCallback(() => ({ Authorization: `Bearer ${user?.authToken ?? ""}` }), [user?.authToken]);

  const load = useCallback(async () => {
    if (!user) return;
    const res = await fetch("/api/v1/rent-invoices", { headers: authHeader() });
    if (!res.ok) { setError("Unable to load rent roll."); return; }
    const json = (await res.json()) as { data: RentInvoice[] };
    setRows(json.data);
    setError(null);
  }, [authHeader, user]);

  const loadLeases = useCallback(async () => {
    const res = await fetch("/api/v1/leases", { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as {
        data: Array<{
          id: string;
          unitId: string;
          unitNumber?: string | null;
          tenantUserId: string;
          tenantName?: string | null;
          tenantEmail?: string | null;
          propertyId: string;
          propertyName?: string | null;
          rentAmount: number;
        }>;
      };
      setLeases((json.data ?? []).map((l) => ({
        id: l.id,
        label: `${l.id.slice(0, 8)} — ${l.propertyName ?? l.propertyId.slice(0, 8)} / ${l.unitNumber ?? l.unitId.slice(0, 8)} — ${l.tenantName ?? l.tenantUserId.slice(0, 8)}`,
        tenantUserId: l.tenantUserId,
        tenantName: l.tenantName,
        tenantEmail: l.tenantEmail,
        propertyId: l.propertyId,
        propertyName: l.propertyName,
        unitId: l.unitId,
        unitNumber: l.unitNumber,
        rentAmount: l.rentAmount,
      })));
    }
  }, [authHeader]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (showInvoice) void loadLeases(); }, [showInvoice, loadLeases]);

  function updateForm(key: keyof typeof emptyInvoiceForm, value: string) {
    setInvoiceForm((f) => ({ ...f, [key]: value }));
  }

  function selectLease(leaseId: string) {
    const lease = leases.find((l) => l.id === leaseId);
    if (!lease) {
      setInvoiceForm((f) => ({ ...f, leaseId, tenantId: "", propertyId: "", unitId: "", rentAmountKes: "" }));
      return;
    }
    setInvoiceForm((f) => ({
      ...f,
      leaseId: lease.id,
      tenantId: lease.tenantUserId,
      propertyId: lease.propertyId,
      unitId: lease.unitId,
      rentAmountKes: String(lease.rentAmount),
    }));
  }

  async function createInvoice() {
    if (!user?.authToken) return;
    if (!invoiceForm.leaseId || !invoiceForm.periodStart || !invoiceForm.periodEnd || !invoiceForm.dueDate || !invoiceForm.rentAmountKes) {
      toast("Select a lease and complete the invoice dates and amount.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/rent-invoices", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId: invoiceForm.leaseId,
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
      if (!res.ok) { toast(json.error ?? "Unable to create invoice.", "error"); return; }
      toast("Invoice created.", "success");
      setShowInvoice(false);
      setInvoiceForm(emptyInvoiceForm);
      await load();
    } finally { setSaving(false); }
  }

  async function recordPayment() {
    if (!user?.authToken || !paying) return;
    if (Number(paymentForm.amountKes) <= 0) {
      toast("Enter an amount greater than zero.", "error");
      return;
    }
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
      if (!res.ok) { toast(json.error ?? "Unable to record payment.", "error"); return; }
      toast("Payment recorded.", "success");
      setPaying(null);
      setPaymentForm({ amountKes: "", paymentMethod: "cash", mpesaReference: "" });
      await load();
    } finally { setSaving(false); }
  }

  const selectedLease = leases.find((l) => l.id === invoiceForm.leaseId);
  const canSubmitInvoice = Boolean(
    invoiceForm.leaseId &&
      invoiceForm.periodStart &&
      invoiceForm.periodEnd &&
      invoiceForm.dueDate &&
      Number(invoiceForm.rentAmountKes) >= 0 &&
      !saving
  );

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">{isTenant ? "Payments" : "Rent Collection"}</h1>
          <p className="app-page-lead">
            {isTenant ? "View your rent invoices, due dates, and payment status." : "Payment tracking, reminders, and delinquency monitoring."}
          </p>
        </div>
        {canCreateInvoice ? (
          <Button onClick={() => setShowInvoice(true)}>Create invoice</Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rent Roll</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className={`rounded-lg border px-3 py-2 ${
                  row.status === "paid"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-surface-border bg-white"
                }`}
              >
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
                  {canRecordPayment && (row.balanceKes ?? row.totalDueKes) > 0 ? (
                    <Button
                      size="sm" variant="outline"
                      onClick={() => {
                        setPaying(row);
                        setPaymentForm({
                          amountKes: String(row.balanceKes ?? row.totalDueKes),
                          paymentMethod: "cash",
                          mpesaReference: generatePaymentReference(row),
                        });
                      }}
                    >
                      Record payment
                    </Button>
                  ) : row.status === "paid" ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Paid
                    </span>
                  ) : null}
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
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Lease *</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={invoiceForm.leaseId}
              onChange={(e) => selectLease(e.target.value)}
            >
              <option value="">Select lease...</option>
              {leases.map((lease) => (
                <option key={lease.id} value={lease.id}>{lease.label}</option>
              ))}
            </select>
          </div>

          <ReadonlyField label="Tenant" value={selectedLease ? `${selectedLease.tenantName ?? selectedLease.tenantUserId}${selectedLease.tenantEmail ? ` — ${selectedLease.tenantEmail}` : ""}` : "Select a lease"} />
          <ReadonlyField label="Property" value={selectedLease ? `${selectedLease.propertyName ?? selectedLease.propertyId}` : "Select a lease"} />
          <ReadonlyField label="Unit" value={selectedLease ? `${selectedLease.unitNumber ?? selectedLease.unitId}` : "Select a lease"} />
          <ReadonlyField label="Lease ID" value={invoiceForm.leaseId || "Select a lease"} mono />

          <div>
            <label className="mb-1 block text-sm font-medium">Period start</label>
            <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={invoiceForm.periodStart} onChange={(e) => updateForm("periodStart", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Period end</label>
            <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={invoiceForm.periodEnd} onChange={(e) => updateForm("periodEnd", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Due date</label>
            <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={invoiceForm.dueDate} onChange={(e) => updateForm("dueDate", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Rent amount (KES)</label>
            <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={invoiceForm.rentAmountKes} onChange={(e) => updateForm("rentAmountKes", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Late fee (KES)</label>
            <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={invoiceForm.lateFeeKes} onChange={(e) => updateForm("lateFeeKes", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Other charges (KES)</label>
            <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={invoiceForm.otherChargesKes} onChange={(e) => updateForm("otherChargesKes", e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button variant="outline" onClick={() => setShowInvoice(false)}>Cancel</Button>
            <Button onClick={() => void createInvoice()} disabled={!canSubmitInvoice}>Create invoice</Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(paying)} onOpenChange={(open) => { if (!open) setPaying(null); }} title="Record payment">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Invoice {paying?.id}</p>
          <div>
            <label className="mb-1 block text-sm font-medium">Amount paid (KES)</label>
            <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={paymentForm.amountKes} onChange={(e) => setPaymentForm((f) => ({ ...f, amountKes: e.target.value }))} />
            {paying ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Balance: {formatKes(paying.balanceKes ?? paying.totalDueKes)}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPaymentForm((f) => ({ ...f, amountKes: String(paying.balanceKes ?? paying.totalDueKes) }))}
                >
                  Select full balance
                </Button>
              </div>
            ) : null}
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
            <input
              className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-mono text-sm font-semibold text-emerald-800"
              value={paymentForm.mpesaReference}
              readOnly
            />
            <p className="mt-1 text-xs text-emerald-700">Reference is generated automatically by the system.</p>
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

function ReadonlyField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <div className={`min-h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}
