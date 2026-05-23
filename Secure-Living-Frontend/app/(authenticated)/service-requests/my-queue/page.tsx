"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  PauseCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
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
  startedAt?: string;
  dueAt?: string;
  createdAt: string;
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  ASSIGNED: "bg-blue-100 text-blue-700 border-blue-200",
  SCHEDULING_PENDING: "bg-purple-100 text-purple-700 border-purple-200",
  IN_PROGRESS: "bg-emerald-100 text-emerald-700 border-emerald-200",
  BLOCKED: "bg-red-100 text-red-700 border-red-200",
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

// ─── Block Modal ──────────────────────────────────────────────────────────────

const BLOCKED_REASONS = [
  "AWAITING_LANDLORD_APPROVAL",
  "TENANT_UNAVAILABLE",
  "PROVIDER_UNAVAILABLE",
  "MISSING_MATERIALS",
  "LEGAL_DEPENDENCY",
  "PAYMENT_PENDING",
  "WEATHER_ACCESS_ISSUE",
  "OTHER",
];

function BlockModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reasonType: string, reason: string) => void;
  loading: boolean;
}) {
  const [reasonType, setReasonType] = useState("MISSING_MATERIALS");
  const [reason, setReason] = useState("");

  useEffect(() => { if (!open) { setReasonType("MISSING_MATERIALS"); setReason(""); } }, [open]);

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose(); }} title="Block Request" description="Explain why this job is blocked">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Reason Type</label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={reasonType}
            onChange={(e) => setReasonType(e.target.value)}
          >
            {BLOCKED_REASONS.map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        {reasonType === "OTHER" && (
          <div>
            <label className="block text-sm font-medium text-slate-700">Details <span className="text-red-500">*</span></label>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the blocking reason…"
            />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="border-red-500 bg-red-600 text-white hover:bg-red-700"
            onClick={() => onConfirm(reasonType, reason)}
            disabled={loading || (reasonType === "OTHER" && !reason.trim())}
          >
            {loading ? "Please wait…" : "Block Request"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Complete Modal ───────────────────────────────────────────────────────────

function CompleteModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState("");
  useEffect(() => { if (!open) setNotes(""); }, [open]);

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose(); }} title="Complete Job" description="Add resolution notes to close this job">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Resolution Notes <span className="text-red-500">*</span></label>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what was done…"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onConfirm(notes)}
            disabled={loading || !notes.trim()}
          >
            {loading ? "Please wait…" : "Mark Complete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MyQueuePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [rows, setRows] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  // Modal state
  const [blockTarget, setBlockTarget] = useState<string | null>(null);
  const [completeTarget, setCompleteTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filterStatus) params.set("srStatus", filterStatus);
      else {
        // Show only active work states by default
        params.set("assignedToUserId", user.id ?? "");
      }

      const res = await fetch(`/api/v1/service-requests?${params.toString()}`, {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as { data: ServiceRequest[] };
      // Filter client-side to show only this user's assigned work
      const active: SrStatus[] = ["ASSIGNED", "SCHEDULING_PENDING", "IN_PROGRESS", "BLOCKED"];
      const filtered = (json.data ?? []).filter((r) =>
        filterStatus ? r.srStatus === filterStatus : active.includes(r.srStatus)
      );
      setRows(filtered);
    } finally {
      setLoading(false);
    }
  }, [user?.authToken, user?.id, filterStatus]);

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

  // KPI counts
  const assigned = rows.filter((r) => r.srStatus === "ASSIGNED").length;
  const inProgress = rows.filter((r) => r.srStatus === "IN_PROGRESS").length;
  const blocked = rows.filter((r) => r.srStatus === "BLOCKED").length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">My Job Queue</h1>
          <p className="app-page-lead">Your assigned service requests — start, block, or complete jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Active Jobs</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="SCHEDULING_PENDING">Scheduling Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Assigned</p>
            <p className="text-2xl font-bold text-slate-900">{loading ? "—" : assigned}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">In Progress</p>
            <p className="text-2xl font-bold text-slate-900">{loading ? "—" : inProgress}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Blocked</p>
            <p className="text-2xl font-bold text-slate-900">{loading ? "—" : blocked}</p>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <CheckCircle2 className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">No active jobs</p>
            <p className="text-sm text-slate-500">You have no assigned or in-progress service requests right now.</p>
          </div>
        ) : (
          rows.map((sr) => {
            const isOverdue = sr.dueAt && new Date(sr.dueAt) < new Date() && sr.srStatus !== "COMPLETED";
            return (
              <div
                key={sr.id}
                className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
                  sr.srStatus === "BLOCKED" ? "border-red-300" : isOverdue ? "border-orange-300" : "border-slate-200"
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
                      {isOverdue && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-orange-600">
                          <AlertTriangle className="h-3 w-3" /> Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{sr.title}</p>
                    <p className="line-clamp-2 text-xs text-slate-500">{sr.description}</p>
                    {sr.dueAt && (
                      <p className="text-xs text-slate-400">
                        Due: {new Date(sr.dueAt).toLocaleDateString()}
                      </p>
                    )}
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

                    {/* Start */}
                    {(sr.srStatus === "ASSIGNED" || sr.srStatus === "SCHEDULING_PENDING") && (
                      <Button
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => void srAction(sr.id, "start")}
                      >
                        <Play className="mr-1 h-3.5 w-3.5" /> Start
                      </Button>
                    )}

                    {/* Block / Unblock */}
                    {sr.srStatus === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        disabled={actionLoading}
                        onClick={() => setBlockTarget(sr.id)}
                      >
                        <PauseCircle className="mr-1 h-3.5 w-3.5" /> Block
                      </Button>
                    )}
                    {sr.srStatus === "BLOCKED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                        onClick={() => void srAction(sr.id, "unblock", { resolutionNotes: "Blocker resolved" })}
                      >
                        Unblock
                      </Button>
                    )}

                    {/* Complete */}
                    {sr.srStatus === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={actionLoading}
                        onClick={() => setCompleteTarget(sr.id)}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Complete
                      </Button>
                    )}

                    {/* Cancel */}
                    {sr.srStatus !== "COMPLETED" && sr.srStatus !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-red-600"
                        disabled={actionLoading}
                        onClick={() => void srAction(sr.id, "cancel", { reason: "Cancelled by professional" })}
                      >
                        <XCircle className="h-4 w-4" />
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
      <BlockModal
        open={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        onConfirm={(reasonType, reason) => {
          if (!blockTarget) return;
          void srAction(blockTarget, "block", { blockedReasonType: reasonType, ...(reason ? { blockedReason: reason } : {}) })
            .then(() => setBlockTarget(null));
        }}
        loading={actionLoading}
      />

      <CompleteModal
        open={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={(notes) => {
          if (!completeTarget) return;
          void srAction(completeTarget, "complete", { resolutionNotes: notes })
            .then(() => setCompleteTarget(null));
        }}
        loading={actionLoading}
      />
    </div>
  );
}
