"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

type MicroBehavior = {
  id: string;
  tenantId: string;
  behaviorType: string;
  label: string;
  value: string | null;
  score: number | null;
  detectedAt: string;
};

const BEHAVIOR_TYPES = ["early_payment", "utility_spike", "visitor_frequency", "repeated_complaint", "late_payment", "maintenance_request_pattern"];

export default function MicroBehaviorsPage() {
  const { user } = useAuth();
  const [behaviors, setBehaviors] = useState<MicroBehavior[]>([]);
  const [filterTenant, setFilterTenant] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const params = new URLSearchParams();
      if (filterTenant) params.set("tenantId", filterTenant);
      if (filterType !== "ALL") params.set("behaviorType", filterType);
      const res = await fetch(`/api/v1/compliance/micro-behaviors?${params.toString()}`, {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: MicroBehavior[] };
        setBehaviors(json.data);
      }
    })();
  }, [user, filterTenant, filterType]);

  const columns: Column<MicroBehavior>[] = [
    { key: "tenantId", header: "Tenant", sortable: true },
    { key: "behaviorType", header: "Type" },
    { key: "label", header: "Label", sortable: true },
    { key: "value", header: "Value", render: (r) => r.value ?? "—" },
    {
      key: "score",
      header: "Score",
      sortable: true,
      render: (r) => {
        if (r.score == null) return "—";
        const color = r.score >= 70 ? "text-red-600" : r.score >= 40 ? "text-amber-600" : "text-emerald-600";
        return <span className={`font-semibold ${color}`}>{r.score}</span>;
      },
    },
    {
      key: "detectedAt",
      header: "Detected",
      render: (r) => new Date(r.detectedAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">MicroBehavior</h1>
          <p className="app-page-lead">Track micro-behavior patterns by tenant.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Behavior Records</CardTitle>
            <div className="flex gap-2">
              <input
                placeholder="Filter by tenant ID"
                value={filterTenant}
                onChange={(e) => setFilterTenant(e.target.value)}
                className="w-48 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Behavior type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {BEHAVIOR_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable data={behaviors} columns={columns} rowKey={(r) => r.id} />
        </CardContent>
      </Card>
    </div>
  );
}
