"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Shield, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface TrustSignalData {
  leasesSigned: number | null;
  jobsCompleted: number | null;
  propertiesManaged: number | null;
  guestStaysHosted: number | null;
  screeningsCompleted: number | null;
}

interface TrustSignalsProps {
  userId?: string;
}

export function TrustSignals({ userId }: TrustSignalsProps) {
  const { user } = useAuth();
  const [signals, setSignals] = useState<TrustSignalData | null>(null);

  useEffect(() => {
    if (!user?.authToken) return;
    const target = userId ?? user.id;
    void fetch(`/api/v1/trust-signals?userId=${target}`, {
      headers: { Authorization: `Bearer ${user.authToken}` },
    })
      .then((r) => r.json())
      .then((j: { data: TrustSignalData }) => setSignals(j.data));
  }, [user, userId]);

  if (!signals) return null;

  const items: { label: string; value: number | null; format: (n: number) => string }[] = [
    { label: "verified leases signed on platform", value: signals.leasesSigned, format: (n) => `${n} verified lease${n === 1 ? "" : "s"} signed on platform` },
    { label: "jobs completed", value: signals.jobsCompleted, format: (n) => `${n} job${n === 1 ? "" : "s"} completed` },
    { label: "active managed properties", value: signals.propertiesManaged, format: (n) => `${n} active managed propert${n === 1 ? "y" : "ies"}` },
    { label: "guest stays hosted", value: signals.guestStaysHosted, format: (n) => `${n} guest stay${n === 1 ? "" : "s"} hosted` },
    { label: "tenant screenings processed", value: signals.screeningsCompleted, format: (n) => `${n} tenant screening${n === 1 ? "" : "s"} processed` },
  ];

  const visible = items.filter((i) => i.value !== null);
  if (!visible.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-blue-600" />
          Verified Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm text-slate-700">
            <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
            <span>{item.format(item.value!)}</span>
          </div>
        ))}
        <p className="pt-1 text-[11px] text-slate-400">
          Counts are derived from platform records and cannot be self-reported.
        </p>
      </CardContent>
    </Card>
  );
}
