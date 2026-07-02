"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Building2, Home, Layers, Search, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";

type PropertyRow = {
  id: string;
  name: string;
  propertyType: string;
  propertyCode: string | null;
  addressLine1: string;
  city: string | null;
  county: string | null;
  status: string;
  unitCount: number;
  occupiedUnitCount: number;
};

function statusVariant(s: string): "success" | "error" | "warning" | "neutral" {
  if (s === "active") return "success";
  if (s === "archived") return "error";
  if (s === "draft") return "warning";
  return "neutral";
}

export default function PropertiesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/properties", {
          headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
        });
        if (!res.ok) {
          setError("Failed to load properties.");
          return;
        }
        const json = (await res.json()) as { data: PropertyRow[] };
        setRows(json.data);
        setError(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, user?.authToken]);

  const totalUnits = useMemo(() => rows.reduce((s, p) => s + p.unitCount, 0), [rows]);
  const occupiedUnits = useMemo(() => rows.reduce((s, p) => s + p.occupiedUnitCount, 0), [rows]);
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  const activeCount = useMemo(() => rows.filter((p) => p.status === "active").length, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [
        row.name,
        row.propertyType,
        row.propertyCode ?? "",
        row.addressLine1,
        row.city ?? "",
        row.county ?? "",
        row.status,
      ].some((value) => value.toLowerCase().includes(q))
    );
  }, [rows, search]);

  const columns: Column<PropertyRow>[] = [
    {
      key: "name",
      header: "Property",
      sortable: true,
      render: (p) => (
        <Link href={`/properties/${p.id}`} className="font-medium text-brand-blue hover:underline">
          {p.name}
        </Link>
      ),
    },
    {
      key: "propertyCode",
      header: "Code",
      render: (p) => (
        <span className="font-mono-data text-xs text-[var(--text-secondary)]">{p.propertyCode ?? "—"}</span>
      ),
    },
    {
      key: "propertyType",
      header: "Type",
      sortable: true,
    },
    {
      key: "addressLine1",
      header: "Location",
      render: (p) => (
        <div>
          <p className="text-[var(--text-primary)]">{p.city ?? p.county ?? "Kenya"}</p>
          <p className="text-xs text-[var(--text-muted)]">{p.addressLine1}</p>
        </div>
      ),
    },
    {
      key: "unitCount",
      header: "Units",
      sortable: true,
      render: (p) => (
        <span className="font-mono-data text-[var(--text-primary)]">
          {p.occupiedUnitCount}/{p.unitCount} occupied
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <Badge variant={statusVariant(p.status)} className="capitalize">{p.status}</Badge>
      ),
    },
    {
      key: "id",
      header: "Actions",
      render: (p) => (
        <Button type="button" variant="outline" size="sm" className="h-8" asChild>
          <Link href={`/properties/${p.id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Properties</h1>
          <p className="app-page-lead">Portfolio overview across your managed properties</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/properties/new">+ Add Property</Link>
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/80 shadow-[0_16px_48px_rgb(var(--rgb-ink)_/_0.1)]">
        <Image
          src="/images/property/properties-banner.jpg"
          alt="Apartment portfolio overview"
          width={1600}
          height={560}
          priority
          className="h-40 w-full object-cover sm:h-48"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1f38]/75 via-[#0f1f38]/45 to-transparent" />
        <p className="absolute bottom-4 left-4 max-w-xl text-sm font-medium text-white/90 sm:bottom-5 sm:left-5 sm:text-base">
          Track occupancy, inspections, and rent status across your managed property portfolio.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-brand-blue/15 bg-gradient-to-br from-escrow/80 to-white/90">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
              <Building2 className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Total Properties</p>
              <p className="font-display text-2xl font-semibold text-brand-navy">{rows.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Home className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Active</p>
              <p className="font-display text-2xl font-semibold text-brand-navy">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Layers className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Total Units</p>
              <p className="font-display text-2xl font-semibold text-brand-navy">{totalUnits}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Occupancy Rate</p>
              <p className="font-display text-2xl font-semibold text-brand-navy">{occupancyRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b border-slate-100 p-4">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search properties by name, code, type, or location"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : (
            <DataTable data={filteredRows} columns={columns} rowKey={(r) => r.id} />
          )}
          {error ? <p className="px-4 pb-4 text-sm text-red-600">{error}</p> : null}
          {!loading && !rows.length && !error ? (
            <p className="px-4 pb-4 text-sm text-[var(--text-secondary)]">No properties yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
