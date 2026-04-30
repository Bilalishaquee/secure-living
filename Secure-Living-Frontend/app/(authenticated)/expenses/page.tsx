"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { SlideOver } from "@/components/ui/SlideOver";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { formatKes } from "@/lib/utils";

type Property = { id: string; name: string; organizationId: string; branchId: string };
type Expense = {
  id: string;
  organizationId: string;
  branchId: string;
  propertyId: string;
  unitId: string | null;
  category: string;
  description: string;
  amountKes: number;
  date: string;
  vendorName: string | null;
  receiptUrl: string | null;
  paymentMethod: string | null;
  isRecurring: boolean;
  recurringFreq: string | null;
  notes: string | null;
  createdBy: string;
};

const CATEGORIES = ["mortgage", "insurance", "tax", "maintenance", "utilities", "management_fee", "hoa", "renovation", "other"] as const;

export default function ExpensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [rows, setRows] = useState<Expense[]>([]);
  const [filters, setFilters] = useState({ propertyId: "", category: "", dateFrom: "", dateTo: "" });
  const [openCreate, setOpenCreate] = useState(false);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [form, setForm] = useState({
    propertyId: "",
    unitId: "",
    category: "maintenance",
    description: "",
    amountKes: "",
    date: new Date().toISOString().slice(0, 10),
    vendorName: "",
    receiptUrl: "",
    paymentMethod: "",
    isRecurring: false,
    recurringFreq: "monthly",
    notes: "",
  });

  async function loadProperties() {
    if (!user?.id) return;
    const res = await fetch("/api/v1/properties", { headers: { Authorization: `Bearer ${user.authToken ?? ""}` } });
    if (!res.ok) return;
    const json = (await res.json()) as { data: Property[] };
    setProperties(json.data);
    if (!form.propertyId && json.data[0]) {
      setForm((f) => ({ ...f, propertyId: json.data[0].id }));
    }
  }

  async function loadExpenses() {
    if (!user?.id) return;
    const q = new URLSearchParams();
    if (filters.propertyId) q.set("propertyId", filters.propertyId);
    if (filters.category) q.set("category", filters.category);
    if (filters.dateFrom) q.set("dateFrom", new Date(filters.dateFrom).toISOString());
    if (filters.dateTo) q.set("dateTo", new Date(filters.dateTo).toISOString());
    const res = await fetch(`/api/v1/expenses?${q.toString()}`, { headers: { Authorization: `Bearer ${user.authToken ?? ""}` } });
    if (!res.ok) {
      toast("Failed to load expenses", "error");
      return;
    }
    const json = (await res.json()) as { data: Expense[] };
    setRows(json.data);
  }

  useEffect(() => {
    void loadProperties();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    void loadExpenses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, filters.propertyId, filters.category, filters.dateFrom, filters.dateTo]);

  const propertyNameById = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p.name])),
    [properties]
  );

  async function onSave() {
    if (!user?.id) return;
    const prop = properties.find((p) => p.id === form.propertyId);
    if (!prop) {
      toast("Select a property", "error");
      return;
    }
    const res = await fetch("/api/v1/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.authToken ?? ""}`,
      },
      body: JSON.stringify({
        organizationId: prop.organizationId,
        branchId: prop.branchId,
        propertyId: form.propertyId,
        unitId: form.unitId || undefined,
        category: form.category,
        description: form.description,
        amountKes: Number(form.amountKes),
        date: new Date(form.date).toISOString(),
        vendorName: form.vendorName || undefined,
        receiptUrl: form.receiptUrl || undefined,
        paymentMethod: form.paymentMethod || undefined,
        isRecurring: form.isRecurring,
        recurringFreq: form.isRecurring ? form.recurringFreq : undefined,
        notes: form.notes || undefined,
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({ error: "Failed to log expense" }))) as { error?: string };
      toast(j.error ?? "Failed to log expense", "error");
      return;
    }
    toast("Expense logged", "success");
    setOpenCreate(false);
    setForm((f) => ({ ...f, description: "", amountKes: "", vendorName: "", receiptUrl: "", paymentMethod: "", notes: "" }));
    await loadExpenses();
  }

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Expenses</h1>
          <p className="app-page-lead">Track operating and capital expenses in KES.</p>
        </div>
        <Button onClick={() => setOpenCreate(true)}>+ Log Expense</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={filters.propertyId} onChange={(e) => setFilters((f) => ({ ...f, propertyId: e.target.value }))}>
            <option value="">All Properties</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} />
          <input type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Property</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Description</th>
                  <th className="px-2 py-2">Vendor</th>
                  <th className="px-2 py-2 text-right">Amount</th>
                  <th className="px-2 py-2">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50/70" onClick={() => setSelected(row)}>
                    <td className="px-2 py-3">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="px-2 py-3">{propertyNameById[row.propertyId] ?? row.propertyId}</td>
                    <td className="px-2 py-3"><Badge variant="info">{row.category}</Badge></td>
                    <td className="px-2 py-3">{row.description}</td>
                    <td className="px-2 py-3">{row.vendorName ?? "—"}</td>
                    <td className="px-2 py-3 text-right font-medium">{formatKes(row.amountKes)}</td>
                    <td className="px-2 py-3">{row.receiptUrl ? <FileText className="h-4 w-4 text-brand-blue" /> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length ? <p className="pt-4 text-sm text-[var(--text-secondary)]">No expenses found.</p> : null}
        </CardContent>
      </Card>

      <Modal open={openCreate} onOpenChange={setOpenCreate} title="Log Expense">
        <div className="space-y-3">
          <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.propertyId} onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Amount (KES)" value={form.amountKes} onChange={(e) => setForm((f) => ({ ...f, amountKes: e.target.value }))} />
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Vendor Name" value={form.vendorName} onChange={(e) => setForm((f) => ({ ...f, vendorName: e.target.value }))} />
          <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Receipt URL" value={form.receiptUrl} onChange={(e) => setForm((f) => ({ ...f, receiptUrl: e.target.value }))} />
          <textarea className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} placeholder="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))} />
            Is recurring
          </label>
          {form.isRecurring ? (
            <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.recurringFreq} onChange={(e) => setForm((f) => ({ ...f, recurringFreq: e.target.value }))}>
              <option value="monthly">monthly</option>
              <option value="quarterly">quarterly</option>
              <option value="annual">annual</option>
            </select>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button onClick={() => { void onSave(); }}>Save</Button>
          </div>
        </div>
      </Modal>

      <SlideOver open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }} title="Expense Details">
        {selected ? (
          <div className="space-y-2 text-sm">
            <p><strong>Property:</strong> {propertyNameById[selected.propertyId] ?? selected.propertyId}</p>
            <p><strong>Date:</strong> {new Date(selected.date).toLocaleString()}</p>
            <p><strong>Category:</strong> {selected.category}</p>
            <p><strong>Description:</strong> {selected.description}</p>
            <p><strong>Vendor:</strong> {selected.vendorName ?? "—"}</p>
            <p><strong>Amount:</strong> {formatKes(selected.amountKes)}</p>
            <p><strong>Payment method:</strong> {selected.paymentMethod ?? "—"}</p>
            <p><strong>Recurring:</strong> {selected.isRecurring ? `Yes (${selected.recurringFreq ?? "set"})` : "No"}</p>
            <p><strong>Notes:</strong> {selected.notes ?? "—"}</p>
            {selected.receiptUrl ? (
              <a className="text-brand-blue underline" href={selected.receiptUrl} target="_blank" rel="noreferrer">
                Open receipt
              </a>
            ) : null}
          </div>
        ) : null}
      </SlideOver>
    </div>
  );
}
