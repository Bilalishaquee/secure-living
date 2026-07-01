"use client";

import Link from "next/link";
import { Mail, MessageSquare, Phone, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/lib/toast-context";
import { formatKes } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useAuth } from "@/lib/auth-context";

type LeaseRow = {
  id: string;
  propertyId: string;
  unitId: string;
  tenantUserId: string;
  tenantName: string | null;
  tenantEmail: string | null;
  rentAmount: number;
  status: string;
  endDate: string;
};

type Row = {
  id: string;
  tenantUserId: string;
  name: string;
  property: string;
  propertyId: string;
  rent: number;
  status: "Current" | "Arrears" | "Notice";
  email: string | null;
  leaseEnd: string;
};

function statusVariant(s: Row["status"]): "success" | "error" | "warning" {
  if (s === "Current") return "success";
  if (s === "Arrears") return "error";
  return "warning";
}

export default function TenantsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const res = await fetch("/api/v1/leases", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (!res.ok) {
        setError("Unable to load tenant lease records.");
        setRows([]);
        return;
      }
      const json = (await res.json()) as { data: LeaseRow[] };
      const mapped = json.data.map((l) => ({
        id: l.id,
        tenantUserId: l.tenantUserId,
        name: l.tenantName ?? `Tenant …${l.tenantUserId.slice(-6)}`,
        property: `${l.propertyId.slice(0, 8)}… / ${l.unitId.slice(0, 8)}…`,
        propertyId: l.propertyId,
        rent: l.rentAmount,
        status: (l.status === "active" ? "Current" : l.status === "terminated" ? "Notice" : "Arrears") as Row["status"],
        email: l.tenantEmail ?? null,
        leaseEnd: new Date(l.endDate).toISOString().slice(0, 10),
      }));
      setRows(mapped);
      setError(null);
    })();
  }, [user]);

  async function bulkRemind() {
    if (!user?.authToken) return;
    try {
      const res = await fetch("/api/v1/leases/bulk-remind", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      const j = await res.json() as { data?: { count: number; message: string }; error?: string };
      if (res.ok && j.data) toast(j.data.message, "success");
      else toast(j.error ?? "Failed to send reminders", "error");
    } catch { toast("Failed to send reminders", "error"); }
  }

  const columns: Column<Row>[] = [
    { key: "name", header: "Tenant", sortable: true },
    {
      key: "property",
      header: "Property / unit",
      render: (r) => (
        <Link
          href={`/properties/${r.propertyId}`}
          className="font-medium text-brand-blue hover:underline"
        >
          {r.property}
        </Link>
      ),
    },
    {
      key: "rent",
      header: "Rent",
      sortable: true,
      render: (r) => (
        <span className="font-mono-data text-[var(--text-primary)]">
          {formatKes(r.rent)}
        </span>
      ),
    },
    {
      key: "leaseEnd",
      header: "Lease ends",
      render: (r) => (
        <span className="font-mono-data text-xs text-[var(--text-secondary)]">{r.leaseEnd}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={statusVariant(r.status)}>
          {r.status === "Arrears" ? `Arrears - ${formatKes(r.rent)}` : r.status}
        </Badge>
      ),
    },
    {
      key: "id",
      header: "Actions",
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8"
            disabled={!r.email}
            onClick={() => { if (r.email) window.open(`mailto:${r.email}?subject=Rent%20Reminder&body=Dear%20${encodeURIComponent(r.name)}%2C%0A%0AThis%20is%20a%20reminder%20about%20your%20rental%20account.`); }}
          >
            <Mail className="h-3.5 w-3.5" aria-hidden />
            Email
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => { window.open(`sms:${r.email ? "" : ""}?&body=Hi%20${encodeURIComponent(r.name)}%2C%20this%20is%20a%20reminder%20about%20your%20Secure%20Living%20rental%20account.`); toast(`SMS composer opened for ${r.name}`, "info"); }}
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            SMS
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8" asChild>
            <Link href={`/tenants/${r.tenantUserId}`}>View</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8" asChild>
            <Link href={`/properties/${r.propertyId}`}>Property</Link>
          </Button>
        </div>
      ),
    },
  ];

  const current = useMemo(() => rows.filter((t) => t.status === "Current").length, [rows]);
  const arrears = useMemo(() => rows.filter((t) => t.status === "Arrears").length, [rows]);
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [
        row.id,
        row.tenantUserId,
        row.name,
        row.email ?? "",
        row.property,
        row.propertyId,
        row.status,
        row.leaseEnd,
      ].some((value) => value.toLowerCase().includes(q))
    );
  }, [rows, search]);

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Tenants</h1>
          <p className="app-page-lead">Verification and rent status from lease records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/transactions">View payments</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => { void bulkRemind(); }}
          >
            Remind arrears
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/80 shadow-[0_16px_48px_rgb(0_0_0_/_0.1)]">
        <div className="h-40 w-full bg-gradient-to-br from-[#0f1f38] via-[#1a3a6b] to-[#2d6cdf] sm:h-48" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1f38]/75 via-[#0f1f38]/45 to-transparent" />
        <p className="absolute bottom-4 left-4 max-w-xl text-sm font-medium text-white/90 sm:bottom-5 sm:left-5 sm:text-base">
          Keep tenant records, lease timelines, and communication in one organized view.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-brand-blue/15 bg-gradient-to-br from-escrow/80 to-white/90">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Total
              </p>
              <p className="font-display text-2xl font-semibold text-brand-navy">
                {rows.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Phone className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Current
              </p>
              <p className="font-display text-2xl font-semibold text-brand-navy">{current}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-brand-red">
              <MessageSquare className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Needs attention
              </p>
              <p className="font-display text-2xl font-semibold text-brand-navy">
                {arrears + rows.filter((t) => t.status === "Notice").length}
              </p>
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
                placeholder="Search tenants by ID, name, email, property, unit, or status"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
          </div>
          <DataTable data={filteredRows} columns={columns} rowKey={(r) => r.id} />
          {error ? <p className="px-4 pb-4 text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
