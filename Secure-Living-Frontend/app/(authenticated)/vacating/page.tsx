"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";


const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:              { label: "Pending",             color: "bg-yellow-100 text-yellow-700" },
  ACKNOWLEDGED:         { label: "Acknowledged",        color: "bg-blue-100 text-blue-700" },
  INSPECTION_SCHEDULED: { label: "Inspection Scheduled", color: "bg-indigo-100 text-indigo-700" },
  INSPECTION_DONE:      { label: "Inspection Done",     color: "bg-teal-100 text-teal-700" },
  DEPOSIT_PROCESSING:   { label: "Deposit Processing",  color: "bg-orange-100 text-orange-700" },
  COMPLETED:            { label: "Completed",           color: "bg-green-100 text-green-700" },
};

type VacatingNotice = {
  id: string;
  tenantId: string;
  unitId: string;
  noticeDate: string;
  intendedMoveOut: string;
  enforcedMoveOut: string;
  status: string;
  inspection: unknown;
  depositRefund: unknown;
};

export default function VacatingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [notices, setNotices] = useState<VacatingNotice[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/vacating-notices`, {
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        const j = await res.json();
        setNotices(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  async function handleAction(id: string, action: string) {
    const res = await fetch(`/api/v1/vacating-notices/${id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user?.authToken}` },
    });
    if (res.ok) {
      toast({ title: "Updated successfully", variant: "success" });
      load();
    } else {
      const j = await res.json();
      toast({ title: j.error ?? "Failed", variant: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vacating Notices</h1>
        <p className="mt-1 text-sm text-slate-500">Manage move-out notices, inspections, and deposit refunds</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : notices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <LogOut className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No vacating notices</p>
            <p className="mt-1 text-sm text-slate-500">Tenant vacating notices will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tenant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Notice Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Move-Out</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notices.map((n) => {
                const sc = STATUS_CONFIG[n.status] ?? { label: n.status, color: "bg-slate-100 text-slate-700" };
                return (
                  <tr key={n.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{n.tenantId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-slate-600">{n.unitId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(n.noticeDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(n.intendedMoveOut).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sc.color}`}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {n.status === "PENDING" && (
                          <Button size="sm" variant="ghost" onClick={() => handleAction(n.id, "acknowledge")}>Acknowledge</Button>
                        )}
                        {n.status === "ACKNOWLEDGED" && (
                          <Button size="sm" variant="ghost" onClick={() => router.push(`/vacating/${n.id}`)}>Schedule Inspection</Button>
                        )}
                        {n.status === "INSPECTION_SCHEDULED" && (
                          <Button size="sm" variant="ghost" onClick={() => router.push(`/vacating/${n.id}`)}>Complete Inspection</Button>
                        )}
                        {n.status === "INSPECTION_DONE" && (
                          <Button size="sm" variant="ghost" onClick={() => handleAction(n.id, "process-refund")}>Process Refund</Button>
                        )}
                        {n.status === "DEPOSIT_PROCESSING" && (
                          <Button size="sm" variant="ghost" onClick={() => router.push(`/vacating/${n.id}`)}>Mark Paid</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/vacating/${n.id}`)}>View</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
