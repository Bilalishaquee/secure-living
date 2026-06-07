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

type HouseholdCharge = {
  id: string;
  unitId: string;
  propertyId: string;
  name: string;
  amountKes: number;
  billingMethod: string;
  isLinkedToRent: boolean;
};

const BILLING_METHODS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ONE_TIME", label: "One Time" },
  { value: "PER_UNIT", label: "Per Unit" },
];

export default function HouseholdChargesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [charges, setCharges] = useState<HouseholdCharge[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ unitId: "", propertyId: "", name: "", amountKes: "", billingMethod: "MONTHLY", isLinkedToRent: true });
  const [saving, setSaving] = useState(false);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadCharges() {
    if (!user) return;
    const params = selectedUnit !== "ALL" ? `?unitId=${selectedUnit}` : "";
    const res = await fetch(`/api/v1/utilities/household-charges${params}`, { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: HouseholdCharge[] };
      setCharges(json.data ?? []);
      const uniqueUnits = Array.from(new Set((json.data ?? []).map((c) => c.unitId)));
      setUnits(uniqueUnits);
    } else {
      setCharges([]);
    }
  }

  useEffect(() => {
    void loadCharges();
  }, [user, selectedUnit]);

  async function handleAdd() {
    if (!user) return;
    if (!form.unitId || !form.propertyId || !form.name || !form.amountKes) {
      toast("All fields are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/utility-household-charges", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          unitId: form.unitId,
          propertyId: form.propertyId,
          name: form.name,
          amountKes: parseFloat(form.amountKes),
          billingMethod: form.billingMethod,
          isLinkedToRent: form.isLinkedToRent,
        }),
      });
      if (res.ok) {
        toast("Charge added.", "success");
        setShowAdd(false);
        setForm({ unitId: "", propertyId: "", name: "", amountKes: "", billingMethod: "MONTHLY", isLinkedToRent: true });
        await loadCharges();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to add charge.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<HouseholdCharge>[] = [
    { key: "unitId", header: "Unit", sortable: true, render: (r) => r.unitId.slice(0, 8) },
    { key: "name", header: "Charge Name", sortable: true },
    { key: "amountKes", header: "Amount", render: (r) => formatKes(r.amountKes) },
    { key: "billingMethod", header: "Billing Method" },
    {
      key: "isLinkedToRent",
      header: "Linked to Rent",
      render: (r) => r.isLinkedToRent ? <Badge variant="info">Yes</Badge> : <Badge variant="neutral">No</Badge>,
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Utility Household Charges</h1>
          <p className="app-page-lead">Manage utility charges per household or unit.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Charge
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Household Charges</CardTitle>
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--text-secondary)]">Filter by unit:</label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Units</SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u} value={u}>{u.slice(0, 12)}</SelectItem>
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

      <Modal open={showAdd} onOpenChange={setShowAdd} title="Add Household Charge">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Unit ID *</label>
              <input value={form.unitId} onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Property ID *</label>
              <input value={form.propertyId} onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Charge Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Garbage Collection" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Amount (KES) *</label>
              <input type="number" value={form.amountKes} onChange={(e) => setForm((f) => ({ ...f, amountKes: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Billing Method</label>
              <Select value={form.billingMethod} onValueChange={(v) => setForm((f) => ({ ...f, billingMethod: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isLinkedToRent} onChange={(e) => setForm((f) => ({ ...f, isLinkedToRent: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-brand-blue" />
            Link to rent invoice
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => { void handleAdd(); }} disabled={saving}>
              {saving ? "Saving..." : "Add Charge"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
