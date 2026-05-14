"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Plus, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";


type StockItem = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  minQuantity: number;
  costPerUnit: number | null;
};

type ShortStay = { id: string; unit: { unitNumber: string } };

export default function ShortStayStockPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<ShortStay[]>([]);
  const [selectedProp, setSelectedProp] = useState("");
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", quantity: "", unit: "pcs", minQuantity: "2", costPerUnit: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.authToken) return;
    fetch(`/api/v1/short-stay`, { headers: { Authorization: `Bearer ${user?.authToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((j) => {
        if (j?.data?.length > 0) {
          setProperties(j.data);
          setSelectedProp(j.data[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [user?.authToken]);

  useEffect(() => {
    if (!selectedProp || !user?.authToken) return;
    setLoading(true);
    fetch(`/api/v1/short-stay/${selectedProp}/stock`, { headers: { Authorization: `Bearer ${user?.authToken}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (j?.data) setStock(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedProp, user?.authToken]);

  async function handleAdd() {
    if (!selectedProp) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/short-stay/${selectedProp}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          quantity: parseInt(form.quantity),
          unit: form.unit,
          minQuantity: parseInt(form.minQuantity),
          costPerUnit: form.costPerUnit ? parseFloat(form.costPerUnit) : null,
        }),
      });
      if (res.ok) {
        toast({ title: "Stock item added", variant: "success" });
        setAddOpen(false);
        setForm({ name: "", description: "", quantity: "", unit: "pcs", minQuantity: "2", costPerUnit: "" });
        // Reload stock
        const sr = await fetch(`/api/v1/short-stay/${selectedProp}/stock`, { headers: { Authorization: `Bearer ${user?.authToken}` } });
        if (sr.ok) setStock(((await sr.json()).data ?? []));
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  const lowStock = stock.filter((s) => s.quantity <= s.minQuantity);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/short-stay" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Short Stay
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Management</h1>
          <p className="mt-1 text-sm text-slate-500">Track consumables and supplies across short-stay units</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {/* Unit selector */}
      {properties.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Unit:</label>
          <select
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            value={selectedProp}
            onChange={(e) => setSelectedProp(e.target.value)}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>Unit {p.unit.unitNumber}</option>
            ))}
          </select>
        </div>
      )}

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Low stock alert</p>
            <p className="text-sm text-amber-700">
              {lowStock.map((s) => s.name).join(", ")} {lowStock.length === 1 ? "is" : "are"} at or below minimum quantity.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Package className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No short-stay properties</p>
            <p className="mt-1 text-sm text-slate-500">Add a property first from the Short Stay page</p>
          </CardContent>
        </Card>
      ) : stock.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Package className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No stock items</p>
            <p className="mt-1 text-sm text-slate-500">Add consumables like toiletries, cleaning supplies, etc.</p>
            <Button onClick={() => setAddOpen(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stock.map((item) => {
            const isLow = item.quantity <= item.minQuantity;
            return (
              <Card key={item.id} className={isLow ? "border-amber-200" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      {item.description && <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>}
                    </div>
                    {isLow && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className={`text-2xl font-bold ${isLow ? "text-amber-600" : "text-slate-900"}`}>
                        {item.quantity}
                      </p>
                      <p className="text-xs text-slate-500">{item.unit} · min {item.minQuantity}</p>
                    </div>
                    {item.costPerUnit && (
                      <p className="text-sm text-slate-500">KES {item.costPerUnit}/unit</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={addOpen} onOpenChange={setAddOpen} title="Add Stock Item">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Item Name *</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Toilet paper, Shampoo"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Quantity *</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Unit</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="pcs, rolls, bottles…"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Min Quantity</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.minQuantity}
                onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cost per Unit (KES)</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.costPerUnit}
                onChange={(e) => setForm((f) => ({ ...f, costPerUnit: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.name || !form.quantity || saving} className="flex-1">
              {saving ? "Adding…" : "Add Item"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
