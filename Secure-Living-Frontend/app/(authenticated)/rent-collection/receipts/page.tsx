"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { formatKes } from "@/lib/utils";
import { Plus } from "lucide-react";

type RentReceipt = {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  tenantId: string;
  landlordId: string;
  propertyId: string;
  unitId: string;
  amountKes: number;
  paymentMethod: string;
  mpesaReference: string | null;
  bankReference: string | null;
  receiptDate: string;
  deliveryChannel: string | null;
  pdfUrl: string | null;
  notes: string | null;
};

const PAYMENT_METHODS = [
  { value: "M_PESA", label: "M-Pesa" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CARD", label: "Card" },
];

const DELIVERY_CHANNELS = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "pdf", label: "PDF" },
  { value: "print", label: "Print" },
];

export default function RentReceiptsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<RentReceipt[]>([]);
  const [filterInvoice, setFilterInvoice] = useState("");
  const [filterTenant, setFilterTenant] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState({
    invoiceId: "",
    tenantId: "",
    landlordId: user?.id ?? "",
    propertyId: "",
    unitId: "",
    amountKes: "",
    paymentMethod: "M_PESA",
    mpesaReference: "",
    deliveryChannel: "email",
  });
  const [saving, setSaving] = useState(false);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadReceipts() {
    if (!user) return;
    const params = new URLSearchParams();
    if (filterInvoice) params.set("invoiceId", filterInvoice);
    if (filterTenant) params.set("tenantId", filterTenant);
    const res = await fetch(`/api/v1/rent-receipts?${params.toString()}`, { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: RentReceipt[] };
      setReceipts(json.data ?? []);
    } else {
      setReceipts([]);
    }
  }

  useEffect(() => {
    void loadReceipts();
  }, [user, filterInvoice, filterTenant]);

  async function handleGenerate() {
    if (!user) return;
    if (!genForm.invoiceId || !genForm.tenantId || !genForm.propertyId || !genForm.unitId || !genForm.amountKes) {
      toast("All fields are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/rent-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          invoiceId: genForm.invoiceId,
          tenantId: genForm.tenantId,
          landlordId: genForm.landlordId || user.id,
          propertyId: genForm.propertyId,
          unitId: genForm.unitId,
          amountKes: parseFloat(genForm.amountKes),
          paymentMethod: genForm.paymentMethod,
          mpesaReference: genForm.mpesaReference || undefined,
          deliveryChannel: genForm.deliveryChannel,
        }),
      });
      if (res.ok) {
        toast("Receipt generated.", "success");
        setShowGenerate(false);
        setGenForm({ invoiceId: "", tenantId: "", landlordId: user.id, propertyId: "", unitId: "", amountKes: "", paymentMethod: "M_PESA", mpesaReference: "", deliveryChannel: "email" });
        await loadReceipts();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to generate receipt.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<RentReceipt>[] = [
    { key: "receiptNumber", header: "Receipt #", sortable: true },
    { key: "tenantId", header: "Tenant", render: (r) => r.tenantId.slice(0, 8) },
    { key: "amountKes", header: "Amount", render: (r) => formatKes(r.amountKes) },
    { key: "paymentMethod", header: "Method" },
    {
      key: "receiptDate",
      header: "Date",
      render: (r) => new Date(r.receiptDate).toLocaleDateString(),
    },
    {
      key: "deliveryChannel",
      header: "Delivered",
      render: (r) => r.deliveryChannel ? <Badge variant="success">{r.deliveryChannel}</Badge> : "—",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Rent Receipts</h1>
          <p className="app-page-lead">View and generate rent payment receipts.</p>
        </div>
        <Button onClick={() => setShowGenerate(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Generate Receipt
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Receipts</CardTitle>
            <div className="flex gap-2">
              <input
                placeholder="Filter by invoice ID"
                value={filterInvoice}
                onChange={(e) => setFilterInvoice(e.target.value)}
                className="w-48 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
              <input
                placeholder="Filter by tenant ID"
                value={filterTenant}
                onChange={(e) => setFilterTenant(e.target.value)}
                className="w-48 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable data={receipts} columns={columns} rowKey={(r) => r.id} />
        </CardContent>
      </Card>

      <Modal open={showGenerate} onOpenChange={setShowGenerate} title="Generate Rent Receipt">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Invoice ID *</label>
              <input value={genForm.invoiceId} onChange={(e) => setGenForm((f) => ({ ...f, invoiceId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Tenant ID *</label>
              <input value={genForm.tenantId} onChange={(e) => setGenForm((f) => ({ ...f, tenantId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Property ID *</label>
              <input value={genForm.propertyId} onChange={(e) => setGenForm((f) => ({ ...f, propertyId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Unit ID *</label>
              <input value={genForm.unitId} onChange={(e) => setGenForm((f) => ({ ...f, unitId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Amount (KES) *</label>
              <input type="number" value={genForm.amountKes} onChange={(e) => setGenForm((f) => ({ ...f, amountKes: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Payment Method</label>
              <Select value={genForm.paymentMethod} onValueChange={(v) => setGenForm((f) => ({ ...f, paymentMethod: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">M-Pesa Reference</label>
              <input value={genForm.mpesaReference} onChange={(e) => setGenForm((f) => ({ ...f, mpesaReference: e.target.value }))} placeholder="M-Pesa transaction ID" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Delivery Channel</label>
              <Select value={genForm.deliveryChannel} onValueChange={(v) => setGenForm((f) => ({ ...f, deliveryChannel: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_CHANNELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
            <Button onClick={() => { void handleGenerate(); }} disabled={saving}>
              {saving ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
