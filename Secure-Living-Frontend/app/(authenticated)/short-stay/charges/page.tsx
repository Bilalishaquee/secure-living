"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { formatKes } from "@/lib/utils";
import { Plus } from "lucide-react";

type ShortStayCharge = {
  id: string;
  shortStayId: string;
  name: string;
  description: string | null;
  amountKes: number;
  chargeType: string;
  isOptional: boolean;
  isRefundable: boolean;
};

const CHARGE_TYPES = [
  { value: "fixed", label: "Fixed" },
  { value: "percentage", label: "Percentage" },
  { value: "seasonal", label: "Seasonal" },
  { value: "optional", label: "Optional" },
];

export default function ShortStayChargesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [charges, setCharges] = useState<ShortStayCharge[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ shortStayId: "", name: "", description: "", amountKes: "", chargeType: "fixed", isOptional: false, isRefundable: false });
  const [saving, setSaving] = useState(false);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadProperties() {
    if (!user) return;
    const propRes = await fetch("/api/v1/short-stay", { headers: authHeader() });
    if (propRes.ok) {
      const j = await propRes.json();
      setProperties(j.data ?? []);
    }
  }

  async function loadCharges() {
    if (!user) return;
    const params = selectedProperty !== "ALL" ? `?shortStayId=${selectedProperty}` : "";
    const res = await fetch(`/api/v1/short-stay/charges${params}`, { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: ShortStayCharge[] };
      setCharges(json.data ?? []);
    } else {
      setCharges([]);
    }
  }

  useEffect(() => {
    void loadProperties();
  }, [user]);

  useEffect(() => {
    void loadCharges();
  }, [user, selectedProperty]);

  async function handleAdd() {
    if (!user || !form.shortStayId || !form.name || !form.amountKes) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/short-stay/charges", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          shortStayId: form.shortStayId,
          name: form.name,
          description: form.description || undefined,
          amountKes: parseFloat(form.amountKes),
          chargeType: form.chargeType,
          isOptional: form.isOptional,
          isRefundable: form.isRefundable,
        }),
      });
      if (res.ok) {
        toast("Charge added.", "success");
        setShowAdd(false);
        setForm({ shortStayId: "", name: "", description: "", amountKes: "", chargeType: "fixed", isOptional: false, isRefundable: false });
        await loadCharges();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to add charge.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<ShortStayCharge>[] = [
    { key: "shortStayId", header: "Property", sortable: true, render: (r) => r.shortStayId.slice(0, 8) },
    { key: "name", header: "Charge", sortable: true },
    { key: "amountKes", header: "Amount", render: (r) => formatKes(r.amountKes) },
    { key: "chargeType", header: "Type" },
    {
      key: "isOptional",
      header: "Optional",
      render: (r) => r.isOptional ? <Badge variant="warning">Optional</Badge> : <Badge variant="success">Required</Badge>,
    },
    {
      key: "isRefundable",
      header: "Refundable",
      render: (r) => r.isRefundable ? <Badge variant="info">Yes</Badge> : <Badge variant="neutral">No</Badge>,
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Short Stay Other Charges</h1>
          <p className="app-page-lead">Manage additional charges for short stay properties.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Charge
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Charges</CardTitle>
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--text-secondary)]">Filter by property:</label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Properties</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name || p.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable data={charges} columns={columns} rowKey={(r) => r.id} />
        </CardContent>
      </Card>

      <Modal open={showAdd} onOpenChange={setShowAdd} title="Add Short Stay Charge">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Property *</label>
            <Select value={form.shortStayId} onValueChange={(v) => setForm((f) => ({ ...f, shortStayId: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name || p.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Charge Name *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Cleaning Fee" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Description</label>
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Amount (KES) *</label>
            <input type="number" value={form.amountKes} onChange={(e) => setForm((f) => ({ ...f, amountKes: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Charge Type</label>
            <Select value={form.chargeType} onValueChange={(v) => setForm((f) => ({ ...f, chargeType: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHARGE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isOptional} onChange={(e) => setForm((f) => ({ ...f, isOptional: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-brand-blue" />
              Optional (guest can opt out)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isRefundable} onChange={(e) => setForm((f) => ({ ...f, isRefundable: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-brand-blue" />
              Refundable
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => { void handleAdd(); }} disabled={!form.shortStayId || !form.name || !form.amountKes || saving}>
              {saving ? "Saving..." : "Add Charge"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
