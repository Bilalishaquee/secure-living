"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

type MoveScore = {
  id: string;
  propertyId: string;
  unitId: string | null;
  score: number;
  riskLevel: string;
  predictedDate: string | null;
  generatedAt: string;
};

type LiveIntelligence = {
  id: string;
  organizationId: string;
  snapshotType: string;
  label: string;
  value: number;
  previousValue: number | null;
  trend: string;
  generatedAt: string;
};

function scoreColor(score: number): string {
  if (score >= 70) return "text-red-600";
  if (score >= 40) return "text-amber-600";
  return "text-emerald-600";
}

function riskBadgeVariant(risk: string): "error" | "warning" | "success" {
  const r = (risk ?? "").toLowerCase();
  if (r === "high") return "error";
  if (r === "medium") return "warning";
  return "success";
}

export default function IntelligencePage() {
  const { user } = useAuth();
  const [moveScores, setMoveScores] = useState<MoveScore[]>([]);
  const [snapshots, setSnapshots] = useState<LiveIntelligence[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("ALL");

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadData() {
    if (!user) return;
    const params = selectedProperty !== "ALL" ? `?propertyId=${selectedProperty}` : "";
    const [msRes, liRes] = await Promise.all([
      fetch(`/api/v1/intelligence/move-scores${params}`, { headers: authHeader() }),
      fetch(`/api/v1/intelligence/snapshots${params}`, { headers: authHeader() }),
    ]);
    if (msRes.ok) {
      const j = (await msRes.json()) as { data: MoveScore[] };
      setMoveScores(j.data ?? []);
    } else {
      setMoveScores([]);
    }
    if (liRes.ok) {
      const j = (await liRes.json()) as { data: LiveIntelligence[] };
      setSnapshots(j.data ?? []);
    } else {
      setSnapshots([]);
    }
  }

  useEffect(() => {
    void loadData();
  }, [user, selectedProperty]);

  const moveColumns: Column<MoveScore>[] = [
    { key: "propertyId", header: "Property", sortable: true, render: (r) => r.propertyId.slice(0, 8) },
    {
      key: "score",
      header: "Score",
      sortable: true,
      render: (r) => <span className={cn("font-semibold", scoreColor(r.score))}>{r.score}</span>,
    },
    {
      key: "riskLevel",
      header: "Risk Level",
      render: (r) => <Badge variant={riskBadgeVariant(r.riskLevel)}>{r.riskLevel}</Badge>,
    },
    {
      key: "predictedDate",
      header: "Predicted Date",
      render: (r) => r.predictedDate ? new Date(r.predictedDate).toLocaleDateString() : "—",
    },
  ];

  const snapColumns: Column<LiveIntelligence>[] = [
    { key: "label", header: "Label", sortable: true },
    { key: "snapshotType", header: "Type" },
    { key: "value", header: "Value" },
    {
      key: "trend",
      header: "Trend",
      render: (r) => {
        const color = r.trend === "up" ? "text-red-600" : r.trend === "down" ? "text-emerald-600" : "text-slate-600";
        return <span className={cn("font-medium", color)}>{(r.trend ?? "stable").toUpperCase()}</span>;
      },
    },
    {
      key: "generatedAt",
      header: "Generated",
      render: (r) => new Date(r.generatedAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">MoveScore & Live Intelligence</h1>
          <p className="app-page-lead">Predictive scoring and live intelligence insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--text-secondary)]">Filter by property:</label>
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Properties</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">MoveScore Records</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={moveScores} columns={moveColumns} rowKey={(r) => r.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Intelligence Snapshots</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={snapshots} columns={snapColumns} rowKey={(r) => r.id} />
        </CardContent>
      </Card>
    </div>
  );
}
