"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Banknote,
  Building2,
  Clock,
  Home,
  ShieldCheck,
  Users,
  Wrench,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatKes } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type DashboardStats = {
  totalEscrowKes: number;
  monthlyRentKes: number;
  properties: number;
  units: number;
  activeTenants: number;
  pendingKyc: number;
  activeDisputes: number;
  openServiceRequests: number;
  recentActivity: ActivityItem[];
  alerts: AlertItem[];
};

type ActivityItem = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  role: string;
  timestamp: string;
  orgId?: string;
};

type AlertItem = {
  type: "overdue_rent" | "dispute" | "kyc" | "failed_tx" | "escrow";
  severity: "high" | "medium" | "low";
  message: string;
  resourceId: string;
  resourceType: string;
};

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    "property.created": "New property created",
    "units.bulk_created": "Units bulk-created",
    "property.management_mode_changed": "Management mode changed",
    "team.invited": "Team member invited",
    "team.invitation_revoked": "Team invitation revoked",
    "import.completed": "Data import completed",
    "property.updated": "Property updated",
    "lease.created": "Lease created",
    "unit.updated": "Unit updated",
  };
  return map[action] ?? action.replace(/\./g, " · ");
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SEVERITY_COLORS: Record<string, string> = {
  high: "bg-red-50 border-red-200 text-red-800",
  medium: "bg-amber-50 border-amber-200 text-amber-800",
  low: "bg-sky-50 border-sky-200 text-sky-800",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/dashboard/stats", {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: DashboardStats };
        setStats(json.data);
        setLastRefresh(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, [user?.authToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const topMetrics = stats
    ? [
        { label: "Total Escrow Held", value: formatKes(stats.totalEscrowKes), icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Monthly Rent Collected", value: formatKes(stats.monthlyRentKes), icon: TrendingUp, color: "text-brand-blue", bg: "bg-blue-50" },
        { label: "Total Properties", value: String(stats.properties), icon: Building2, color: "text-violet-600", bg: "bg-violet-50" },
        { label: "Total Units", value: String(stats.units), icon: Home, color: "text-teal-600", bg: "bg-teal-50" },
        { label: "Active Tenants", value: String(stats.activeTenants), icon: Users, color: "text-sky-600", bg: "bg-sky-50" },
        { label: "Pending KYC", value: String(stats.pendingKyc), icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Active Disputes", value: String(stats.activeDisputes), icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
        { label: "Open Service Requests", value: String(stats.openServiceRequests), icon: Wrench, color: "text-orange-600", bg: "bg-orange-50" },
      ]
    : [];

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title mt-2">Operations Dashboard</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Real-time platform intelligence · Last refreshed {timeAgo(lastRefresh.toISOString())}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="secondary" asChild><Link href="/properties">Properties</Link></Button>
          <Button variant="outline" asChild><Link href="/maintenance">Service Requests</Link></Button>
        </div>
      </div>

      {/* Top Metrics */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Platform Overview
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              ))
            : topMetrics.map((m) => (
                <div
                  key={m.label}
                  className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.bg} ${m.color}`}>
                    <m.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-[var(--text-secondary)]">{m.label}</p>
                    <p className="text-xl font-bold text-[var(--text-primary)]">{m.value}</p>
                  </div>
                </div>
              ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alerts Panel */}
        <section>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
                </div>
              ) : stats?.alerts.length ? (
                <div className="space-y-2">
                  {stats.alerts.map((a, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${SEVERITY_COLORS[a.severity] ?? ""}`}
                    >
                      {a.severity === "high" ? (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      <span>{a.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  All clear — no active alerts
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Live Activity Feed */}
        <section>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-blue" />
                Live Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />)}
                </div>
              ) : stats?.recentActivity.length ? (
                <div className="space-y-1.5 max-h-64 overflow-y-auto [scrollbar-width:thin]">
                  {stats.recentActivity.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-surface-border px-3 py-1.5 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {actionLabel(ev.action)}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {ev.role} · {ev.resourceType}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-[var(--text-muted)]">
                        {timeAgo(ev.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No recent activity.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link href="/properties/new">+ Add Property</Link></Button>
          <Button variant="outline" asChild><Link href="/import">Import Data</Link></Button>
          <Button variant="outline" asChild><Link href="/team">Manage Team</Link></Button>
          <Button variant="outline" asChild><Link href="/admin/organizations">Organisations</Link></Button>
          <Button variant="outline" asChild><Link href="/admin/rbac">RBAC</Link></Button>
          <Button variant="outline" asChild><Link href="/admin/audit-logs">Audit Logs</Link></Button>
          <Button variant="outline" asChild><Link href="/kyc">KYC</Link></Button>
          <Button variant="outline" asChild><Link href="/screening">Screening</Link></Button>
        </div>
      </section>
    </div>
  );
}
