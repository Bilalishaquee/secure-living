"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

type Lease = {
  id: string;
  propertyId: string;
  unitId: string;
  tenantUserId: string;
  leaseType: string;
  rentAmount: number;
  status: string;
  startDate: string;
  endDate: string;
};

export default function LeasingPage() {
  const { user } = useAuth();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const res = await fetch("/api/v1/leases", { headers: { Authorization: `Bearer ${user.authToken ?? ""}` } });
      if (!res.ok) {
        setError("Unable to load leases.");
        return;
      }
      const json = (await res.json()) as { data: Lease[] };
      setLeases(json.data);
    })();
  }, [user]);

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Leasing</h1>
          <p className="app-page-lead">
            Lease pipeline, active agreements, and signing lifecycle.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active & Draft Leases</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="space-y-2">
            {leases.map((l) => (
              <div key={l.id} className="rounded-lg border border-surface-border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {l.propertyId} / {l.unitId}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize">{l.status}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Type: {l.leaseType} • Tenant: {l.tenantUserId} • Rent: KES {l.rentAmount.toLocaleString()}
                </p>
              </div>
            ))}
            {leases.length === 0 && !error ? (
              <p className="text-sm text-[var(--text-secondary)]">No leases found.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

