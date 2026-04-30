"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, MessageSquare, Phone, Users } from "lucide-react";
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
  rentAmount: number;
  status: string;
  endDate: string;
};

type Row = {
  id: string;
  name: string;
  property: string;
  propertyId: string;
  rent: number;
  status: "Current" | "Arrears" | "Notice";
  email: string;
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
        name: l.tenantUserId,
        property: `${l.propertyId} / ${l.unitId}`,
        propertyId: l.propertyId,
        rent: l.rentAmount,
        status: l.status === "active" ? "Current" : l.status === "terminated" ? "Notice" : "Arrears",
        email: `${l.tenantUserId}@secureliving.local`,
        leaseEnd: new Date(l.endDate).toISOString().slice(0, 10),
      }));
      setRows(mapped);
      setError(null);
    })();
  }, [user]);

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
      render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
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
            onClick={() => toast(`Email queued to ${r.email}`, "success")}
          >
            <Mail className="h-3.5 w-3.5" aria-hidden />
            Email
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => toast(`SMS reminder sent — ${r.name}`, "info")}
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            SMS
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
            onClick={() => toast("Bulk reminder scheduled for all in arrears", "success")}
          >
            Remind arrears
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/80 shadow-[0_16px_48px_rgb(var(--rgb-ink)_/_0.1)]">
        <Image
          src="/images/property/tenants-banner.jpg"
          alt="Residential building for tenant management"
          width={1600}
          height={560}
          className="h-40 w-full object-cover sm:h-48"
        />
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
          <DataTable data={rows} columns={columns} rowKey={(r) => r.id} />
          {error ? <p className="px-4 pb-4 text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
