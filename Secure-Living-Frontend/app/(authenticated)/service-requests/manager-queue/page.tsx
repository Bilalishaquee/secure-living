"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ConciergeBell,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ArrowRight,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

// ─── Types ────────────────────────────────────────────────────────────────────

type SrStatus =
  | "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"
  | "QUOTING" | "AWAITING_FUNDING" | "FUNDED" | "ASSIGNED"
  | "SCHEDULING_PENDING" | "IN_PROGRESS" | "BLOCKED"
  | "COMPLETED" | "CANCELLED" | "DISPUTED";

type SrPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT" | "EMERGENCY";

type ServiceRequestType =
  | "MAINTENANCE" | "INSPECTION" | "LEGAL" | "PROXY" | "VALUATION"
  | "CLEANING" | "FOOD_DELIVERY" | "AIRPORT_TRANSFER" | "GUEST_ASSISTANCE" | "CUSTOM";

interface ServiceRequest {
  id: string;
  title: string;
  srStatus: SrStatus;
  srPriority: SrPriority;
  serviceType: ServiceRequestType;
  description: string;
  unitId?: string;
  propertyId?: string;
  dueAt?: string;
  createdAt: string;
  slaPolicyId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  SUBMITTED: "bg-yellow-100 text-yellow-700 border-yellow-200",
  APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  QUOTING: "bg-purple-100 text-purple-700 border-purple-200",
  AWAITING_FUNDING: "bg-orange-100 text-orange-700 border-orange-200",
  IN_PROGRESS: "bg-emerald-100 text-emerald-700 border-emerald-200",
  BLOCKED: "bg-red-200 text-red-800 border-red-300",
  DISPUTED: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
};

const PRIORITY_STYLE: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  NORMAL: "bg-blue-50 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
  EMERGENCY: "bg-red-200 text-red-900 font-bold",
};

function StatusBadge({ status }: { status: SrStatus }) {
  const cls = STATUS_STYLE[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: SrPriority }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLE[priority] ?? ""}`}>
      {priority}
    </span>
  );
}

function slaDanger(dueAt?: string): boolean {
  if (!dueAt) return false;
  const diff = new Date(dueAt).getTime() - Date.now();
  return diff < 2 * 60 * 60 * 1000; // within 2 hours
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (!open) setReason(""); }, [open]);

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose(); }} title="Reject Request" description="Provide a reason for rejection">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Reason <span className="text-red-500">*</span></label>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this request being rejected?"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="border-red-500 bg-red-600 text-white hover:bg-red-700"
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
          >
            {loading ? "Please wait…" : "Reject"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const QUEUE_TABS: { label: string; statuses: SrStatus[] }[] = [
  { label: "Needs Approval", statuses: ["SUBMITTED"] },
  { label: "Active", statuses: ["APPROVED", "QUOTING", "AWAITING_FUNDING", "FUNDED", "ASSIGNED", "SCHEDULING_PENDING", "IN_PROGRESS"] },
  { label: "Blocked", statuses: ["BLOCKED"] },
  { label: "Disputed", statuses: ["DISPUTED"] },
  { label: "Closed", statuses: ["COMPLETED", "REJECTED", "CANCELLED"] },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ManagerQueuePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [rows, setRows] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/service-requests?limit=100", {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as { data: ServiceRequest[] };
      setRows(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [user?.authToken]);

  useEffect(() => { void load(); }, [load]);

  async function srAction(id: string, action: string, body?: Record<string, unknown>) {
    if (!user?.authToken) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/service-requests/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.authToken}` },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        toast(err.message ?? "Action failed", "error");
        return;
      }
      toast("Updated successfully", "success");
      await load();
    } catch {
      toast("An error occurred", "error");
    } finally {
      setActionLoading(false);
    }
  }

  const visibleRows = rows.filter((r) => QUEUE_TABS[activeTab]?.statuses.includes(r.srStatus));

  // KPI counts
  const needsApproval = rows.filter((r) => r.srStatus === "SUBMITTED").length;
  const blocked = rows.filter((r) => r.srStatus === "BLOCKED").length;
  const disputed = rows.filter((r) => r.srStatus === "DISPUTED").length;
  const slaBreach = rows.filter((r) => slaDanger(r.dueAt) && !["COMPLETED", "CANCELLED", "REJECTED"].includes(r.srStatus)).length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Manager Queue</h1>
          <p className="app-page-lead">Review, approve, and oversee all service requests in your organisation</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-yellow-700">Needs Approval</p>
            <p className="text-2xl font-bold text-yellow-900">{loading ? "—" : needsApproval}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-red-700">Blocked</p>
            <p className="text-2xl font-bold text-red-900">{loading ? "—" : blocked}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-fuchsia-700">Disputed</p>
            <p className="text-2xl font-bold text-fuchsia-900">{loading ? "—" : disputed}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
            <ConciergeBell className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-orange-700">SLA Near Breach</p>
            <p className="text-2xl font-bold text-orange-900">{loading ? "—" : slaBreach}</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {QUEUE_TABS.map((tab, i) => {
          const count = rows.filter((r) => tab.statuses.includes(r.srStatus)).length;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === i
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                  activeTab === i ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))
        ) : visibleRows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <CheckCircle2 className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">Nothing here</p>
            <p className="text-sm text-slate-500">No requests in this category right now.</p>
          </div>
        ) : (
          visibleRows.map((sr) => {
            const danger = slaDanger(sr.dueAt) && !["COMPLETED", "CANCELLED", "REJECTED"].includes(sr.srStatus);
            return (
              <div
                key={sr.id}
                className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
                  danger ? "border-orange-300" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={sr.srStatus} />
                      <PriorityBadge priority={sr.srPriority} />
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        {sr.serviceType.replace(/_/g, " ")}
                      </span>
                      {danger && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-orange-600">
                          <AlertTriangle className="h-3 w-3" /> SLA at risk
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{sr.title}</p>
                    <p className="line-clamp-2 text-xs text-slate-500">{sr.description}</p>
                    <p className="text-xs text-slate-400">
                      Submitted: {new Date(sr.createdAt).toLocaleDateString()}
                      {sr.dueAt && (
                        <span className="ml-3">Due: {new Date(sr.dueAt).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* View details */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/service-requests/${sr.id}`)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    {/* Approve / Reject for SUBMITTED */}
                    {sr.srStatus === "SUBMITTED" && (
                      <>
                        <Button
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => void srAction(sr.id, "approve")}
                        >
                          <ThumbsUp className="mr-1 h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          disabled={actionLoading}
                          onClick={() => setRejectTarget(sr.id)}
                        >
                          <ThumbsDown className="mr-1 h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    )}

                    {/* Escalate for BLOCKED / urgent */}
                    {sr.srStatus === "BLOCKED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-300 text-orange-700"
                        disabled={actionLoading}
                        onClick={() => void srAction(sr.id, "escalate", { escalatedTo: "senior-manager", reason: "Manually escalated by manager" })}
                      >
                        <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Escalate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <RejectModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          if (!rejectTarget) return;
          void srAction(rejectTarget, "reject", { reason }).then(() => setRejectTarget(null));
        }}
        loading={actionLoading}
      />
    </div>
  );
}
