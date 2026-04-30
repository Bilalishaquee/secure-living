"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { stessaKpis, incomeStatementRows } from "@/lib/stessa-modules-data";
import { formatKes } from "@/lib/utils";

export default function AccountingPage() {
  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Accounting</h1>
          <p className="app-page-lead">
            Stessa-style bookkeeping, income statement, and portfolio-level financial visibility.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-[var(--text-muted)]">Portfolio Value</p><p className="text-xl font-semibold">{formatKes(stessaKpis.portfolioValue)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-[var(--text-muted)]">Monthly Rent</p><p className="text-xl font-semibold">{formatKes(stessaKpis.monthlyRent)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-[var(--text-muted)]">Net Cash Flow</p><p className="text-xl font-semibold">{formatKes(stessaKpis.netCashFlow)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-[var(--text-muted)]">Occupancy</p><p className="text-xl font-semibold">{stessaKpis.occupancyRate}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Income Statement (Current Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {incomeStatementRows.map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-lg border border-surface-border px-3 py-2">
                <span className="text-sm text-[var(--text-secondary)]">{r.label}</span>
                <span className={`font-mono-data text-sm ${r.amount < 0 ? "text-red-600" : "text-[var(--text-primary)]"}`}>
                  {r.amount < 0 ? "-" : ""}{formatKes(Math.abs(r.amount))}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

