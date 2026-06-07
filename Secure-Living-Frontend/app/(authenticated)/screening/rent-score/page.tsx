"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatKes, cn } from "@/lib/utils";
import { Search } from "lucide-react";

type RentScore = {
  tenantId: string;
  score: number;
  consistency: number;
  totalPaidOnTime: number;
  totalPaidLate: number;
  totalArrears: number;
  averageDaysEarly: number;
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-100 border-emerald-300";
  if (score >= 50) return "bg-amber-100 border-amber-300";
  return "bg-red-100 border-red-300";
}

export default function RentScorePage() {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState("");
  const [score, setScore] = useState<RentScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup() {
    if (!user || !tenantId.trim()) return;
    setLoading(true);
    setError(null);
    setScore(null);
    try {
      const res = await fetch(`/api/v1/screening/rent-score?tenantId=${encodeURIComponent(tenantId.trim())}`, {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (!res.ok) {
        setError("Rent score not found for this tenant.");
        return;
      }
      const json = (await res.json()) as { data: RentScore[] };
      if (json.data && json.data.length > 0) {
        setScore(json.data[0]);
      } else {
        setError("Rent score not found for this tenant.");
      }
    } catch {
      setError("Failed to lookup rent score.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Rent Score</h1>
          <p className="app-page-lead">Look up a tenant&apos;s rent payment score.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenant Lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="Enter Tenant ID"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              onKeyDown={(e) => { if (e.key === "Enter") void handleLookup(); }}
            />
            <Button onClick={() => { void handleLookup(); }} disabled={!tenantId.trim() || loading}>
              <Search className="mr-1.5 h-4 w-4" /> {loading ? "Searching..." : "Lookup"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {score && (
        <div className="space-y-6">
          <div className={cn("rounded-2xl border-2 p-8 text-center", scoreBg(score.score))}>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Rent Score</p>
            <p className={cn("text-5xl font-bold", scoreColor(score.score))}>{score.score}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Based on {score.totalPaidOnTime + score.totalPaidLate} payments
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm text-[var(--text-secondary)]">Consistency</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{Math.round((score.consistency ?? 0) * 100) / 100}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm text-[var(--text-secondary)]">Paid on Time</p>
                <p className="text-2xl font-semibold text-emerald-600">{score.totalPaidOnTime}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm text-[var(--text-secondary)]">Paid Late</p>
                <p className="text-2xl font-semibold text-red-600">{score.totalPaidLate}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm text-[var(--text-secondary)]">Total Arrears</p>
                <p className="text-2xl font-semibold text-red-600">{formatKes(score.totalArrears)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-sm text-[var(--text-secondary)]">Avg Days Early</p>
                <p className="text-2xl font-semibold text-emerald-600">{score.averageDaysEarly}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
