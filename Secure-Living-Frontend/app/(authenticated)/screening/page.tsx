"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

type ScreeningReport = {
  id: string;
  applicantName: string;
  score: number | null;
  recommendation: string;
  status: string;
};

export default function ScreeningPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ScreeningReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const res = await fetch("/api/v1/screening-reports", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (!res.ok) {
        setError("Unable to load screening reports.");
        return;
      }
      const json = (await res.json()) as { data: ScreeningReport[] };
      setRows(json.data);
    })();
  }, [user]);

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Tenant Screening</h1>
          <p className="app-page-lead">Application review, risk checks, and approval decisions.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Screening Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between rounded-lg border border-surface-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{row.applicantName}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Recommendation: {row.recommendation}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono-data text-sm">Score {row.score ?? "--"}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{row.status}</p>
                </div>
              </div>
            ))}
            {rows.length === 0 && !error ? (
              <p className="text-sm text-[var(--text-secondary)]">No screening reports yet.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

