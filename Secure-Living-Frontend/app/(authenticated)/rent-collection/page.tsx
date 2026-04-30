"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatKes } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

type RentInvoice = {
  id: string;
  unitId: string;
  tenantId: string;
  totalDueKes: number;
  dueDate: string;
  status: string;
};

export default function RentCollectionPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<RentInvoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const res = await fetch("/api/v1/rent-invoices", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (!res.ok) {
        setError("Unable to load rent roll.");
        return;
      }
      const json = (await res.json()) as { data: RentInvoice[] };
      setRows(json.data);
    })();
  }, [user]);

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Rent Collection</h1>
          <p className="app-page-lead">Payment tracking, reminders, and delinquency monitoring.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rent Roll</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border border-surface-border px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {row.unitId} — {row.tenantId}
                  </p>
                  <p className="font-mono-data text-sm">{formatKes(row.totalDueKes)}</p>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Due {new Date(row.dueDate).toLocaleDateString()} • Status: {row.status}
                </p>
              </div>
            ))}
            {rows.length === 0 && !error ? (
              <p className="text-sm text-[var(--text-secondary)]">No rent invoices found.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

