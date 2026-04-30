"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Calendar,
  Hammer,
  Layers,
  Mail,
  MessageSquare,
  Plus,
  ToggleLeft,
  ToggleRight,
  Wallet,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { formatKes } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

type Props = { params: { id: string } };

type PropertyDetail = {
  id?: string;
  name?: string;
  addressLine1?: string;
  photosCsv?: string;
  marketRentEstimateKes?: number;
  propertyType?: string;
  category?: string;
  managementMode?: string;
  totalUnits?: number;
  status?: string;
  organizationId?: string;
  branchId?: string;
  purchasePriceKes?: number;
  acquisitionDate?: string;
  currentValueKes?: number;
  noiEstimateKes?: number;
  capRateEstimate?: number;
  propertyTaxAnnualKes?: number;
  insuranceProvider?: string;
  insurancePremiumAnnualKes?: number;
  insuranceExpiryDate?: string;
  hoaFeeMonthlyKes?: number;
  mortgageLender?: string;
  mortgageInterestRate?: number;
  mortgageMonthlyPaymentKes?: number;
  mortgageMaturityDate?: string;
  mortgageBalanceKes?: number;
  totalSqft?: number;
  lotSizeSqft?: number;
  totalBathrooms?: number;
  totalParkingSpaces?: number;
  yearBuilt?: number;
  descriptionNotes?: string;
};

type UnitRow = {
  id: string;
  unitNumber: string;
  unitType: string;
  category: string;
  floor: string | null;
  rentAmountKes: number | null;
  depositAmountKes: number | null;
  status: string;
  currentTenantId: string | null;
  isFurnished: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqft: number | null;
  parkingBay: string | null;
  specialNotes: string | null;
};

const UNIT_STATUS_COLORS: Record<string, string> = {
  occupied: "bg-emerald-100 border-emerald-300 text-emerald-800",
  vacant: "bg-red-100 border-red-300 text-red-800",
  under_maintenance: "bg-amber-100 border-amber-300 text-amber-800",
  reserved: "bg-blue-100 border-blue-300 text-blue-800",
  unavailable: "bg-slate-100 border-slate-300 text-slate-600",
};

const CATEGORY_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  mixed_use: "Mixed Use",
};

const MANAGEMENT_MODE_LABELS: Record<string, { label: string; color: string }> = {
  self_managed: { label: "Self-Managed", color: "bg-sky-100 text-sky-800 border-sky-200" },
  full_service: { label: "Full Service", color: "bg-purple-100 text-purple-800 border-purple-200" },
};

const UNIT_TYPES = [
  "Bedsitter", "Studio", "1BR", "2BR", "3BR", "4BR+",
  "Penthouse", "Office", "Shop", "Warehouse", "Other",
];

const UNIT_CATEGORIES = ["residential", "commercial", "industrial"];

type AddUnitForm = {
  unitNumber: string;
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

const EMPTY_FORM: AddUnitForm = {
  unitNumber: "",
  unitType: "1BR",
  category: "residential",
  floor: "",
  rentAmountKes: "",
  depositAmountKes: "",
  bedrooms: "",
  bathrooms: "",
  sizeSqft: "",
  isFurnished: false,
  parkingBay: "",
  specialNotes: "",
  status: "vacant",
};

type BulkForm = {
  unitType: string;
  category: string;
  startingIdentifier: string;
  count: string;
  floor: string;
  rentAmountKes: string;
  depositAmountKes: string;
  bedrooms: string;
  sizeSqft: string;
  isFurnished: boolean;
  parkingIncluded: boolean;
  status: string;
};

const EMPTY_BULK: BulkForm = {
  unitType: "1BR",
  category: "residential",
  startingIdentifier: "A1",
  count: "10",
  floor: "",
  rentAmountKes: "",
  depositAmountKes: "",
  bedrooms: "",
  sizeSqft: "",
  isFurnished: false,
  parkingIncluded: false,
  status: "vacant",
};

export default function PropertyDetailPage({ params }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showModeSwitch, setShowModeSwitch] = useState(false);
  const [form, setForm] = useState<AddUnitForm>(EMPTY_FORM);
  const [bulk, setBulk] = useState<BulkForm>(EMPTY_BULK);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const res = await fetch(`/api/v1/properties/${params.id}`, {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (!res.ok) { setError("Property not found."); return; }
      const json = (await res.json()) as { data: PropertyDetail };
      setProperty(json.data);
    })();
  }, [params.id, user?.id, user?.authToken]);

  useEffect(() => {
    if (!user?.id || !property) return;
    void loadUnits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property, user?.id]);

  async function loadUnits() {
    const res = await fetch(`/api/v1/properties/${params.id}/units`, {
      headers: { Authorization: `Bearer ${user?.authToken ?? ""}` },
    });
    if (!res.ok) return;
    const json = (await res.json()) as { data: UnitRow[] };
    setUnits(json.data);
  }

  async function handleAddUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !property) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/properties/${params.id}/units`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.authToken ?? ""}`,
        },
        body: JSON.stringify({
          organizationId: property.organizationId,
          branchId: property.branchId,
          propertyId: params.id,
          unitNumber: form.unitNumber,
          unitType: form.unitType,
          category: form.category,
          floor: form.floor || undefined,
          rentAmountKes: form.rentAmountKes ? parseFloat(form.rentAmountKes) : undefined,
          depositAmountKes: form.depositAmountKes ? parseFloat(form.depositAmountKes) : undefined,
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
          bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : undefined,
          sizeSqft: form.sizeSqft ? parseFloat(form.sizeSqft) : undefined,
          isFurnished: form.isFurnished,
          parkingBay: form.parkingBay || undefined,
          specialNotes: form.specialNotes || undefined,
          status: form.status,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast(err.error ?? "Failed to create unit", "error");
        return;
      }
      toast(`Unit ${form.unitNumber} created`, "success");
      setShowAddUnit(false);
      setForm(EMPTY_FORM);
      await loadUnits();
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !property) return;
    const count = parseInt(bulk.count, 10);
    if (isNaN(count) || count < 1 || count > 200) {
      toast("Count must be between 1 and 200", "error");
      return;
    }
    if (!bulk.startingIdentifier.trim()) {
      toast("Starting identifier is required", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/properties/${params.id}/units/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.authToken ?? ""}`,
        },
        body: JSON.stringify({
          organizationId: property.organizationId,
          branchId: property.branchId,
          unitType: bulk.unitType,
          category: bulk.category,
          startingIdentifier: bulk.startingIdentifier.trim(),
          count,
          floor: bulk.floor || undefined,
          rentAmountKes: bulk.rentAmountKes ? parseFloat(bulk.rentAmountKes) : undefined,
          depositAmountKes: bulk.depositAmountKes ? parseFloat(bulk.depositAmountKes) : undefined,
          bedrooms: bulk.bedrooms ? parseInt(bulk.bedrooms) : undefined,
          sizeSqft: bulk.sizeSqft ? parseFloat(bulk.sizeSqft) : undefined,
          isFurnished: bulk.isFurnished,
          parkingIncluded: bulk.parkingIncluded,
          status: bulk.status,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast(err.error ?? "Bulk creation failed", "error");
        return;
      }
      const json = (await res.json()) as { count: number };
      toast(`${json.count} units created successfully`, "success");
      setShowBulkAdd(false);
      setBulk(EMPTY_BULK);
      await loadUnits();
    } finally {
      setSaving(false);
    }
  }

  async function handleModeSwitch(newMode: string) {
    if (!user?.id || !property) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/properties/${params.id}/management-mode`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.authToken ?? ""}`,
        },
        body: JSON.stringify({ mode: newMode }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast(err.error ?? "Mode switch failed", "error");
        return;
      }
      const json = (await res.json()) as { data: { managementMode: string } };
      setProperty((p) => p ? { ...p, managementMode: json.data.managementMode } : p);
      toast(`Switched to ${newMode === "full_service" ? "Full Service" : "Self-Managed"} mode`, "success");
      setShowModeSwitch(false);
    } finally {
      setSaving(false);
    }
  }

  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;
  if (!property) return <div className="p-6 text-sm text-[var(--text-secondary)]">Loading property…</div>;

  const modeInfo = MANAGEMENT_MODE_LABELS[property.managementMode ?? "self_managed"];
  const filteredUnits = categoryFilter === "all"
    ? units
    : units.filter((u) => u.category === categoryFilter);

  const unitCategories = Array.from(new Set(units.map((u) => u.category)));
  const showCategoryFilter = unitCategories.length > 1 || property.category === "mixed_use";

  const occupiedCount = units.filter((u) => u.status === "occupied").length;
  const vacantCount = units.filter((u) => u.status === "vacant").length;
  const maintenanceCount = units.filter((u) => u.status === "under_maintenance").length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2 shrink-0">
        <Link href="/properties">← Back to properties</Link>
      </Button>

      {/* Header */}
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 shadow-[0_16px_48px_rgb(var(--rgb-ink)_/_0.1)] ring-1 ring-white/80 backdrop-blur-sm">
          <Image
            src={String(property.photosCsv || "/images/property/properties-banner.jpg").split(",")[0] || "/images/property/properties-banner.jpg"}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>
        <div className="min-w-0 space-y-4">
          <div>
            <h1 className="app-page-title">{property.name}</h1>
            <p className="app-page-lead">{String(property.addressLine1 || "")}</p>
            <p className="mt-3 text-lg font-semibold">
              {property.marketRentEstimateKes
                ? `${formatKes(Number(property.marketRentEstimateKes))}/mo est.`
                : "No rent estimate"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="success">{String(property.propertyType || "-")}</Badge>
              <Badge variant="info">
                {CATEGORY_LABELS[property.category ?? "residential"] ?? property.category}
              </Badge>
              <Badge variant="warning">Units: {String(property.totalUnits ?? units.length)}</Badge>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${modeInfo.color}`}
              >
                {modeInfo.label}
              </span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline" className="justify-start"
              onClick={() => toast("Property editor opened", "info")}>
              Edit details
            </Button>
            <Button type="button" variant="outline" className="justify-start" asChild>
              <Link href="/tenants">
                <Mail className="h-4 w-4" aria-hidden /> Message tenants
              </Link>
            </Button>
            <Button type="button" variant="secondary" className="justify-start"
              onClick={() => toast("Inspection scheduled — coordinator will confirm", "success")}>
              <Calendar className="h-4 w-4" aria-hidden /> Schedule inspection
            </Button>
            <Button type="button" variant="outline" className="justify-start"
              onClick={() => toast("Work order draft created", "success")}>
              <Hammer className="h-4 w-4" aria-hidden /> Request repair
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={() => setShowModeSwitch(true)}
            >
              {property.managementMode === "self_managed" ? (
                <ToggleLeft className="h-4 w-4" aria-hidden />
              ) : (
                <ToggleRight className="h-4 w-4 text-purple-600" aria-hidden />
              )}
              {property.managementMode === "self_managed" ? "Upgrade to Full Service" : "Switch to Self-Managed"}
            </Button>
            <Button type="button" className="justify-start" asChild>
              <Link href="/transactions">
                <Wallet className="h-4 w-4" aria-hidden /> Escrow &amp; transactions
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Unit Overview — Gap 5 */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-navy">Unit Overview</h2>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              {occupiedCount} occupied · {vacantCount} vacant
              {maintenanceCount > 0 ? ` · ${maintenanceCount} maintenance` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showCategoryFilter && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-[var(--text-primary)] shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              >
                <option value="all">All categories</option>
                {unitCategories.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
                ))}
              </select>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowBulkAdd(true)}>
              <Layers className="mr-1.5 h-4 w-4" aria-hidden /> Bulk Add
            </Button>
            <Button size="sm" onClick={() => setShowAddUnit(true)}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden /> Add Unit
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-400" />Occupied</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-400" />Vacant</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-400" />Maintenance</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-400" />Reserved</span>
        </div>

        {filteredUnits.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {filteredUnits.map((unit) => (
              <div
                key={unit.id}
                className={`rounded-xl border-2 p-3 transition-shadow hover:shadow-md ${UNIT_STATUS_COLORS[unit.status] ?? "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="text-base font-bold">{unit.unitNumber}</p>
                  {unit.status === "under_maintenance" && (
                    <Wrench className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-label="Under maintenance" />
                  )}
                </div>
                <p className="text-xs font-medium opacity-80">{unit.unitType}</p>
                {unit.category !== (property.category ?? "residential") && (
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide opacity-60">
                    {CATEGORY_LABELS[unit.category] ?? unit.category}
                  </p>
                )}
                {unit.floor && (
                  <p className="mt-1 text-xs opacity-70">Floor {unit.floor}</p>
                )}
                {unit.rentAmountKes ? (
                  <p className="mt-1 text-xs font-medium">{formatKes(unit.rentAmountKes)}/mo</p>
                ) : null}
                <p className="mt-1 capitalize text-[11px] font-semibold opacity-90">
                  {unit.status.replace(/_/g, " ")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
            <p className="text-sm text-[var(--text-secondary)]">No units yet.</p>
            <div className="mt-3 flex justify-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowBulkAdd(true)}>
                <Layers className="mr-1.5 h-4 w-4" /> Bulk Add Units
              </Button>
              <Button size="sm" onClick={() => setShowAddUnit(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Add first unit
              </Button>
            </div>
          </div>
        )}
      </section>

      <details className="rounded-xl border border-surface-border bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">Financial Details</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
          <p>Purchase Price: {property.purchasePriceKes ? formatKes(property.purchasePriceKes) : "—"}</p>
          <p>Acquisition Date: {property.acquisitionDate ? new Date(property.acquisitionDate).toLocaleDateString() : "—"}</p>
          <p>Current Value: {property.currentValueKes ? formatKes(property.currentValueKes) : "—"}</p>
          <p>Market Rent Estimate: {property.marketRentEstimateKes ? formatKes(property.marketRentEstimateKes) : "—"}</p>
          <p>NOI Estimate: {property.noiEstimateKes ? formatKes(property.noiEstimateKes) : "—"}</p>
          <p>Cap Rate: {property.capRateEstimate ?? "—"}%</p>
          <p>Annual Property Tax: {property.propertyTaxAnnualKes ? formatKes(property.propertyTaxAnnualKes) : "—"}</p>
          <p>Insurance: {property.insuranceProvider ? `${property.insuranceProvider} (${formatKes(property.insurancePremiumAnnualKes ?? 0)})` : "—"}</p>
          <p>Insurance Expiry: {property.insuranceExpiryDate ? new Date(property.insuranceExpiryDate).toLocaleDateString() : "—"}</p>
          <p>HOA Fee / month: {property.hoaFeeMonthlyKes ? formatKes(property.hoaFeeMonthlyKes) : "—"}</p>
        </div>
        {property.mortgageLender ? (
          <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm">
            <p className="font-medium">Mortgage</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <p>Lender: {property.mortgageLender}</p>
              <p>Interest Rate: {property.mortgageInterestRate ?? "—"}%</p>
              <p>Monthly Payment: {property.mortgageMonthlyPaymentKes ? formatKes(property.mortgageMonthlyPaymentKes) : "—"}</p>
              <p>Maturity Date: {property.mortgageMaturityDate ? new Date(property.mortgageMaturityDate).toLocaleDateString() : "—"}</p>
              <p>Balance: {property.mortgageBalanceKes ? formatKes(property.mortgageBalanceKes) : "—"}</p>
            </div>
          </div>
        ) : null}
      </details>

      <details className="rounded-xl border border-surface-border bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">Physical Details</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
          <p>Total Sqft: {property.totalSqft ?? "—"}</p>
          <p>Lot Size Sqft: {property.lotSizeSqft ?? "—"}</p>
          <p>Bathrooms (property): {property.totalBathrooms ?? "—"}</p>
          <p>Parking Spaces: {property.totalParkingSpaces ?? "—"}</p>
          <p>Year Built: {property.yearBuilt ?? "—"}</p>
          <p>Description: {property.descriptionNotes ?? "—"}</p>
        </div>
      </details>

      {/* Escrow schedule card */}
      <Card className="bg-gradient-to-r from-slate-50/90 to-escrow/40">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
              <MessageSquare className="h-5 w-5 text-brand-blue" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-brand-navy">Need help with this property?</p>
              <p className="text-sm text-[var(--text-secondary)]">
                Chat with portfolio support or open a field ticket.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm"
              onClick={() => toast("Support chat connected", "success")}>
              Live chat
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/services">Services</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Single Unit Modal */}
      <Modal
        open={showAddUnit}
        onOpenChange={(open) => { if (!open) { setShowAddUnit(false); setForm(EMPTY_FORM); } }}
        title="Add New Unit"
      >
        <form onSubmit={(e) => { void handleAddUnit(e); }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Unit Number <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.unitNumber}
                onChange={(e) => setForm((f) => ({ ...f, unitNumber: e.target.value }))}
                placeholder="e.g. A1, Shop 2"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Unit Type</label>
              <select
                value={form.unitType}
                onChange={(e) => setForm((f) => ({ ...f, unitType: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              >
                {UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
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
                value={form.floor}
                onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                placeholder="e.g. 2, Ground, Mezzanine"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Rent (KES/mo)</label>
              <input
                type="number" min="0"
                value={form.rentAmountKes}
                onChange={(e) => setForm((f) => ({ ...f, rentAmountKes: e.target.value }))}
                placeholder="45000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Deposit (KES)</label>
              <input
                type="number" min="0"
                value={form.depositAmountKes}
                onChange={(e) => setForm((f) => ({ ...f, depositAmountKes: e.target.value }))}
                placeholder="45000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Bedrooms</label>
              <input
                type="number" min="0"
                value={form.bedrooms}
                onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))}
                placeholder="2"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Size (sqm)</label>
              <input
                type="number" min="0"
                value={form.sizeSqft}
                onChange={(e) => setForm((f) => ({ ...f, sizeSqft: e.target.value }))}
                placeholder="85"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Parking Bay</label>
              <input
                value={form.parkingBay}
                onChange={(e) => setForm((f) => ({ ...f, parkingBay: e.target.value }))}
                placeholder="B12 or Visitor"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              >
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="reserved">Reserved</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="furnished"
              checked={form.isFurnished}
              onChange={(e) => setForm((f) => ({ ...f, isFurnished: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/40"
            />
            <label htmlFor="furnished" className="text-sm text-[var(--text-primary)]">Furnished</label>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Special Notes</label>
            <textarea
              value={form.specialNotes}
              onChange={(e) => setForm((f) => ({ ...f, specialNotes: e.target.value }))}
              placeholder="e.g. Corner unit, extra window"
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline"
              onClick={() => { setShowAddUnit(false); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Add Unit"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Add Units Modal */}
      <Modal
        open={showBulkAdd}
        onOpenChange={(open) => { if (!open) { setShowBulkAdd(false); setBulk(EMPTY_BULK); } }}
        title="Bulk Add Units"
      >
        <form onSubmit={(e) => { void handleBulkAdd(e); }} className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Create multiple identical units from a template. Each unit can be edited individually after creation.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Starting Identifier <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={bulk.startingIdentifier}
                onChange={(e) => setBulk((b) => ({ ...b, startingIdentifier: e.target.value }))}
                placeholder="e.g. A1, B10, 101"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                &quot;A1&quot; → A1, A2, A3… · &quot;101&quot; → 101, 102, 103…
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Number of Units <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number" min="1" max="200"
                value={bulk.count}
                onChange={(e) => setBulk((b) => ({ ...b, count: e.target.value }))}
                placeholder="10"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Unit Type</label>
              <select
                value={bulk.unitType}
                onChange={(e) => setBulk((b) => ({ ...b, unitType: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              >
                {UNIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Category</label>
              <select
                value={bulk.category}
                onChange={(e) => setBulk((b) => ({ ...b, category: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              >
                {UNIT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Floor (optional)</label>
              <input
                value={bulk.floor}
                onChange={(e) => setBulk((b) => ({ ...b, floor: e.target.value }))}
                placeholder="e.g. 2 (applies to all units)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Rent KES/mo</label>
              <input
                type="number" min="0"
                value={bulk.rentAmountKes}
                onChange={(e) => setBulk((b) => ({ ...b, rentAmountKes: e.target.value }))}
                placeholder="45000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Deposit (KES)</label>
              <input
                type="number" min="0"
                value={bulk.depositAmountKes}
                onChange={(e) => setBulk((b) => ({ ...b, depositAmountKes: e.target.value }))}
                placeholder="45000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Bedrooms</label>
              <input
                type="number" min="0"
                value={bulk.bedrooms}
                onChange={(e) => setBulk((b) => ({ ...b, bedrooms: e.target.value }))}
                placeholder="2"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Size (sqm)</label>
              <input
                type="number" min="0"
                value={bulk.sizeSqft}
                onChange={(e) => setBulk((b) => ({ ...b, sizeSqft: e.target.value }))}
                placeholder="85"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Initial Status</label>
              <select
                value={bulk.status}
                onChange={(e) => setBulk((b) => ({ ...b, status: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              >
                <option value="vacant">Vacant</option>
                <option value="unavailable">Unavailable</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bulk-furnished"
                checked={bulk.isFurnished}
                onChange={(e) => setBulk((b) => ({ ...b, isFurnished: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-brand-blue"
              />
              <label htmlFor="bulk-furnished" className="text-sm">Furnished</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bulk-parking"
                checked={bulk.parkingIncluded}
                onChange={(e) => setBulk((b) => ({ ...b, parkingIncluded: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-brand-blue"
              />
              <label htmlFor="bulk-parking" className="text-sm">Parking included</label>
            </div>
          </div>
          <div className="rounded-lg bg-sky-50 border border-sky-200 px-3 py-2 text-sm text-sky-800">
            Preview: will create <strong>{bulk.count || "N"}</strong> units starting from <strong>{bulk.startingIdentifier || "A1"}</strong>
            {bulk.startingIdentifier && bulk.count
              ? ` → ${bulk.startingIdentifier} … (existing unit numbers will be skipped)`
              : ""}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline"
              onClick={() => { setShowBulkAdd(false); setBulk(EMPTY_BULK); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : `Create ${bulk.count || "N"} Units`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Management Mode Switch Modal */}
      <Modal
        open={showModeSwitch}
        onOpenChange={(open) => { if (!open) setShowModeSwitch(false); }}
        title="Change Management Mode"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Current mode: <strong className={modeInfo.color.includes("purple") ? "text-purple-700" : "text-sky-700"}>{modeInfo.label}</strong>
          </p>

          {property.managementMode === "self_managed" ? (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
              <h3 className="font-semibold text-purple-800">Upgrade to Full Service</h3>
              <p className="mt-1 text-sm text-purple-700">
                Secure Living takes over day-to-day operations: tenant sourcing, rent collection, maintenance coordination.
                You retain oversight and approve major decisions. A management fee applies (typically 8% of rent).
              </p>
              <ul className="mt-2 space-y-1 text-sm text-purple-700">
                <li>✓ Dedicated property manager assigned</li>
                <li>✓ Automated inspection scheduling</li>
                <li>✓ Maintenance assignment & coordination</li>
                <li>✓ Tenants notified of new manager</li>
              </ul>
              <Button
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => { void handleModeSwitch("full_service"); }}
                disabled={saving}
              >
                {saving ? "Switching…" : "Upgrade to Full Service"}
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <h3 className="font-semibold text-sky-800">Switch to Self-Managed</h3>
              <p className="mt-1 text-sm text-sky-700">
                You take back full control. All historical data (leases, payments, maintenance logs) is preserved.
                Active operations must be resolved before downgrade can proceed.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-sky-700">
                <li>✓ All Secure Living staff access removed</li>
                <li>✓ You regain full platform control</li>
                <li>✓ All data preserved</li>
                <li>⚠ Open service requests &amp; disputes must be resolved first</li>
              </ul>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => { void handleModeSwitch("self_managed"); }}
                disabled={saving}
              >
                {saving ? "Switching…" : "Switch to Self-Managed"}
              </Button>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowModeSwitch(false)}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
