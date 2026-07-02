"use client";

import { useEffect, useState } from "react";
import {
  Building2, Users, ConciergeBell, Wrench, DollarSign, HeartPulse,
  BrainCircuit, Radar, ShoppingBag, TrendingUp, Bell, ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type PlatformStats = {
  totalOrganizations?: number;
  activeLandlords?: number;
  activePropertyManagers?: number;
  activeProviders?: number;
  openServiceRequests?: number;
  serviceRequestsInProgress?: number;
  serviceRequestsAwaitingConfirmation?: number;
  serviceRequestsOverdue?: number;
};

type Insights = {
  revenueFinance: {
    monthlyTransactionVolumeKes: number;
    monthlyTransactionFeesKes: number;
    monthlyTransactionCount: number;
    monthlySubscriptionRevenueKes: number;
    activeSubscriptions: number;
    pendingSubscriptionInvoices: number;
  };
  platformHealth: { slaBreaches90d: number; openDisputes: number };
  marketplacePerformance: {
    providersByStatus: { status: string; count: number }[];
    avgDisputeRate: number;
    avgCancellationRate: number;
    totalJobsCompleted: number;
  };
  growthAcquisition: { newOrganizations30d: number; newUsers30d: number; referralActivity90d: number };
  alertsLiveActivity: { id: string; action: string; resourceType: string | null; role: string | null; timestamp: string }[];
};

type RoleAssignment = {
  id: string;
  status: string;
  user: { id: string; fullName: string; email: string };
  role: { id: string; slug: string; displayName: string };
  organization: { id: string; name: string };
};

const SECTIONS = [
  { key: "overview", label: "Platform Overview", icon: Building2 },
  { key: "revenue", label: "Revenue & Finance", icon: DollarSign },
  { key: "health", label: "Platform Health", icon: HeartPulse },
  { key: "intelligence", label: "Intelligence Centre", icon: BrainCircuit },
  { key: "operations", label: "Operations Command Centre", icon: Radar },
  { key: "marketplace", label: "Marketplace Performance", icon: ShoppingBag },
  { key: "growth", label: "Growth & Acquisition", icon: TrendingUp },
  { key: "alerts", label: "Alerts & Live Activity", icon: Bell },
  { key: "duties", label: "Duty Assignment", icon: ShieldAlert },
] as const;

const fmtKes = (n: number) => `KES ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const [section, setSection] = useState<typeof SECTIONS[number]["key"]>("overview");
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${user.authToken}` };
      const [statsRes, insightsRes, assignmentsRes] = await Promise.all([
        fetch(`/api/v1/dashboard/stats`, { headers }),
        fetch(`/api/v1/admin/platform-insights`, { headers }),
        fetch(`/api/v1/admin/role-assignments?roleSlug=admin`, { headers }),
      ]);
      if (statsRes.ok) setStats((await statsRes.json()).data);
      if (insightsRes.ok) setInsights((await insightsRes.json()).data);
      if (assignmentsRes.ok) setAssignments((await assignmentsRes.json()).data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.authToken]);

  async function toggleAssignment(a: RoleAssignment) {
    const nextStatus = a.status === "active" ? "suspended" : "active";
    const res = await fetch(`/api/v1/admin/role-assignments/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) load();
  }

  if (user?.role !== "super_admin" && !user?.permissions?.includes("*")) {
    return <p className="text-slate-500">Super Admin access required.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Super Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Platform-wide command centre</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              section === s.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <s.icon className="h-3.5 w-3.5" /> {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : (
        <>
          {section === "overview" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Building2} label="Total Organisations" value={stats?.totalOrganizations ?? 0} />
              <StatCard icon={Users} label="Active Landlords" value={stats?.activeLandlords ?? 0} />
              <StatCard icon={ConciergeBell} label="Active Property Managers" value={stats?.activePropertyManagers ?? 0} />
              <StatCard icon={Wrench} label="Active Providers" value={stats?.activeProviders ?? 0} />
            </div>
          )}

          {section === "revenue" && insights && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={DollarSign} label="Transaction Volume (MTD)" value={fmtKes(insights.revenueFinance.monthlyTransactionVolumeKes)} />
              <StatCard icon={DollarSign} label="Platform Fees (MTD)" value={fmtKes(insights.revenueFinance.monthlyTransactionFeesKes)} />
              <StatCard icon={DollarSign} label="Subscription Revenue (MTD)" value={fmtKes(insights.revenueFinance.monthlySubscriptionRevenueKes)} />
              <StatCard icon={Users} label="Active Subscriptions" value={insights.revenueFinance.activeSubscriptions} />
              <StatCard icon={ShieldAlert} label="Pending Invoices" value={insights.revenueFinance.pendingSubscriptionInvoices} />
              <StatCard icon={DollarSign} label="Transactions (MTD)" value={insights.revenueFinance.monthlyTransactionCount} />
            </div>
          )}

          {section === "health" && insights && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard icon={HeartPulse} label="SLA Breaches (90d)" value={insights.platformHealth.slaBreaches90d} tone={insights.platformHealth.slaBreaches90d > 0 ? "warn" : "ok"} />
              <StatCard icon={ShieldAlert} label="Open Disputes" value={insights.platformHealth.openDisputes} tone={insights.platformHealth.openDisputes > 0 ? "warn" : "ok"} />
            </div>
          )}

          {section === "intelligence" && (
            <Card>
              <CardContent className="p-8 text-center text-sm text-slate-500">
                Move-Score, Rent-Score and Live Intelligence aggregates are available per-property under
                <a href="/intelligence" className="ml-1 text-blue-600 hover:underline">MoveScore &amp; Intel</a>. A platform-wide rollup will land once enough properties opt in.
              </CardContent>
            </Card>
          )}

          {section === "operations" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={ConciergeBell} label="Open" value={stats?.openServiceRequests ?? 0} />
              <StatCard icon={ConciergeBell} label="In Progress" value={stats?.serviceRequestsInProgress ?? 0} />
              <StatCard icon={ConciergeBell} label="Awaiting Confirmation" value={stats?.serviceRequestsAwaitingConfirmation ?? 0} />
              <StatCard icon={ShieldAlert} label="Overdue" value={stats?.serviceRequestsOverdue ?? 0} tone={(stats?.serviceRequestsOverdue ?? 0) > 0 ? "warn" : "ok"} />
            </div>
          )}

          {section === "marketplace" && insights && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard icon={Wrench} label="Jobs Completed" value={insights.marketplacePerformance.totalJobsCompleted} />
                <StatCard icon={ShieldAlert} label="Avg Dispute Rate" value={`${(insights.marketplacePerformance.avgDisputeRate * 100).toFixed(1)}%`} />
                <StatCard icon={ShieldAlert} label="Avg Cancellation Rate" value={`${(insights.marketplacePerformance.avgCancellationRate * 100).toFixed(1)}%`} />
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">Providers by Status</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  {insights.marketplacePerformance.providersByStatus.map((p) => (
                    <span key={p.status} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {p.status.replace(/_/g, " ")}: {p.count}
                    </span>
                  ))}
                  {insights.marketplacePerformance.providersByStatus.length === 0 && (
                    <p className="text-sm text-slate-400">No providers yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {section === "growth" && insights && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard icon={Building2} label="New Organisations (30d)" value={insights.growthAcquisition.newOrganizations30d} />
              <StatCard icon={Users} label="New Users (30d)" value={insights.growthAcquisition.newUsers30d} />
              <StatCard icon={TrendingUp} label="Referral Activity (90d)" value={insights.growthAcquisition.referralActivity90d} />
            </div>
          )}

          {section === "alerts" && insights && (
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Platform Activity</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {insights.alertsLiveActivity.map((a) => (
                  <div key={a.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
                    <span className="text-slate-700">
                      <span className="font-medium">{a.action}</span>
                      {a.resourceType && <span className="text-slate-400"> · {a.resourceType}</span>}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(a.timestamp).toLocaleString()}</span>
                  </div>
                ))}
                {insights.alertsLiveActivity.length === 0 && <p className="text-sm text-slate-400">No recent activity</p>}
              </CardContent>
            </Card>
          )}

          {section === "duties" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Assign Duties &amp; Restrict Managers</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Manager</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Organisation</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignments.map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-3 text-slate-800">{a.user?.fullName ?? "—"}<p className="text-xs text-slate-400">{a.user?.email}</p></td>
                        <td className="px-4 py-3 text-slate-600">{a.organization?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{a.role?.displayName ?? a.role?.slug}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline" onClick={() => toggleAssignment(a)}>
                            {a.status === "active" ? "Restrict" : "Reinstate"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {assignments.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No admin/manager role assignments found</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "neutral" }: { icon: typeof Building2; label: string; value: string | number; tone?: "ok" | "warn" | "neutral" }) {
  const toneClass = tone === "warn" ? "text-red-600 bg-red-50" : tone === "ok" ? "text-emerald-600 bg-emerald-50" : "text-slate-700 bg-slate-50";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
