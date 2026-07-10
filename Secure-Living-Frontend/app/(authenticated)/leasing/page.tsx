"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus, FileText, Home, Calendar, DollarSign, Search, UserCheck } from "lucide-react";
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
  depositModel: string;
  depositEscrow?: {
    healthStatus: string;
    currentBalance: number;
    walletWatchActive: boolean;
    status: string;
  } | null;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  tenantName: string | null;
  tenantEmail: string | null;
  propertyName: string | null;
  unitNumber: string | null;
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
  const router = useRouter();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showUploadPicker, setShowUploadPicker] = useState(false);
  const [uploadSearch, setUploadSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<Array<{ id: string; name: string; propertyCode?: string | null }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; unitNumber: string; status: string }>>([]);
  const [tenantQuery, setTenantQuery] = useState("");
  const [tenantOptions, setTenantOptions] = useState<Array<{ id: string; name: string; email: string; status?: string }>>([]);
  const [tenantFocus, setTenantFocus] = useState(false);
  const tenantWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tenantFocus || !user?.authToken || tenantQuery.trim().length < 2) { setTenantOptions([]); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/v1/users?q=${encodeURIComponent(tenantQuery)}&limit=10`, { headers: authHeader() });
      if (res.ok) {
        const json = (await res.json()) as { data: Array<{ id: string; name: string; email: string; status?: string }> };
        setTenantOptions(json.data ?? []);
      }
    }, 200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantQuery, tenantFocus, user?.authToken]);

  const [form, setForm] = useState({
    propertyId: "",
    unitId: "",
    tenantUserId: "",
    leaseType: "fixed_term",
    rentAmount: "",
    depositAmount: "",
    depositModel: "LANDLORD_RESERVE",
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

  async function loadProperties() {
    const res = await fetch("/api/v1/properties", { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: Array<{ id: string; name: string; propertyCode?: string | null }> };
      setProperties(json.data ?? []);
    }
  }

  async function loadUnits(propertyId: string) {
    if (!propertyId) { setUnits([]); return; }
    const res = await fetch(`/api/v1/units?propertyId=${encodeURIComponent(propertyId)}`, { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: Array<{ id: string; unitNumber: string; status: string }> };
      setUnits(json.data ?? []);
    }
  }

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
          ...(form.unitId ? { unitId: form.unitId } : {}),
          tenantUserId: form.tenantUserId,
          leaseType: form.leaseType,
          rentAmount: parseFloat(form.rentAmount),
          depositAmount: form.depositAmount ? parseFloat(form.depositAmount) : 0,
          depositModel: form.depositModel,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          paymentFrequency: form.paymentFrequency,
        }),
      });
      if (res.ok) {
        const j = (await res.json()) as { data: { id: string } };
        toast("Lease created successfully. Redirecting to lease detail…", "success");
        setShowCreate(false);
        setForm({ propertyId: "", unitId: "", tenantUserId: "", leaseType: "fixed_term", rentAmount: "", depositAmount: "", depositModel: "LANDLORD_RESERVE", startDate: "", endDate: "", paymentFrequency: "monthly" });
        setTenantQuery("");
        setTenantOptions([]);
        setTenantFocus(false);
        setUnits([]);
        router.push(`/leasing/${j.data.id}`);
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

  const filteredUploadLeases = useMemo(() => {
    const q = uploadSearch.trim().toLowerCase();
    const list = q
      ? leases.filter((l) => [l.id, l.unitId, l.tenantUserId].some((v) => v.toLowerCase().includes(q)))
      : leases;
    return list.slice(0, 20);
  }, [leases, uploadSearch]);

  const columns: Column<Lease>[] = [
    {
      key: "unitId",
      header: "Property / Unit",
      sortable: true,
      render: (r) => (
        <div>
          <Link href={`/properties/${r.propertyId}`} className="text-sm font-medium text-blue-600 hover:underline">
            {r.propertyName ?? r.propertyId.slice(0, 8) + "…"}
          </Link>
          <p className="text-xs text-slate-400">{r.unitNumber ? `Unit ${r.unitNumber}` : r.unitId ? r.unitId.slice(0, 8) + "…" : "No unit"}</p>
        </div>
      ),
    },
    {
      key: "tenantUserId",
      header: "Tenant",
      render: (r) => (
        <div className="text-right">
          <Link href={`/tenants/${r.tenantUserId}`} className="text-sm font-medium text-slate-700 hover:underline">
            {r.tenantName ?? r.tenantUserId.slice(0, 12) + "…"}
          </Link>
          {r.tenantEmail && <p className="text-xs text-slate-400">{r.tenantEmail}</p>}
        </div>
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
      key: "depositModel",
      header: "Deposit",
      render: (r) => {
        const health = r.depositEscrow?.healthStatus ?? "fully_covered";
        const color = health === "shortfall" ? "error" : health === "at_risk" ? "warning" : "success";
        return (
          <div className="space-y-1">
            <Badge variant={r.depositModel === "DEPOSIT_ESCROW" ? "info" : "neutral"}>
              {r.depositModel === "DEPOSIT_ESCROW" ? "Escrow" : "Reserve"}
            </Badge>
            <div>
              <Badge variant={color} className="text-[10px]">
                {health.replace(/_/g, " ")}
              </Badge>
            </div>
            {r.depositEscrow?.walletWatchActive ? <p className="text-[10px] text-amber-600">Wallet Watch</p> : null}
          </div>
        );
      },
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
          <Button variant="outline" onClick={() => { setUploadSearch(""); setShowUploadPicker(true); }}>
            <FilePlus className="mr-1.5 h-4 w-4" /> Upload Lease
          </Button>
          <Button onClick={() => { setShowCreate(true); setTenantFocus(false); setTenantQuery(""); setTenantOptions([]); void loadProperties(); }}>
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
      <Modal open={showCreate} onOpenChange={(open) => { if (!open) { setTenantFocus(false); setTenantQuery(""); setTenantOptions([]); } setShowCreate(open); }} title="New Lease">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Property *</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.propertyId}
                onChange={(e) => {
                  const propertyId = e.target.value;
                  setForm((f) => ({ ...f, propertyId, unitId: "" }));
                  void loadUnits(propertyId);
                }}
              >
                <option value="">Select property...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}{p.propertyCode ? ` (${p.propertyCode})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Unit</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.unitId}
                onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
                disabled={!form.propertyId}
              >
                <option value="">None (property-level lease)</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>Unit {u.unitNumber} - {u.status}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">Leave as "None" to create a lease for the entire property (no specific unit).</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Deposit Handling Model</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={form.depositModel}
              onChange={(e) => setForm((f) => ({ ...f, depositModel: e.target.value }))}
            >
              <option value="LANDLORD_RESERVE">Model A - Landlord Reserve</option>
              <option value="DEPOSIT_ESCROW">Model B2 - Deposit Escrow + Top-Ups</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Deposit Escrow enables the Escrow Badge. Landlord Reserve enables wallet health monitoring and Wallet Watch.
            </p>
          </div>

          <div ref={tenantWrapRef}>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tenant *</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                placeholder="Search tenant by name, email, phone, or ID"
                value={tenantQuery}
                onChange={(e) => setTenantQuery(e.target.value)}
                onFocus={() => setTenantFocus(true)}
                onBlur={() => setTimeout(() => setTenantFocus(false), 250)}
                autoComplete="off"
              />
              {tenantFocus && tenantQuery.length >= 2 && tenantOptions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {tenantOptions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-blue-50 ${form.tenantUserId === t.id ? "bg-blue-50 text-blue-700" : ""}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setForm((f) => ({ ...f, tenantUserId: t.id })); setTenantQuery(`${t.name} - ${t.email}`); setTenantOptions([]); setTenantFocus(false); }}
                    >
                      <UserCheck className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-medium truncate">{t.name}</span>
                        <span className="block text-xs text-slate-500 truncate">{t.email}</span>
                      </div>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${t.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {t.status ?? "unknown"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {tenantFocus && tenantQuery.length >= 2 && tenantOptions.length === 0 && (
                <p className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-lg">
                  No users found.
                </p>
              )}
            </div>
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
            <Button variant="outline" onClick={() => { setShowCreate(false); setTenantFocus(false); setTenantQuery(""); setTenantOptions([]); }}>Cancel</Button>
            <Button
              onClick={() => { void handleCreate(); }}
              disabled={!form.propertyId || !form.tenantUserId || !form.rentAmount || !form.startDate || !form.endDate || saving}
            >
              {saving ? "Creating…" : "Create Lease"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Lease Modal — pick a lease, then upload its signed document on its detail page */}
      <Modal open={showUploadPicker} onOpenChange={setShowUploadPicker} title="Upload Lease Document">
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Select the lease you want to attach a signed document to.</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={uploadSearch}
              onChange={(e) => setUploadSearch(e.target.value)}
              placeholder="Search by lease ID, unit, or tenant…"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {filteredUploadLeases.length === 0 ? (
              <p className="px-1 py-4 text-center text-sm text-slate-400">No leases found.</p>
            ) : (
              filteredUploadLeases.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => { setShowUploadPicker(false); router.push(`/leasing/${l.id}`); }}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span className="truncate">
                    <span className="font-medium text-slate-800">{l.unitId}</span>
                    <span className="ml-2 font-mono text-xs text-slate-400">{l.id}</span>
                  </span>
                  <Badge variant={STATUS_VARIANT[l.status] ?? "neutral"}>{l.status}</Badge>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
