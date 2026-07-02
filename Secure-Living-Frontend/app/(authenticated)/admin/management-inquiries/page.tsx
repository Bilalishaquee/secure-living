"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";

type InquiryStatus = "PENDING" | "INVITED" | "ACCEPTED" | "DECLINED" | "COMPLETED";

type Inquiry = {
  id: string;
  propertyId: string;
  landlordId: string;
  branchId: string;
  status: InquiryStatus;
  message: string | null;
  createdAt: string;
};

const STATUS_CONFIG: Record<InquiryStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  INVITED: { label: "Invited — awaiting landlord", color: "bg-blue-100 text-blue-700" },
  ACCEPTED: { label: "Accepted", color: "bg-emerald-100 text-emerald-700" },
  DECLINED: { label: "Declined", color: "bg-slate-100 text-slate-600" },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
};

export default function ManagementInquiriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/management-inquiries", {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: Inquiry[] };
        setInquiries(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.authToken]);

  useEffect(() => { void load(); }, [load]);

  async function respond(id: string, action: "invite" | "activate" | "decline") {
    if (!user?.authToken) return;
    setActingId(id);
    try {
      const res = await fetch(`/api/v1/management-inquiries/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.authToken}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast(
          action === "invite" ? "Invitation sent to landlord" : action === "activate" ? "Takeover activated" : "Inquiry declined",
          "success",
        );
        await load();
      } else {
        const j = (await res.json()) as { error?: string };
        toast(j.error ?? "Failed", "error");
      }
    } finally {
      setActingId(null);
    }
  }

  const pending = inquiries.filter((i) => i.status === "PENDING" || i.status === "INVITED");
  const resolved = inquiries.filter((i) => i.status !== "PENDING" && i.status !== "INVITED");

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Management Assistance Inquiries</h1>
          <p className="app-page-lead">
            Self-managed landlords who requested professional management. Send an invitation for the landlord to
            confirm, or activate the takeover directly.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-300" />
          <p className="text-lg font-medium text-slate-700">No pending inquiries</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((i) => {
            const sc = STATUS_CONFIG[i.status];
            return (
              <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 shrink-0 text-brand-blue" />
                  <div>
                    <p className="font-semibold text-slate-900">Property {i.propertyId}</p>
                    <p className="text-xs text-slate-500">Requested {new Date(i.createdAt).toLocaleDateString()}</p>
                    {i.message && <p className="mt-1 text-sm text-slate-600">{i.message}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.color}`}>{sc.label}</span>
                  {i.status === "PENDING" && (
                    <>
                      <Button size="sm" onClick={() => void respond(i.id, "invite")} disabled={actingId === i.id}>
                        Send Invitation
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => void respond(i.id, "activate")} disabled={actingId === i.id}>
                        Activate Now
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void respond(i.id, "decline")} disabled={actingId === i.id}>
                        Decline
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resolved.length > 0 && (
        <details className="rounded-xl border border-surface-border bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">Resolved inquiries ({resolved.length})</summary>
          <div className="mt-3 space-y-2">
            {resolved.map((i) => {
              const sc = STATUS_CONFIG[i.status];
              return (
                <div key={i.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <span>Property {i.propertyId}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.color}`}>{sc.label}</span>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
