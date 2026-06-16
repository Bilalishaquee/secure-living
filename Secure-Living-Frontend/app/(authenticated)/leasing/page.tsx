"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FilePlus, FileText, Home, Calendar, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { formatKes } from "@/lib/utils";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

type Lease = {
  id: string;
  propertyId: string;
  unitId: string;
  tenantUserId: string;
  leaseType: string;
  rentAmount: number;
  depositAmount: number;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "neutral" | "info"> = {
  active:      "success",
  draft:       "neutral",
  pending:     "warning",
  terminated:  "error",
  expired:     "neutral",
};

const LEASE_TYPES = ["fixed_term", "month_to_month"] as const;
const PAYMENT_FREQS = ["monthly", "quarterly"] as const;

export default function LeasingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    propertyId: "",
    unitId: "",
    tenantUserId: "",
    leaseType: "fixed_term",
    rentAmount: "",
    depositAmount: "",
    startDate: "",
    endDate: "",
    paymentFrequency: "monthly",
  });

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadLeases() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/leases", { headers: authHeader() });
      if (!res.ok) { setError("Unable to load leases."); return; }
      const json = (await res.json()) as { data: Lease[] };
      setLeases(json.data ?? []);
      setError(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadLeases(); }, [user]);

  async function handleCreate() {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/leases", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          organizationId: user.organizationId,
          branchId: user.branchId,
          propertyId: form.propertyId,
          unitId: form.unitId,
          tenantUserId: form.tenantUserId,
          leaseType: form.leaseType,
          rentAmount: parseFloat(form.rentAmount),
          depositAmount: form.depositAmount ? parseFloat(form.depositAmount) : 0,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          paymentFrequency: form.paymentFrequency,
        }),
      });
      if (res.ok) {
        toast("Lease created successfully.", "success");
        setShowCreate(false);
        setForm({ propertyId: "", unitId: "", tenantUserId: "", leaseType: "fixed_term", rentAmount: "", depositAmount: "", startDate: "", endDate: "", paymentFrequency: "monthly" });
        await loadLeases();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to create lease.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const active = leases.filter((l) => l.status === "active").length;
  const draft = leases.filter((l) => l.status === "draft").length;
  const expiringSoon = leases.filter((l) => {
    const end = new Date(l.endDate);
    const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30 && l.status === "active";
  }).length;

  const columns: Column<Lease>[] = [
    {
      key: "unitId",
      header: "Property / Unit",
      sortable: true,
      render: (r) => (
        <div>
          <Link href={`/properties/${r.propertyId}`} className="text-sm font-medium text-blue-600 hover:underline">
            {r.propertyId.slice(0, 8)}…
          </Link>
          <p className="text-xs text-slate-400">{r.unitId.slice(0, 8)}…</p>
        </div>
      ),
    },
    {
      key: "tenantUserId",
      header: "Tenant",
      render: (r) => (
        <Link href={`/tenants/${r.tenantUserId}`} className="text-sm font-medium text-slate-700 hover:underline">
          {r.tenantUserId.slice(0, 12)}…
        </Link>
      ),
    },
    {
      key: "leaseType",
      header: "Type",
      render: (r) => <span className="capitalize text-xs">{r.leaseType.replace(/_/g, " ")}</span>,
    },
    {
      key: "rentAmount",
      header: "Rent / mo",
      sortable: true,
      render: (r) => <span className="font-mono text-sm font-medium">{formatKes(r.rentAmount)}</span>,
    },
    {
      key: "startDate",
      header: "Start",
      render: (r) => <span className="text-xs text-slate-500">{new Date(r.startDate).toLocaleDateString("en-GB")}</span>,
    },
    {
      key: "endDate",
      header: "End",
      render: (r) => {
        const end = new Date(r.endDate);
        const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return (
          <span className={`text-xs ${diff >= 0 && diff <= 30 ? "font-semibold text-amber-600" : "text-slate-500"}`}>
            {end.toLocaleDateString("en-GB")}
            {diff >= 0 && diff <= 30 && " ⚠"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={STATUS_VARIANT[r.status] ?? "neutral"}>{r.status}</Badge>
      ),
    },
    {
      key: "id",
      header: "",
      render: (r) => (
        <Button size="sm" variant="outline" asChild>
          <Link href={`/leasing/${r.id}`}>
            <FileText className="h-3.5 w-3.5" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Leasing</h1>
          <p className="app-page-lead">Lease pipeline, active agreements, and signing lifecycle.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/leasing/templates">
              <FileText className="mr-1.5 h-4 w-4" /> Templates
            </Link>
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <FilePlus className="mr-1.5 h-4 w-4" /> New Lease
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: leases.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active", value: active, icon: Home, color: "text-green-600", bg: "bg-green-50" },
          { label: "Draft", value: draft, icon: Calendar, color: "text-slate-500", bg: "bg-slate-50" },
          { label: "Expiring ≤30 days", value: expiringSoon, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Leases</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <p className="p-4 text-sm text-red-600">{error}</p>
          ) : (
            <DataTable data={leases} columns={columns} rowKey={(r) => r.id} />
          )}
        </CardContent>
      </Card>

      {/* Create Lease Modal */}
      <Modal open={showCreate} onOpenChange={setShowCreate} title="New Lease">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Property ID *</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Property ID"
                value={form.propertyId}
                onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Unit ID *</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Unit ID"
                value={form.unitId}
                onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tenant User ID *</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Tenant's user ID"
              value={form.tenantUserId}
              onChange={(e) => setForm((f) => ({ ...f, tenantUserId: e.target.value }))}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Lease Type</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.leaseType}
                onChange={(e) => setForm((f) => ({ ...f, leaseType: e.target.value }))}
              >
                {LEASE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Payment Frequency</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.paymentFrequency}
                onChange={(e) => setForm((f) => ({ ...f, paymentFrequency: e.target.value }))}
              >
                {PAYMENT_FREQS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Monthly Rent (KES) *</label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="e.g. 45000"
                value={form.rentAmount}
                onChange={(e) => setForm((f) => ({ ...f, rentAmount: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Deposit (KES)</label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="e.g. 90000"
                value={form.depositAmount}
                onChange={(e) => setForm((f) => ({ ...f, depositAmount: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Date *</label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End Date *</label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={() => { void handleCreate(); }}
              disabled={!form.propertyId || !form.unitId || !form.tenantUserId || !form.rentAmount || !form.startDate || !form.endDate || saving}
            >
              {saving ? "Creating…" : "Create Lease"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
