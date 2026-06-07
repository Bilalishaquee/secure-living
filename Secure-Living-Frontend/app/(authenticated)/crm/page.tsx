"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatKes } from "@/lib/utils";
import { Building2, Users, DollarSign, Wrench, Eye, EyeOff, Plus, FileText, Zap, UserPlus, CreditCard, Upload, ArrowUpRight } from "lucide-react";

type DashboardData = {
  propertiesCount: number;
  unitsTotal: number;
  unitsOccupied: number;
  unitsVacant: number;
  activeTenantsCount: number;
  rentCollectedKes: number;
  rentOverdueKes: number;
  maintenanceRequestsCount: number;
};

type Widget = {
  id: string;
  label: string;
  visible: boolean;
};

export default function CrmDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: "properties", label: "Properties Overview", visible: true },
    { id: "units", label: "Units Overview", visible: true },
    { id: "tenants", label: "Active Tenants", visible: true },
    { id: "rent", label: "Rent Summary", visible: true },
    { id: "maintenance", label: "Maintenance Requests", visible: true },
    { id: "actions", label: "Quick Actions", visible: true },
  ]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const res = await fetch("/api/v1/crm/dashboard", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: DashboardData };
        setData(json.data);
      }
    })();
  }, [user]);

  const toggleWidget = (id: string) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  };

  const quickActions = [
    { label: "Add Tenant", icon: <UserPlus className="h-4 w-4" />, href: "/tenants/new" },
    { label: "Create Invoice", icon: <FileText className="h-4 w-4" />, href: "/rent-collection" },
    { label: "Upload Utility Bill", icon: <Zap className="h-4 w-4" />, href: "/utilities" },
    { label: "Record Payment", icon: <CreditCard className="h-4 w-4" />, href: "/rent-collection" },
    { label: "Add Visitor", icon: <Users className="h-4 w-4" />, href: "/visitors" },
    { label: "Upload Lease", icon: <Upload className="h-4 w-4" />, href: "/leasing" },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">CRM Dashboard</h1>
          <p className="app-page-lead">Customer relationship management overview and quick actions.</p>
        </div>
        <div className="flex gap-2">
          {widgets.map((w) => (
            <Button key={w.id} variant="ghost" size="sm" onClick={() => toggleWidget(w.id)}>
              {w.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="text-xs">{w.visible ? "Hide" : "Show"} {w.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {widgets.find((w) => w.id === "properties")?.visible && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-brand-blue">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Properties</p>
                  <p className="text-2xl font-semibold text-[var(--text-primary)]">{data?.propertiesCount ?? "--"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {widgets.find((w) => w.id === "units")?.visible && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Units Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xl font-semibold text-[var(--text-primary)]">{data?.unitsTotal ?? "--"}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Total</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-emerald-600">{data?.unitsOccupied ?? "--"}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Occupied</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-red-600">{data?.unitsVacant ?? "--"}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Vacant</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {widgets.find((w) => w.id === "tenants")?.visible && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Active Tenants</p>
                  <p className="text-2xl font-semibold text-[var(--text-primary)]">{data?.activeTenantsCount ?? "--"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {widgets.find((w) => w.id === "rent")?.visible && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Rent Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Collected</span>
                  <span className="text-sm font-semibold text-emerald-600">{data?.rentCollectedKes != null ? formatKes(data.rentCollectedKes) : "--"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">Overdue</span>
                  <span className="text-sm font-semibold text-red-600">{data?.rentOverdueKes != null ? formatKes(data.rentOverdueKes) : "--"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {widgets.find((w) => w.id === "maintenance")?.visible && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Maintenance Requests</p>
                  <p className="text-2xl font-semibold text-[var(--text-primary)]">{data?.maintenanceRequestsCount ?? "--"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {widgets.find((w) => w.id === "actions")?.visible && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Button key={action.label} variant="outline" size="sm" asChild>
                    <a href={action.href}>
                      {action.icon}
                      {action.label}
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
