"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatKes, cn } from "@/lib/utils";
import { Search, UserCheck } from "lucide-react";

type RentScore = {
  tenantId: string;
  score: number;
  consistency: number;
  totalPaidOnTime: number;
  totalPaidLate: number;
  totalArrears: number;
  averageDaysEarly: number;
};

type TenantOption = {
  tenantUserId: string;
  name: string;
  email: string;
  propertyName?: string | null;
  unitNumber?: string | null;
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
  const [tenantQuery, setTenantQuery] = useState("");
  const [tenantFocus, setTenantFocus] = useState(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [score, setScore] = useState<RentScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tenantWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.authToken) return;
    void (async () => {
      const res = await fetch("/api/v1/tenants", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: TenantOption[] };
        setTenants(json.data ?? []);
      }
    })();
  }, [user?.authToken]);

  const filteredTenants = useMemo(() => {
    const q = tenantQuery.trim().toLowerCase();
    if (!q) return tenants.slice(0, 20);
    return tenants
      .filter((t) => [t.name, t.email, t.propertyName, t.unitNumber].some((v) => v?.toLowerCase().includes(q)))
      .slice(0, 20);
  }, [tenants, tenantQuery]);

  function selectTenant(t: TenantOption) {
    setTenantId(t.tenantUserId);
    setTenantQuery(`${t.name} — ${t.email}`);
    setTenantFocus(false);
  }

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
            <div ref={tenantWrapRef} className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={tenantQuery}
                onChange={(e) => { setTenantQuery(e.target.value); setTenantId(""); }}
                onFocus={() => setTenantFocus(true)}
                onBlur={() => setTimeout(() => setTenantFocus(false), 250)}
                placeholder="Search tenant by name, email, property, or unit"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                autoComplete="off"
                onKeyDown={(e) => { if (e.key === "Enter") void handleLookup(); }}
              />
              {tenantFocus && filteredTenants.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {filteredTenants.map((t) => (
                    <button
                      key={t.tenantUserId}
                      type="button"
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-blue-50 ${tenantId === t.tenantUserId ? "bg-blue-50 text-blue-700" : ""}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectTenant(t)}
                    >
                      <UserCheck className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{t.name}</span>
                        <span className="block truncate text-xs text-slate-500">{t.email}</span>
                      </div>
                      {(t.propertyName || t.unitNumber) && (
                        <span className="shrink-0 truncate text-[11px] text-slate-400">
                          {t.propertyName}{t.propertyName && t.unitNumber ? " / " : ""}{t.unitNumber}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {tenantFocus && tenantQuery.trim().length > 0 && filteredTenants.length === 0 && (
                <p className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-lg">
                  No tenants found.
                </p>
              )}
            </div>
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
