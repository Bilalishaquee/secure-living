"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { investmentDeals } from "@/lib/stessa-modules-data";
import { formatKes } from "@/lib/utils";

export default function InvestmentsPage() {
  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Investment Properties</h1>
          <p className="app-page-lead">
            Deal pipeline and underwriting-style discovery view.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deal Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {investmentDeals.map((d) => (
              <div key={d.id} className="rounded-lg border border-surface-border px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{d.title}</p>
                  <p className="font-mono-data text-sm">{formatKes(d.ask)}</p>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {d.city} • Cap Rate {d.capRate}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

