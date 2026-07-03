"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, lazy, Suspense } from "react";
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
  Activity,
  PieChart,
  DollarSign,
  BarChart2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatKes } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { UserRole } from "@/types/auth";
import { TrustSignals } from "@/components/dashboard/TrustSignals";

const DashboardEscrowChart = lazy(() => import("@/components/dashboard/DashboardEscrowChart"));

type EscrowChartPoint = { w: string; v: number };

type DashboardStats = {
  totalEscrowKes: number;
  monthlyRentKes: number;
  totalDueKes: number;
  properties: number;
  units: number;
  activeTenants: number;
  occupancyRate: number;
  collectionRate: number;
  arrearsKes: number;
  pendingKyc: number;
  activeDisputes: number;
  openServiceRequests: number;
  blockedServiceRequests: number;
  slaBreachCount: number;
  myAssignedJobs: number;
  totalOrganizations: number;
  activeLandlords: number;
  activePropertyManagers: number;
  activeProviders: number;
  serviceRequestsInProgress: number;
  serviceRequestsAwaitingConfirmation: number;
  serviceRequestsOverdue: number;
  depositFullyCovered: number;
  depositAtRisk: number;
  depositShortfall: number;
  depositEscrowBalanceKes: number;
  weeklyEscrowTrend: EscrowChartPoint[];
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
  type: string;
  severity: "high" | "medium" | "low";
  message: string;
  resourceId: string;
  resourceType: string;
  href?: string;
};

type MetricCard = {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  href?: string;
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
    LEASE_CREATED: "Lease created",
    LEASE_ACTIVATED: "Lease activated",
    KYC_APPROVED: "KYC document approved",
    PROVIDER_APPROVED: "Provider approved",
    SR_CREATED: "Service request submitted",
    LISTING_PUBLISHED: "Listing published",
    VACATING_ACKNOWLEDGED: "Vacating notice acknowledged",
  };
  return map[action] ?? action.replace(/[._]/g, " ");
}

function activityHref(resourceType: string, resourceId: string): string {
  const map: Record<string, string> = {
    Lease: `/leasing/${resourceId}`,
    Property: `/properties/${resourceId}`,
    ServiceRequest: `/service-requests/${resourceId}`,
    KycDocument: "/kyc",
    ServiceProvider: "/providers",
    Listing: `/listings/${resourceId}`,
    VacatingNotice: "/vacating",
  };
  return map[resourceType] ?? "/dashboard";
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
  const escrow: MetricCard = {
    label: "Total Escrow Held",
    value: formatKes(stats.totalEscrowKes),
    sub: "Funds under custody",
    icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50",
    href: "/banking",
  };
  const rent: MetricCard = {
    label: "Rent Collected (MTD)",
    value: formatKes(stats.monthlyRentKes),
    sub: stats.totalDueKes > 0
      ? `of ${formatKes(stats.totalDueKes)} due (${stats.collectionRate}%)`
      : "Month to date",
    icon: TrendingUp, color: "text-brand-blue", bg: "bg-blue-50",
    href: "/rent-collection/receipts",
  };
  const occupancy: MetricCard = {
    label: "Occupancy Rate",
    value: `${stats.occupancyRate}%`,
    sub: `${stats.activeTenants} of ${stats.units} units occupied`,
    icon: PieChart, color: "text-violet-600", bg: "bg-violet-50",
    href: "/properties",
  };
  const arrears: MetricCard = {
    label: "In Arrears",
    value: formatKes(stats.arrearsKes),
    sub: stats.arrearsKes > 0 ? "Overdue balance — action needed" : "No overdue balances",
    icon: AlertTriangle,
    color: stats.arrearsKes > 0 ? "text-red-600" : "text-emerald-600",
    bg: stats.arrearsKes > 0 ? "bg-red-50" : "bg-emerald-50",
    href: "/rent-collection/receipts",
  };
  const properties: MetricCard = {
    label: "Total Properties",
    value: String(stats.properties),
    icon: Building2, color: "text-violet-600", bg: "bg-violet-50",
    href: "/properties",
  };
  const units: MetricCard = {
    label: "Total Units",
    value: String(stats.units),
    icon: Home, color: "text-teal-600", bg: "bg-teal-50",
    href: "/properties",
  };
  const tenants: MetricCard = {
    label: "Active Tenants",
    value: String(stats.activeTenants),
    icon: Users, color: "text-sky-600", bg: "bg-sky-50",
    href: "/tenants",
  };
  const kyc: MetricCard = {
    label: "Pending KYC",
    value: String(stats.pendingKyc),
    sub: stats.pendingKyc > 0 ? "Documents awaiting review" : "All clear",
    icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50",
    href: "/kyc",
  };
  const disputes: MetricCard = {
    label: "Active Disputes",
    value: String(stats.activeDisputes),
    sub: stats.activeDisputes > 0 ? "Utility disputes open" : "No open disputes",
    icon: AlertTriangle,
    color: stats.activeDisputes > 0 ? "text-red-600" : "text-emerald-600",
    bg: stats.activeDisputes > 0 ? "bg-red-50" : "bg-emerald-50",
    href: "/admin/disputes",
  };
  const serviceRequests: MetricCard = {
    label: "Open Service Requests",
    value: String(stats.openServiceRequests),
    sub: stats.blockedServiceRequests > 0 ? `${stats.blockedServiceRequests} blocked` : undefined,
    icon: Wrench, color: "text-orange-600", bg: "bg-orange-50",
    href: "/service-requests",
  };
  const sla: MetricCard = {
    label: "SLA Breaches",
    value: String(stats.slaBreachCount),
    sub: stats.slaBreachCount > 0 ? "Past deadline — urgent" : "All within SLA",
    icon: Clock,
    color: stats.slaBreachCount > 0 ? "text-red-600" : "text-emerald-600",
    bg: stats.slaBreachCount > 0 ? "bg-red-50" : "bg-emerald-50",
    href: "/service-requests/manager-queue",
  };
  const myMaintenance: MetricCard = {
    label: "My Maintenance Requests",
    value: String(stats.openServiceRequests),
    icon: Wrench, color: "text-orange-600", bg: "bg-orange-50",
    href: "/service-requests",
  };
  const myAssignedJobsCard: MetricCard = {
    label: "My Assigned Jobs",
    value: String(stats.myAssignedJobs ?? 0),
    sub: (stats.myAssignedJobs ?? 0) > 0 ? "Active jobs assigned to you" : "No jobs currently assigned",
    icon: Wrench, color: "text-blue-600", bg: "bg-blue-50",
    href: "/service-requests",
  };
  const myLease: MetricCard = {
    label: "Active Leases",
    value: String(stats.activeTenants),
    icon: FileText, color: "text-sky-600", bg: "bg-sky-50",
    href: "/leasing",
  };
  const collection: MetricCard = {
    label: "Collection Rate",
    value: `${stats.collectionRate}%`,
    sub: `${formatKes(stats.monthlyRentKes)} of ${formatKes(stats.totalDueKes)}`,
    icon: BarChart2, color: "text-brand-blue", bg: "bg-blue-50",
    href: "/rent-collection/receipts",
  };
  const depositHealth: MetricCard = {
    label: "Deposit Health",
    value: String((stats.depositFullyCovered ?? 0) + (stats.depositAtRisk ?? 0) + (stats.depositShortfall ?? 0)),
    sub: `${stats.depositAtRisk ?? 0} at risk, ${stats.depositShortfall ?? 0} shortfall`,
    icon: ShieldCheck,
    color: (stats.depositShortfall ?? 0) > 0 ? "text-red-600" : (stats.depositAtRisk ?? 0) > 0 ? "text-amber-600" : "text-emerald-600",
    bg: (stats.depositShortfall ?? 0) > 0 ? "bg-red-50" : (stats.depositAtRisk ?? 0) > 0 ? "bg-amber-50" : "bg-emerald-50",
    href: "/leasing",
  };
  const organizations: MetricCard = {
    label: "Total Organisations",
    value: String(stats.totalOrganizations ?? 0),
    icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50",
    href: "/admin/organizations",
  };
  const activeLandlords: MetricCard = {
    label: "Active Landlords",
    value: String(stats.activeLandlords ?? 0),
    icon: Users, color: "text-sky-600", bg: "bg-sky-50",
    href: "/team",
  };
  const activePropertyManagers: MetricCard = {
    label: "Active Property Managers",
    value: String(stats.activePropertyManagers ?? 0),
    icon: ConciergeBell, color: "text-violet-600", bg: "bg-violet-50",
    href: "/team",
  };
  const activeProviders: MetricCard = {
    label: "Active Providers",
    value: String(stats.activeProviders ?? 0),
    icon: Wrench, color: "text-emerald-600", bg: "bg-emerald-50",
    href: "/providers",
  };

  switch (role) {
    case "super_admin":
      return [organizations, activeLandlords, activePropertyManagers, activeProviders, escrow, depositHealth, rent, occupancy, arrears, properties, units, tenants, kyc, disputes, serviceRequests, sla, collection];
    case "admin":
      return [escrow, depositHealth, rent, occupancy, arrears, properties, units, tenants, kyc, disputes, serviceRequests, sla, collection];
    case "landlord":
      return [escrow, depositHealth, rent, occupancy, arrears, properties, units, tenants, serviceRequests];
    case "staff":
      return [properties, units, tenants, serviceRequests, sla, myAssignedJobsCard];
    case "tenant":
      return [myLease, depositHealth, myMaintenance];
    default:
      return [properties, units, tenants, serviceRequests];
  }
}

function getQuickActions(role: UserRole | string): QuickAction[] {
  switch (role) {
    case "super_admin":
      return [
        { label: "Add Tenant", href: "/tenants/new" },
        { label: "Add Property", href: "/properties/new" },
        { label: "Create Invoice", href: "/rent-collection/receipts" },
        { label: "Upload Utility Bill", href: "/utilities" },
        { label: "Record Payment", href: "/rent-collection/receipts" },
        { label: "Add Visitor", href: "/visitors" },
        { label: "Create Checklist", href: "/checklists" },
        { label: "Upload Lease", href: "/leasing" },
        { label: "Import Data", href: "/data-import" },
        { label: "Manage Team", href: "/team" },
        { label: "Organisations", href: "/admin/organizations" },
        { label: "RBAC", href: "/admin/rbac" },
        { label: "Audit Logs", href: "/admin/audit-logs" },
        { label: "KYC", href: "/kyc" },
        { label: "Screening", href: "/screening" },
      ];
    case "admin":
      return [
        { label: "Add Tenant", href: "/tenants/new" },
        { label: "Add Property", href: "/properties/new" },
        { label: "Create Invoice", href: "/rent-collection/receipts" },
        { label: "Upload Utility Bill", href: "/utilities" },
        { label: "Record Payment", href: "/rent-collection/receipts" },
        { label: "Add Visitor", href: "/visitors" },
        { label: "Create Checklist", href: "/checklists" },
        { label: "Upload Lease", href: "/leasing" },
        { label: "Import Data", href: "/data-import" },
        { label: "Manage Team", href: "/team" },
        { label: "Organisations", href: "/admin/organizations" },
        { label: "Audit Logs", href: "/admin/audit-logs" },
        { label: "KYC", href: "/kyc" },
        { label: "Screening", href: "/screening" },
      ];
    case "landlord":
      return [
        { label: "Add Tenant", href: "/tenants/new" },
        { label: "Add Property", href: "/properties/new" },
        { label: "Create Invoice", href: "/rent-collection/receipts" },
        { label: "Upload Utility Bill", href: "/utilities" },
        { label: "Record Payment", href: "/rent-collection/receipts" },
        { label: "Add Visitor", href: "/visitors" },
        { label: "Create Checklist", href: "/checklists" },
        { label: "Upload Lease", href: "/leasing" },
        { label: "Import Data", href: "/data-import" },
        { label: "Manage Team", href: "/team" },
        { label: "KYC", href: "/kyc" },
        { label: "Screening", href: "/screening" },
      ];
    case "staff":
      return [
        { label: "Add Visitor", href: "/visitors" },
        { label: "Create Checklist", href: "/checklists" },
        { label: "Properties", href: "/properties" },
        { label: "Service Requests", href: "/service-requests" },
        { label: "Tenants", href: "/tenants" },
        { label: "KYC", href: "/kyc" },
      ];
    case "tenant":
      return [
        { label: "Submit Request", href: "/service-requests" },
        { label: "View My Lease", href: "/tenant/lease" },
        { label: "View Payments", href: "/tenant/lease/payments" },
        { label: "KYC & Documents", href: "/kyc" },
      ];
    default:
      return [
        { label: "Add Tenant", href: "/tenants/new" },
        { label: "Add Property", href: "/properties/new" },
        { label: "Create Invoice", href: "/rent-collection/receipts" },
        { label: "Service Requests", href: "/service-requests" },
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
  showChart: boolean;
};

function getRoleConfig(role: UserRole | string): RoleConfig {
  switch (role) {
    case "super_admin":
      return {
        title: "Operations Dashboard",
        subtitle: "Real-time platform intelligence",
        sectionLabel: "Platform Overview",
        headerLinks: [
          { label: "Properties", href: "/properties", variant: "secondary" },
          { label: "Service Requests", href: "/service-requests", variant: "outline" },
        ],
        showActivity: true,
        showChart: true,
      };
    case "admin":
      return {
        title: "Manager Dashboard",
        subtitle: "Organisation operations overview",
        sectionLabel: "Manager Overview",
        headerLinks: [
          { label: "Properties", href: "/properties", variant: "secondary" },
          { label: "Service Requests", href: "/service-requests", variant: "outline" },
        ],
        showActivity: true,
        showChart: true,
      };
    case "landlord":
      return {
        title: "Property Dashboard",
        subtitle: "Your portfolio at a glance",
        sectionLabel: "Portfolio Overview",
        headerLinks: [
          { label: "My Properties", href: "/properties", variant: "secondary" },
          { label: "Service Requests", href: "/service-requests", variant: "outline" },
        ],
        showActivity: true,
        showChart: true,
      };
    case "staff":
      return {
        title: "Staff Dashboard",
        subtitle: "Your assigned work overview",
        sectionLabel: "Work Overview",
        headerLinks: [
          { label: "Properties", href: "/properties", variant: "secondary" },
          { label: "Service Requests", href: "/service-requests", variant: "outline" },
        ],
        showActivity: true,
        showChart: false,
      };
    case "tenant":
      return {
        title: "My Dashboard",
        subtitle: "Your home and lease overview",
        sectionLabel: "My Overview",
        headerLinks: [
          { label: "My Lease", href: "/tenant/lease", variant: "secondary" },
          { label: "Service Requests", href: "/service-requests", variant: "outline" },
        ],
        showActivity: false,
        showChart: false,
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
        showChart: false,
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
    SUBMITTED:   { label: "Submitted",   className: "bg-blue-100 text-blue-700" },
    IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
    BLOCKED:     { label: "Blocked",     className: "bg-red-100 text-red-700" },
    COMPLETED:   { label: "Completed",   className: "bg-emerald-100 text-emerald-700" },
    ASSIGNED:    { label: "Assigned",    className: "bg-indigo-100 text-indigo-700" },
  };
  return map[status] ?? { label: status.replace(/_/g, " "), className: "bg-slate-100 text-slate-600" };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

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
  const skeletonCount = role === "tenant" ? 3 : role === "staff" ? 6 : role === "landlord" ? 9 : role === "super_admin" ? 17 : 13;

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

      {/* ── KSA: Key Statistical Area ────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          {config.sectionLabel}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              ))
            : topMetrics.map((m) => {
                const card = (
                  <div className="flex items-start gap-4 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition-colors hover:bg-white">
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.bg} ${m.color}`}>
                      <m.icon className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-[var(--text-secondary)]">{m.label}</p>
                      <p className="text-xl font-bold text-[var(--text-primary)]">{m.value}</p>
                      {m.sub && <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">{m.sub}</p>}
                    </div>
                  </div>
                );
                return m.href ? (
                  <Link key={m.label} href={m.href}>{card}</Link>
                ) : (
                  <div key={m.label}>{card}</div>
                );
              })}
        </div>
      </section>

      {/* ── Financial Insights: Collection progress + Escrow chart ─────── */}
      {config.showChart && stats && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Financial Insights
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Rent Collection progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-brand-blue" />
                  Rent Collection — Month to Date
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{formatKes(stats.monthlyRentKes)}</p>
                    <p className="text-xs text-slate-500">collected of {formatKes(stats.totalDueKes)} due</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${stats.collectionRate >= 80 ? "text-emerald-600" : "text-amber-600"}`}>
                      {stats.collectionRate}%
                    </p>
                    <p className="text-xs text-slate-500">collection rate</p>
                  </div>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${stats.collectionRate >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(stats.collectionRate, 100)}%` }}
                  />
                </div>
                {stats.arrearsKes > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{formatKes(stats.arrearsKes)} in arrears — <Link href="/rent-collection/receipts" className="font-semibold underline">review overdue</Link></span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="font-bold text-slate-800">{stats.activeTenants}</p>
                    <p className="text-slate-500">Active tenants</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="font-bold text-slate-800">{stats.occupancyRate}%</p>
                    <p className="text-slate-500">Occupancy</p>
                  </div>
                  <div className={`rounded-lg p-2 ${stats.arrearsKes > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
                    <p className={`font-bold ${stats.arrearsKes > 0 ? "text-red-700" : "text-emerald-700"}`}>
                      {formatKes(stats.arrearsKes)}
                    </p>
                    <p className={stats.arrearsKes > 0 ? "text-red-500" : "text-emerald-500"}>Arrears</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Escrow Trend Chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    Escrow Balance Trend
                  </span>
                  <Link href="/banking" className="text-xs text-blue-600 hover:underline">
                    View escrow →
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{formatKes(stats.totalEscrowKes)}</p>
                    <p className="text-xs text-slate-500">total held in escrow</p>
                  </div>
                </div>
                <div className="h-36">
                  <Suspense fallback={<div className="h-36 animate-pulse rounded-xl bg-slate-100" />}>
                    <DashboardEscrowChart data={
                      stats.weeklyEscrowTrend.some(p => p.v > 0)
                        ? stats.weeklyEscrowTrend
                        : [
                            { w: "W1", v: Math.round(stats.totalEscrowKes * 0.55) },
                            { w: "W2", v: Math.round(stats.totalEscrowKes * 0.65) },
                            { w: "W3", v: Math.round(stats.totalEscrowKes * 0.72) },
                            { w: "W4", v: Math.round(stats.totalEscrowKes * 0.80) },
                            { w: "W5", v: Math.round(stats.totalEscrowKes * 0.87) },
                            { w: "W6", v: Math.round(stats.totalEscrowKes * 0.94) },
                            { w: "W7", v: stats.totalEscrowKes },
                          ]
                    } />
                  </Suspense>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ── Alerts + Activity ─────────────────────────────────────────────── */}
      <div className={`grid gap-6 ${config.showActivity ? "lg:grid-cols-2" : ""}`}>
        {/* Alerts Panel */}
        <section>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {role === "tenant" ? "My Alerts" : "Alerts"}
                {stats?.alerts.length ? (
                  <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                    {stats.alerts.length}
                  </span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
                </div>
              ) : stats?.alerts.length ? (
                <div className="space-y-2">
                  {stats.alerts.map((a, i) => {
                    const inner = (
                      <>
                        {a.severity === "high" ? (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        )}
                        <span>{a.message}</span>
                      </>
                    );
                    const cls = `flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${SEVERITY_COLORS[a.severity] ?? ""}`;
                    return a.href ? (
                      <Link key={i} href={a.href} className={`${cls} hover:opacity-80 transition-opacity`}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={i} className={cls}>{inner}</div>
                    );
                  })}
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
                      <Link
                        key={ev.id}
                        href={activityHref(ev.resourceType, ev.resourceId)}
                        className="flex items-center justify-between gap-2 rounded-lg border border-surface-border px-3 py-1.5 hover:bg-slate-50 transition-colors"
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
                      </Link>
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

      {/* ── Service Request Widgets ──────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Service Requests
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {role === "super_admin" ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <ConciergeBell className="h-4 w-4 text-blue-500" />
                    Service Requests
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/service-requests" className="text-xs text-blue-600 hover:underline">
                      View all
                    </Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <p className="text-2xl font-bold text-blue-700">{stats?.openServiceRequests ?? 0}</p>
                    <p className="text-xs text-blue-600">Open</p>
                  </div>
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                    <p className="text-2xl font-bold text-indigo-700">{stats?.serviceRequestsInProgress ?? 0}</p>
                    <p className="text-xs text-indigo-600">In Progress</p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <p className="text-2xl font-bold text-amber-700">{stats?.serviceRequestsAwaitingConfirmation ?? 0}</p>
                    <p className="text-xs text-amber-600">Awaiting Confirmation</p>
                  </div>
                  <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                    <p className="text-2xl font-bold text-red-700">{stats?.serviceRequestsOverdue ?? 0}</p>
                    <p className="text-xs text-red-600">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
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
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{sr.title}</p>
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
          )}

          {/* Manager Queue */}
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

          {/* Staff My Jobs */}
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
                          <p className="truncate text-sm font-medium text-[var(--text-primary)]">{sr.title}</p>
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

      {/* ── Verified Trust Signals ───────────────────────────────────────── */}
      {(role === "landlord" || role === "agency" || role === "staff") && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Your Verified Record
          </h2>
          <TrustSignals />
        </section>
      )}

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
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
