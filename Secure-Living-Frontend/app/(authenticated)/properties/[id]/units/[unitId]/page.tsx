"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bed,
  Building2,
  Calendar,
  Clock,
  Edit2,
  KeyRound,
  Layers,
  Mail,
  MapPin,
  Phone,
  Ruler,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { formatKes } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

type Props = { params: { id: string; unitId: string } };

type UnitDetail = {
  id: string;
  propertyId: string;
  organizationId: string;
  branchId: string;
  unitNumber: string;
  unitType: string;
  category: string;
  floor: string | null;
  rentAmountKes: number | null;
  depositAmountKes: number | null;
  status: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqft: number | null;
  isFurnished: boolean;
  parkingBay: string | null;
  specialNotes: string | null;
  currentTenantId: string | null;
  currentLeaseId: string | null;
};

type LeaseDetail = {
  id: string;
  unitId: string;
  tenantUserId: string;
  leaseType: string;
  rentAmount: number;
  depositAmount: number;
  startDate: string;
  endDate: string | null;
  status: string;
  paymentFrequency: string | null;
};

type TenantUser = {
  id: string;
  fullName: string;
  email: string;
};

type ServiceRequest = {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
};

type HistoryEvent = {
  date: string;
  type: string;
  description: string;
  linkId?: string;
};

type RentPeriod = {
  periodLabel: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: string;
};

type RentHistory = {
  lease: {
    tenantName: string;
    rentAmount: number;
    startDate: string;
    endDate: string | null;
    depositHeld: number;
    status: string;
  } | null;
  periods: RentPeriod[];
  totalArrears: number;
};

type Tab = "overview" | "history" | "rent";

type EditForm = {
  unitType: string;
  category: string;
  floor: string;
  rentAmountKes: string;
  depositAmountKes: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqft: string;
  isFurnished: boolean;
  parkingBay: string;
  specialNotes: string;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  occupied: "bg-emerald-100 text-emerald-800 border-emerald-200",
  vacant: "bg-red-100 text-red-800 border-red-200",
  under_maintenance: "bg-amber-100 text-amber-800 border-amber-200",
  reserved: "bg-blue-100 text-blue-800 border-blue-200",
  unavailable: "bg-slate-100 text-slate-700 border-slate-200",
};

const CATEGORY_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  mixed_use: "Mixed Use",
};

const SERVICE_STATUS_COLORS: Record<string, string> = {
  open: "text-amber-700 bg-amber-50",
  in_progress: "text-blue-700 bg-blue-50",
  completed: "text-emerald-700 bg-emerald-50",
  cancelled: "text-slate-500 bg-slate-50",
};

const UNIT_TYPES = [
  "Bedsitter", "Studio", "1BR", "2BR", "3BR", "4BR+",
  "Penthouse", "Office", "Shop", "Warehouse", "Other",
];
const UNIT_CATEGORIES = ["residential", "commercial", "industrial"];

export default function UnitDetailPage({ params }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [lease, setLease] = useState<LeaseDetail | null>(null);
  const [tenant, setTenant] = useState<TenantUser | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rentHistory, setRentHistory] = useState<RentHistory | null>(null);
  const [rentLoading, setRentLoading] = useState(false);

  useEffect(() => {
    if (!user?.authToken) return;
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.unitId, user?.authToken]);

  useEffect(() => {
    if (activeTab === "history" && history.length === 0 && user?.authToken) {
      void loadHistory();
    }
    if (activeTab === "rent" && !rentHistory && user?.authToken) {
      void loadRentHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.authToken]);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/v1/units/${params.unitId}/history`, {
        headers: { Authorization: `Bearer ${user?.authToken ?? ""}` },
      });
      if (res.ok) {
        const j = await res.json() as { data: HistoryEvent[] };
        setHistory(j.data ?? []);
      }
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadRentHistory() {
    setRentLoading(true);
    try {
      const res = await fetch(`/api/v1/units/${params.unitId}/rent-history`, {
        headers: { Authorization: `Bearer ${user?.authToken ?? ""}` },
      });
      if (res.ok) {
        const j = await res.json() as { data: RentHistory };
        setRentHistory(j.data);
      }
    } finally {
      setRentLoading(false);
    }
  }

  async function load() {
    const headers = { Authorization: `Bearer ${user?.authToken ?? ""}` };

    const unitRes = await fetch(`/api/v1/units/${params.unitId}`, { headers });
    if (!unitRes.ok) { setError("Unit not found."); return; }
    const unitJson = (await unitRes.json()) as { data: UnitDetail };
    const u = unitJson.data;
    setUnit(u);

    if (u.currentLeaseId) {
      const leaseRes = await fetch(`/api/v1/leases/${u.currentLeaseId}`, { headers });
      if (leaseRes.ok) {
        const leaseJson = (await leaseRes.json()) as { data: LeaseDetail };
        setLease(leaseJson.data);
      }
    }

    if (u.currentTenantId) {
      const tenantRes = await fetch(`/api/v1/users/${u.currentTenantId}`, { headers });
      if (tenantRes.ok) {
        const tj = (await tenantRes.json()) as { data: TenantUser };
        setTenant(tj.data);
      }
    }

    const srRes = await fetch(`/api/v1/units/${params.unitId}/service-requests`, { headers });
    if (srRes.ok) {
      const srJson = (await srRes.json()) as { data: ServiceRequest[] };
      setRequests(srJson.data.slice(0, 5));
    }
  }

  function openEdit() {
    if (!unit) return;
    setEditForm({
      unitType: unit.unitType,
      category: unit.category,
      floor: unit.floor ?? "",
      rentAmountKes: unit.rentAmountKes?.toString() ?? "",
      depositAmountKes: unit.depositAmountKes?.toString() ?? "",
      bedrooms: unit.bedrooms?.toString() ?? "",
      bathrooms: unit.bathrooms?.toString() ?? "",
      sizeSqft: unit.sizeSqft?.toString() ?? "",
      isFurnished: unit.isFurnished,
      parkingBay: unit.parkingBay ?? "",
      specialNotes: unit.specialNotes ?? "",
      status: unit.status,
    });
    setShowEdit(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!unit || !editForm || !user?.authToken) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/units/${params.unitId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.authToken}`,
        },
        body: JSON.stringify({
          unitType: editForm.unitType,
          category: editForm.category,
          floor: editForm.floor || undefined,
          rentAmountKes: editForm.rentAmountKes ? parseFloat(editForm.rentAmountKes) : undefined,
          depositAmountKes: editForm.depositAmountKes ? parseFloat(editForm.depositAmountKes) : undefined,
          bedrooms: editForm.bedrooms ? parseInt(editForm.bedrooms) : undefined,
          bathrooms: editForm.bathrooms ? parseFloat(editForm.bathrooms) : undefined,
          sizeSqft: editForm.sizeSqft ? parseFloat(editForm.sizeSqft) : undefined,
          isFurnished: editForm.isFurnished,
          parkingBay: editForm.parkingBay || undefined,
          specialNotes: editForm.specialNotes || undefined,
          status: editForm.status,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast(err.error ?? "Failed to save changes", "error");
        return;
      }
      const json = (await res.json()) as { data: UnitDetail };
      setUnit(json.data);
      toast("Unit updated", "success");
      setShowEdit(false);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;
  if (!unit) return <div className="p-6 text-sm text-[var(--text-secondary)]">Loading unit…</div>;

  const statusColor = STATUS_COLORS[unit.status] ?? "bg-slate-100 text-slate-700 border-slate-200";
  const isVacant = unit.status === "vacant" || unit.status === "unavailable";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/properties/${params.id}`}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to property
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-brand-navy">
              Unit {unit.unitNumber}
            </h1>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor}`}>
              {unit.status.replace(/_/g, " ")}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="info">{unit.unitType}</Badge>
            <Badge variant="neutral">{CATEGORY_LABELS[unit.category] ?? unit.category}</Badge>
            {unit.floor && (
              <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                <MapPin className="h-3.5 w-3.5" /> Floor {unit.floor}
              </span>
            )}
          </div>
        </div>
        <Button type="button" variant="outline" onClick={openEdit}>
          <Edit2 className="mr-1.5 h-4 w-4" /> Edit Unit
        </Button>
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Monthly Rent</p>
          <p className="mt-1 text-xl font-bold text-brand-navy">
            {unit.rentAmountKes ? formatKes(unit.rentAmountKes) : <span className="text-slate-400 text-base">—</span>}
          </p>
        </div>
        <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Deposit</p>
          <p className="mt-1 text-xl font-bold text-brand-navy">
            {unit.depositAmountKes ? formatKes(unit.depositAmountKes) : <span className="text-slate-400 text-base">—</span>}
          </p>
        </div>
        <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Size</p>
          <p className="mt-1 text-xl font-bold text-brand-navy">
            {unit.sizeSqft ? (
              <span className="flex items-center gap-1">
                <Ruler className="h-4 w-4 text-brand-blue" /> {unit.sizeSqft} sqm
              </span>
            ) : <span className="text-slate-400 text-base">—</span>}
          </p>
        </div>
        <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Bedrooms</p>
          <p className="mt-1 text-xl font-bold text-brand-navy">
            {unit.bedrooms != null ? (
              <span className="flex items-center gap-1">
                <Bed className="h-4 w-4 text-brand-blue" /> {unit.bedrooms} bed · {unit.bathrooms ?? "—"} bath
              </span>
            ) : <span className="text-slate-400 text-base">—</span>}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {(["overview", "history", "rent"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "overview" && <Building2 className="h-4 w-4" />}
            {tab === "history" && <Clock className="h-4 w-4" />}
            {tab === "rent" && <TrendingUp className="h-4 w-4" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "history" && (
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 font-semibold text-brand-navy">Unit History</h2>
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
              </div>
            ) : history.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No history events yet.</p>
            ) : (
              <ol className="relative border-l border-slate-200 pl-6 space-y-4">
                {history.map((ev, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[1.625rem] flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <span className="h-2 w-2 rounded-full bg-brand-blue" />
                    </span>
                    <p className="text-xs text-slate-400">
                      {new Date(ev.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-800">{ev.description}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "rent" && (
        <div className="space-y-5">
          {rentLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : !rentHistory ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-slate-500">No rent data available.</CardContent>
            </Card>
          ) : (
            <>
              {rentHistory.lease && (
                <Card>
                  <CardContent className="p-5">
                    <h2 className="mb-3 font-semibold text-brand-navy">Current Lease</h2>
                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Tenant</span>
                        <span className="font-medium">{rentHistory.lease.tenantName}</span>
                      </div>
                      <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Monthly Rent</span>
                        <span className="font-medium">{formatKes(rentHistory.lease.rentAmount)}</span>
                      </div>
                      <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Lease Start</span>
                        <span className="font-medium">{new Date(rentHistory.lease.startDate).toLocaleDateString("en-KE")}</span>
                      </div>
                      <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Deposit Held</span>
                        <span className="font-medium">{formatKes(rentHistory.lease.depositHeld)}</span>
                      </div>
                    </div>
                    {rentHistory.totalArrears > 0 && (
                      <div className="mt-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                        <span className="text-sm font-semibold text-red-700">Total Arrears</span>
                        <span className="text-lg font-bold text-red-700">{formatKes(rentHistory.totalArrears)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {rentHistory.periods.length > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <h2 className="mb-3 font-semibold text-brand-navy">Payment History</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs font-medium text-slate-500">
                            <th className="pb-2 text-left">Period</th>
                            <th className="pb-2 text-right">Due</th>
                            <th className="pb-2 text-right">Paid</th>
                            <th className="pb-2 text-right">Balance</th>
                            <th className="pb-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {rentHistory.periods.map((p, i) => (
                            <tr key={i}>
                              <td className="py-2.5 text-slate-700">{p.periodLabel}</td>
                              <td className="py-2.5 text-right text-slate-700">{formatKes(p.amountDue)}</td>
                              <td className="py-2.5 text-right text-slate-700">{formatKes(p.amountPaid)}</td>
                              <td className={`py-2.5 text-right font-medium ${p.balance > 0 ? "text-red-600" : "text-slate-700"}`}>
                                {formatKes(p.balance)}
                              </td>
                              <td className="py-2.5 text-right">
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  p.status === "Paid" ? "bg-green-100 text-green-700"
                                  : p.status === "Partial" ? "bg-amber-100 text-amber-700"
                                  : p.status === "Overdue" ? "bg-red-100 text-red-700"
                                  : "bg-slate-100 text-slate-600"
                                }`}>{p.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "overview" && <>

      {/* Tenant & Lease */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="h-5 w-5 text-brand-blue" />
            <h2 className="font-semibold text-brand-navy">Tenant &amp; Lease</h2>
          </div>

          {isVacant && !lease ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-8 text-center">
              <p className="text-sm font-medium text-[var(--text-secondary)]">This unit is currently vacant</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Create a lease to assign a tenant.</p>
              <Button
                type="button"
                className="mt-4"
                size="sm"
                onClick={() => toast("Lease creation wizard coming soon", "info")}
              >
                Create Lease
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Tenant</p>
                {tenant ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-brand-navy">{tenant.fullName}</p>
                    <p className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                      <Mail className="h-3.5 w-3.5" /> {tenant.email}
                    </p>
                  </div>
                ) : unit.currentTenantId ? (
                  <p className="text-sm text-[var(--text-secondary)]">Tenant ID: {unit.currentTenantId.slice(0, 8)}…</p>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">—</p>
                )}
              </div>

              {lease && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Active Lease</p>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(lease.startDate).toLocaleDateString("en-KE")}
                      {lease.endDate ? ` → ${new Date(lease.endDate).toLocaleDateString("en-KE")}` : " (Open-ended)"}
                    </p>
                    <p className="text-[var(--text-secondary)]">Type: {lease.leaseType}</p>
                    <p className="text-[var(--text-secondary)]">Rent: {formatKes(lease.rentAmount)}/mo</p>
                    <p className="text-[var(--text-secondary)]">Deposit: {formatKes(lease.depositAmount)}</p>
                    <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 capitalize">
                      {lease.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unit Attributes */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-brand-blue" />
            <h2 className="font-semibold text-brand-navy">Unit Attributes</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-[var(--text-muted)]">Type</span>
              <span className="font-medium">{unit.unitType}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-[var(--text-muted)]">Category</span>
              <span className="font-medium">{CATEGORY_LABELS[unit.category] ?? unit.category}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-[var(--text-muted)]">Floor</span>
              <span className="font-medium">{unit.floor ?? "—"}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-[var(--text-muted)]">Furnished</span>
              <span className="font-medium">{unit.isFurnished ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-[var(--text-muted)]">Parking Bay</span>
              <span className="font-medium">{unit.parkingBay ?? "—"}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-[var(--text-muted)]">Size</span>
              <span className="font-medium">{unit.sizeSqft ? `${unit.sizeSqft} sqm` : "—"}</span>
            </div>
          </div>
          {unit.specialNotes && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="font-medium text-[var(--text-muted)]">Notes: </span>
              {unit.specialNotes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Requests */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-brand-blue" />
              <h2 className="font-semibold text-brand-navy">Recent Maintenance</h2>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/maintenance">View all</Link>
            </Button>
          </div>
          {requests.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-[var(--text-primary)]">{r.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(r.createdAt).toLocaleDateString("en-KE")}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${SERVICE_STATUS_COLORS[r.status] ?? "bg-slate-50 text-slate-600"}`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">No maintenance requests for this unit.</p>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 w-full"
            onClick={() => toast("Service request form coming soon", "info")}
          >
            <Layers className="mr-1.5 h-4 w-4" /> New Request
          </Button>
        </CardContent>
      </Card>

      {/* Contact Actions */}
      {tenant && (
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" size="sm"
            onClick={() => toast(`Email drafted to ${tenant.email}`, "info")}>
            <Mail className="mr-1.5 h-4 w-4" /> Email Tenant
          </Button>
          <Button type="button" variant="outline" size="sm"
            onClick={() => toast("WhatsApp link opened", "info")}>
            <Phone className="mr-1.5 h-4 w-4" /> WhatsApp
          </Button>
        </div>
      )}

      </>}

      {/* Edit Unit Modal */}
      <Modal
        open={showEdit}
        onOpenChange={(open) => { if (!open) setShowEdit(false); }}
        title={`Edit Unit ${unit.unitNumber}`}
      >
        {editForm && (
          <form onSubmit={(e) => { void handleSave(e); }} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Unit Type</label>
                <select
                  value={editForm.unitType}
                  onChange={(e) => setEditForm((f) => f ? { ...f, unitType: e.target.value } : f)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                >
                  {UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => f ? { ...f, category: e.target.value } : f)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                >
                  {UNIT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Floor</label>
                <input
                  value={editForm.floor}
                  onChange={(e) => setEditForm((f) => f ? { ...f, floor: e.target.value } : f)}
                  placeholder="e.g. 2, Ground, Mezzanine"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => f ? { ...f, status: e.target.value } : f)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                >
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                  <option value="under_maintenance">Under Maintenance</option>
                  <option value="reserved">Reserved</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Rent (KES/mo)</label>
                <input
                  type="number" min="0"
                  value={editForm.rentAmountKes}
                  onChange={(e) => setEditForm((f) => f ? { ...f, rentAmountKes: e.target.value } : f)}
                  placeholder="45000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Deposit (KES)</label>
                <input
                  type="number" min="0"
                  value={editForm.depositAmountKes}
                  onChange={(e) => setEditForm((f) => f ? { ...f, depositAmountKes: e.target.value } : f)}
                  placeholder="45000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Bedrooms</label>
                <input
                  type="number" min="0"
                  value={editForm.bedrooms}
                  onChange={(e) => setEditForm((f) => f ? { ...f, bedrooms: e.target.value } : f)}
                  placeholder="2"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Size (sqm)</label>
                <input
                  type="number" min="0"
                  value={editForm.sizeSqft}
                  onChange={(e) => setEditForm((f) => f ? { ...f, sizeSqft: e.target.value } : f)}
                  placeholder="85"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Parking Bay</label>
                <input
                  value={editForm.parkingBay}
                  onChange={(e) => setEditForm((f) => f ? { ...f, parkingBay: e.target.value } : f)}
                  placeholder="B12 or Visitor"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-furnished"
                checked={editForm.isFurnished}
                onChange={(e) => setEditForm((f) => f ? { ...f, isFurnished: e.target.checked } : f)}
                className="h-4 w-4 rounded border-slate-300 text-brand-blue"
              />
              <label htmlFor="edit-furnished" className="text-sm">Furnished</label>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Special Notes</label>
              <textarea
                value={editForm.specialNotes}
                onChange={(e) => setEditForm((f) => f ? { ...f, specialNotes: e.target.value } : f)}
                placeholder="e.g. Corner unit, extra window"
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
