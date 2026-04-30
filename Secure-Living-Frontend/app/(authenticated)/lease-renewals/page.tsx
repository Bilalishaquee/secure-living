"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

type Renewal = {
  id: string;
  leaseId: string;
  propertyId: string;
  unitId: string;
  tenantUserId: string;
  expiryDate: string;
  status: string;
};

function daysLeft(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function LeaseRenewalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Renewal[]>([]);
  const [tab, setTab] = useState("expiring");

  async function load() {
    if (!user?.id) return;
    const res = await fetch("/api/v1/lease-renewal-alerts", { headers: { Authorization: `Bearer ${user.authToken ?? ""}` } });
    if (!res.ok) return;
    const json = (await res.json()) as { data: Renewal[] };
    setRows(json.data);
  }

  useEffect(() => {
    void load();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = useMemo(() => {
    const expiring = rows.filter((r) => daysLeft(r.expiryDate) <= 30 && r.status !== "renewed");
    const upcoming = rows.filter((r) => daysLeft(r.expiryDate) > 30 && daysLeft(r.expiryDate) <= 90 && r.status !== "renewed");
    const renewed = rows.filter((r) => r.status === "renewed");
    return { expiring, upcoming, renewed };
  }, [rows]);

  async function markRenewed(id: string) {
    if (!user?.id) return;
    await fetch(`/api/v1/lease-renewal-alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.authToken ?? ""}` },
      body: JSON.stringify({ status: "renewed" }),
    });
    toast("Marked as renewed", "success");
    await load();
  }

  function color(days: number) {
    if (days < 30) return "text-red-600";
    if (days < 60) return "text-amber-600";
    return "text-green-700";
  }

  const renderCards = (items: Renewal[]) => (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((row) => {
        const remaining = daysLeft(row.expiryDate);
        return (
          <Card key={row.id}>
            <CardHeader>
              <CardTitle className="text-base">Unit {row.unitId}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Tenant: {row.tenantUserId}</p>
              <p>Property: {row.propertyId}</p>
              <p>Lease end: {new Date(row.expiryDate).toLocaleDateString()}</p>
              <p className={color(remaining)}>Days remaining: {remaining}</p>
              <div className="pt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toast("Renewal notice sent", "success")}>Send Renewal Notice</Button>
                {row.status !== "renewed" ? <Button size="sm" onClick={() => { void markRenewed(row.id); }}>Mark as Renewed</Button> : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
      {!items.length ? <p className="text-sm text-[var(--text-secondary)]">No lease renewals in this group.</p> : null}
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Lease Renewals</h1>
          <p className="app-page-lead">Track upcoming expiries and renewal actions.</p>
        </div>
      </div>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "expiring", label: "Expiring Soon", content: renderCards(grouped.expiring) },
          { id: "upcoming", label: "Upcoming", content: renderCards(grouped.upcoming) },
          { id: "renewed", label: "Renewed", content: renderCards(grouped.renewed) },
        ]}
      />
    </div>
  );
}
