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
  FileText,
  ConciergeBell,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatKes } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { UserRole } from "@/types/auth";
import { TrustSignals } from "@/components/dashboard/TrustSignals";

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

type MetricCard = {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
};

type QuickAction = { label: string; href: string };

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

function buildMetrics(stats: DashboardStats, role: UserRole | string): MetricCard[] {
  const escrow: MetricCard = { label: "Total Escrow Held", value: formatKes(stats.totalEscrowKes), icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50" };
  const rent: MetricCard = { label: "Monthly Rent Collected", value: formatKes(stats.monthlyRentKes), icon: TrendingUp, color: "text-brand-blue", bg: "bg-blue-50" };
  const properties: MetricCard = { label: "Total Properties", value: String(stats.properties), icon: Building2, color: "text-violet-600", bg: "bg-violet-50" };
  const units: MetricCard = { label: "Total Units", value: String(stats.units), icon: Home, color: "text-teal-600", bg: "bg-teal-50" };
  const tenants: MetricCard = { label: "Active Tenants", value: String(stats.activeTenants), icon: Users, color: "text-sky-600", bg: "bg-sky-50" };
  const kyc: MetricCard = { label: "Pending KYC", value: String(stats.pendingKyc), icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" };
  const disputes: MetricCard = { label: "Active Disputes", value: String(stats.activeDisputes), icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" };
  const serviceRequests: MetricCard = { label: "Open Service Requests", value: String(stats.openServiceRequests), icon: Wrench, color: "text-orange-600", bg: "bg-orange-50" };
  const myMaintenance: MetricCard = { label: "My Maintenance Requests", value: String(stats.openServiceRequests), icon: Wrench, color: "text-orange-600", bg: "bg-orange-50" };
  const myLease: MetricCard = { label: "Active Leases", value: String(stats.activeTenants), icon: FileText, color: "text-sky-600", bg: "bg-sky-50" };

  switch (role) {
    case "super_admin":
    case "admin":
      return [escrow, rent, properties, units, tenants, kyc, disputes, serviceRequests];
    case "landlord":
      return [escrow, rent, properties, units, tenants, serviceRequests];
    case "staff":
      return [properties, units, tenants, serviceRequests];
    case "tenant":
      return [myLease, myMaintenance];
    default:
      return [properties, units, tenants, serviceRequests];
  }
}

function getQuickActions(role: UserRole | string): QuickAction[] {
  switch (role) {
    case "super_admin":
      return [
        { label: "+ Add Property", href: "/properties/new" },
        { label: "Import Data", href: "/import" },
        { label: "Manage Team", href: "/team" },
        { label: "Organisations", href: "/admin/organizations" },
        { label: "RBAC", href: "/admin/rbac" },
        { label: "Audit Logs", href: "/admin/audit-logs" },
        { label: "KYC", href: "/kyc" },
        { label: "Screening", href: "/screening" },
      ];
    case "admin":
      return [
        { label: "+ Add Property", href: "/properties/new" },
        { label: "Import Data", href: "/import" },
        { label: "Manage Team", href: "/team" },
        { label: "Organisations", href: "/admin/organizations" },
        { label: "Audit Logs", href: "/admin/audit-logs" },
        { label: "KYC", href: "/kyc" },
        { label: "Screening", href: "/screening" },
      ];
    case "landlord":
      return [
        { label: "+ Add Property", href: "/properties/new" },
        { label: "Import Data", href: "/import" },
        { label: "Manage Team", href: "/team" },
        { label: "KYC", href: "/kyc" },
        { label: "Screening", href: "/screening" },
      ];
    case "staff":
      return [
        { label: "Properties", href: "/properties" },
        { label: "Maintenance", href: "/maintenance" },
        { label: "Tenants", href: "/tenants" },
        { label: "KYC", href: "/kyc" },
      ];
    case "tenant":
      return [
        { label: "Submit Maintenance Request", href: "/maintenance" },
        { label: "View My Lease", href: "/leasing" },
        { label: "KYC & Documents", href: "/kyc" },
      ];
    default:
      return [
        { label: "+ Add Property", href: "/properties/new" },
        { label: "Maintenance", href: "/maintenance" },
        { label: "KYC", href: "/kyc" },
      ];
  }
}

type RoleConfig = {
  title: string;
  subtitle: string;
  sectionLabel: string;
  headerLinks: { label: string; href: string; variant: "secondary" | "outline" }[];
  showActivity: boolean;
};

function getRoleConfig(role: UserRole | string): RoleConfig {
  switch (role) {
    case "super_admin":
    case "admin":
      return {
        title: "Operations Dashboard",
        subtitle: "Real-time platform intelligence",
        sectionLabel: "Platform Overview",
        headerLinks: [
          { label: "Properties", href: "/properties", variant: "secondary" },
          { label: "Service Requests", href: "/maintenance", variant: "outline" },
        ],
        showActivity: true,
      };
    case "landlord":
      return {
        title: "Property Dashboard",
        subtitle: "Your portfolio at a glance",
        sectionLabel: "Portfolio Overview",
        headerLinks: [
          { label: "My Properties", href: "/properties", variant: "secondary" },
          { label: "Maintenance", href: "/maintenance", variant: "outline" },
        ],
        showActivity: true,
      };
    case "staff":
      return {
        title: "Staff Dashboard",
        subtitle: "Your assigned work overview",
        sectionLabel: "Work Overview",
        headerLinks: [
          { label: "Properties", href: "/properties", variant: "secondary" },
          { label: "Maintenance", href: "/maintenance", variant: "outline" },
        ],
        showActivity: true,
      };
    case "tenant":
      return {
        title: "My Dashboard",
        subtitle: "Your home and lease overview",
        sectionLabel: "My Overview",
        headerLinks: [
          { label: "My Lease", href: "/leasing", variant: "secondary" },
          { label: "Maintenance", href: "/maintenance", variant: "outline" },
        ],
        showActivity: false,
      };
    default:
      return {
        title: "Dashboard",
        subtitle: "Overview",
        sectionLabel: "Overview",
        headerLinks: [
          { label: "Properties", href: "/properties", variant: "secondary" },
        ],
        showActivity: true,
      };
  }
}

type SRStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "QUOTING"
  | "AWAITING_FUNDING"
  | "FUNDED"
  | "ASSIGNED"
  | "SCHEDULING_PENDING"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

type SRWidgetItem = {
  id: string;
  title: string;
  srStatus: SRStatus;
  serviceType: string;
  createdAt: string;
};

function srStatusLabel(status: SRStatus): { label: string; className: string } {
  const map: Partial<Record<SRStatus, { label: string; className: string }>> = {
    SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-700" },
    IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
    BLOCKED: { label: "Blocked", className: "bg-red-100 text-red-700" },
    COMPLETED: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
    ASSIGNED: { label: "Assigned", className: "bg-indigo-100 text-indigo-700" },
  };
  return map[status] ?? { label: status.replace(/_/g, " "), className: "bg-slate-100 text-slate-600" };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Phase 3 SR widgets
  const [myRequests, setMyRequests] = useState<SRWidgetItem[]>([]);
  const [myRequestsLoading, setMyRequestsLoading] = useState(true);
  const [queueSubmitted, setQueueSubmitted] = useState(0);
  const [queueBlocked, setQueueBlocked] = useState(0);
  const [queueOverdue, setQueueOverdue] = useState(0);
  const [myJobs, setMyJobs] = useState<SRWidgetItem[]>([]);
  const [myJobsLoading, setMyJobsLoading] = useState(true);

  const role = (user?.role ?? "landlord") as UserRole;
  const config = getRoleConfig(role);

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

  // Load "My Service Requests" widget
  const loadMyRequests = useCallback(async () => {
    if (!user?.authToken) return;
    setMyRequestsLoading(true);
    try {
      const res = await fetch("/api/v1/service-requests?limit=5", {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: SRWidgetItem[] };
        setMyRequests(json.data ?? []);
      }
    } finally {
      setMyRequestsLoading(false);
    }
  }, [user?.authToken]);

  // Load manager queue widget
  const loadManagerQueue = useCallback(async () => {
    if (!user?.authToken) return;
    try {
      const [submittedRes, blockedRes, allRes] = await Promise.all([
        fetch("/api/v1/service-requests?srStatus=SUBMITTED&limit=1", {
          headers: { Authorization: `Bearer ${user.authToken}` },
        }),
        fetch("/api/v1/service-requests?srStatus=BLOCKED&limit=1", {
          headers: { Authorization: `Bearer ${user.authToken}` },
        }),
        fetch("/api/v1/service-requests?limit=100", {
          headers: { Authorization: `Bearer ${user.authToken}` },
        }),
      ]);
      if (submittedRes.ok) {
        const j = (await submittedRes.json()) as { meta?: { total?: number }; data: unknown[] };
        setQueueSubmitted(j.meta?.total ?? j.data?.length ?? 0);
      }
      if (blockedRes.ok) {
        const j = (await blockedRes.json()) as { meta?: { total?: number }; data: unknown[] };
        setQueueBlocked(j.meta?.total ?? j.data?.length ?? 0);
      }
      if (allRes.ok) {
        const j = (await allRes.json()) as { data: SRWidgetItem[] };
        const now = new Date();
        const terminal: SRStatus[] = ["COMPLETED", "CANCELLED"];
        const overdueCount = (j.data ?? []).filter(
          (r: SRWidgetItem & { dueAt?: string }) =>
            (r as SRWidgetItem & { dueAt?: string }).dueAt &&
            new Date((r as SRWidgetItem & { dueAt?: string }).dueAt!) < now &&
            !terminal.includes(r.srStatus)
        ).length;
        setQueueOverdue(overdueCount);
      }
    } catch {
      // ignore
    }
  }, [user?.authToken]);

  // Load staff "My Jobs" widget
  const loadMyJobs = useCallback(async () => {
    if (!user?.authToken) return;
    setMyJobsLoading(true);
    try {
      const res = await fetch("/api/v1/service-requests?srStatus=IN_PROGRESS&limit=5", {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: SRWidgetItem[] };
        setMyJobs(json.data ?? []);
      }
    } finally {
      setMyJobsLoading(false);
    }
  }, [user?.authToken]);

  useEffect(() => {
    void load();
    void loadMyRequests();
    if (role === "admin" || role === "super_admin" || role === "landlord") {
      void loadManagerQueue();
    }
    if (role === "staff") {
      void loadMyJobs();
    }
  }, [load, loadMyRequests, loadManagerQueue, loadMyJobs, role]);

  const topMetrics = stats ? buildMetrics(stats, role) : [];
  const quickActions = getQuickActions(role);

  const skeletonCount = role === "tenant" ? 2 : role === "staff" ? 4 : role === "landlord" ? 6 : 8;

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title mt-2">{config.title}</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {config.subtitle} · Last refreshed {timeAgo(lastRefresh.toISOString())}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {config.headerLinks.map((link) => (
            <Button key={link.href} variant={link.variant} asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Top Metrics */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          {config.sectionLabel}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
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

      <div className={`grid gap-6 ${config.showActivity ? "lg:grid-cols-2" : ""}`}>
        {/* Alerts Panel */}
        <section>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {role === "tenant" ? "My Alerts" : "Alerts"}
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

        {/* Live Activity Feed — hidden for tenant */}
        {config.showActivity ? (
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
        ) : null}
      </div>

      {/* Phase 3: Service Request Widgets */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Service Requests
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* My Service Requests — all roles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <ConciergeBell className="h-4 w-4 text-blue-500" />
                  My Service Requests
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/service-requests" className="text-xs text-blue-600 hover:underline">
                    View all →
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myRequestsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
                </div>
              ) : myRequests.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" />
                  No active service requests
                </div>
              ) : (
                <div className="space-y-1.5">
                  {myRequests.map((sr) => {
                    const badge = srStatusLabel(sr.srStatus);
                    return (
                      <Link
                        key={sr.id}
                        href={`/service-requests/${sr.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-surface-border px-3 py-2 hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                            {sr.title}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {sr.serviceType.replace(/_/g, " ")} · {timeAgo(sr.createdAt)}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manager Queue widget */}
          {(role === "admin" || role === "super_admin" || role === "landlord") && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Request Queue
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/service-requests" className="text-xs text-blue-600 hover:underline">
                      Manage →
                    </Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center rounded-xl border border-blue-100 bg-blue-50 p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{queueSubmitted}</p>
                    <p className="text-xs text-blue-600">Awaiting Approval</p>
                  </div>
                  <div className="flex flex-col items-center rounded-xl border border-red-100 bg-red-50 p-3 text-center">
                    <p className="text-2xl font-bold text-red-700">{queueBlocked}</p>
                    <p className="text-xs text-red-600">Blocked</p>
                  </div>
                  <div className="flex flex-col items-center rounded-xl border border-orange-100 bg-orange-50 p-3 text-center">
                    <p className="text-2xl font-bold text-orange-700">{queueOverdue}</p>
                    <p className="text-xs text-orange-600">Overdue</p>
                  </div>
                </div>
                {queueSubmitted > 0 && (
                  <div className="mt-3">
                    <Button variant="secondary" size="sm" className="w-full" asChild>
                      <Link href="/service-requests?status=SUBMITTED">
                        Review {queueSubmitted} pending request{queueSubmitted !== 1 ? "s" : ""}
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Staff "My Jobs" widget */}
          {role === "staff" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-500" />
                    My Jobs
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/service-requests" className="text-xs text-blue-600 hover:underline">
                      View all →
                    </Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myJobsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
                  </div>
                ) : myJobs.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" />
                    No jobs in progress
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {myJobs.map((sr) => (
                      <Link
                        key={sr.id}
                        href={`/service-requests/${sr.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-surface-border px-3 py-2 hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                            {sr.title}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {sr.serviceType.replace(/_/g, " ")} · {timeAgo(sr.createdAt)}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          In Progress
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Verified Trust Signals */}
      {(role === "landlord" || role === "agency" || role === "staff") && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Your Verified Record
          </h2>
          <TrustSignals />
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button key={action.href} variant="outline" asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
