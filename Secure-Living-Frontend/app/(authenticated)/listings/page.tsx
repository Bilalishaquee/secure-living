"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Plus, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatKes } from "@/lib/utils";


const STATUS_TABS = ["All", "DRAFT", "PUBLISHED", "UNDER_OFFER", "LET", "WITHDRAWN"];

const STATUS_COLORS: Record<string, string> = {
  DRAFT:       "bg-slate-100 text-slate-700",
  PUBLISHED:   "bg-green-100 text-green-700",
  UNDER_OFFER: "bg-blue-100 text-blue-700",
  LET:         "bg-purple-100 text-purple-700",
  WITHDRAWN:   "bg-red-100 text-red-700",
};

type Listing = {
  id: string;
  title: string;
  rentAmount: number;
  currency: string;
  status: string;
  availableFrom: string;
  publishedAt: string | null;
  createdAt: string;
  unit: { unitNumber: string; unitType: string; bedrooms: number | null };
  _count: { applications: number };
};

export default function ListingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [vacantUnits, setVacantUnits] = useState<Array<{ id: string; unitNumber: string; propertyId: string }>>([]);
  const [form, setForm] = useState({ unitId: "", title: "", rentAmount: "", availableFrom: "", leaseDuration: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/listings`, {
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        const j = await res.json();
        setListings(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadVacantUnits() {
    const res = await fetch(`/api/v1/units?status=vacant`, {
      headers: { Authorization: `Bearer ${user?.authToken}` },
    });
    if (res.ok) {
      const j = await res.json();
      setVacantUnits(j.data ?? []);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  const filtered = activeTab === "All" ? listings : listings.filter((l) => l.status === activeTab);

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({
          unitId: form.unitId,
          title: form.title,
          rentAmount: parseFloat(form.rentAmount),
          availableFrom: form.availableFrom,
          leaseDuration: form.leaseDuration || undefined,
        }),
      });
      if (res.ok) {
        const j = await res.json();
        toast({ title: "Listing created", variant: "success" });
        setCreateOpen(false);
        router.push(`/listings/${j.data.id}`);
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed to create", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage rental listings for vacant units</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); loadVacantUnits(); }} className="gap-2">
          <Plus className="h-4 w-4" /> Create Listing
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            {tab === "All" ? `All (${listings.length})` : `${tab} (${listings.filter((l) => l.status === tab).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Megaphone className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No listings</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => {
            const sc = STATUS_COLORS[l.status] ?? "bg-slate-100 text-slate-700";
            return (
              <Card
                key={l.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => router.push(`/listings/${l.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-slate-900 line-clamp-2">{l.title}</h3>
                    <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${sc}`}>{l.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Unit {l.unit?.unitNumber} · {l.unit?.unitType}
                    {l.unit?.bedrooms ? ` · ${l.unit.bedrooms} bed` : ""}
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatKes(l.rentAmount)} <span className="text-sm font-normal text-slate-500">/mo</span>
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>From {new Date(l.availableFrom).toLocaleDateString()}</span>
                    <span>{l._count.applications} application{l._count.applications !== 1 ? "s" : ""}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Create Listing">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Unit *</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.unitId}
              onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
            >
              <option value="">Select vacant unit…</option>
              {vacantUnits.map((u) => (
                <option key={u.id} value={u.id}>Unit {u.unitNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Listing Title *</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Spacious 2BR in Westlands"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Monthly Rent (KES) *</label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.rentAmount}
                onChange={(e) => setForm((f) => ({ ...f, rentAmount: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Available From *</label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.availableFrom}
                onChange={(e) => setForm((f) => ({ ...f, availableFrom: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lease Duration</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="e.g. 12 months, Monthly"
              value={form.leaseDuration}
              onChange={(e) => setForm((f) => ({ ...f, leaseDuration: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!form.unitId || !form.title || !form.rentAmount || !form.availableFrom || saving}
              className="flex-1"
            >
              {saving ? "Creating…" : "Create Listing"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
