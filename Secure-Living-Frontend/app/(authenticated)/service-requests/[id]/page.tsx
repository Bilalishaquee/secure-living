"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Upload,
  ChevronDown,
  X,
  DollarSign,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusTimeline, type TimelineStep } from "@/components/ui/StatusTimeline";

// ─── Types ────────────────────────────────────────────────────────────────────

type SRStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "QUOTING"
  | "AWAITING_FUNDING"
  | "FUNDED"
  | "ASSIGNED"
  | "SCHEDULING_PENDING"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

type SRPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type ServiceType =
  | "MAINTENANCE"
  | "INSPECTION"
  | "LEGAL"
  | "PROXY"
  | "VALUATION"
  | "CLEANING"
  | "FOOD_DELIVERY"
  | "AIRPORT_TRANSFER"
  | "GUEST_ASSISTANCE"
  | "CUSTOM";

interface StatusHistoryEntry {
  id: string;
  fromStatus?: string;
  toStatus: string;
  changedBy?: string;
  changedAt: string;
  note?: string;
}

interface Assignment {
  id: string;
  assignedTo: string;
  assignedBy?: string;
  assignedAt: string;
  isActive: boolean;
}

interface Quote {
  id: string;
  amount: number;
  scope?: string;
  validUntil?: string;
  status: string;
  submittedBy?: string;
  createdAt: string;
}

interface Evidence {
  id: string;
  fileUrl: string;
  caption?: string;
  uploadedBy?: string;
  createdAt: string;
}

interface Escalation {
  id: string;
  reason: string;
  escalatedBy?: string;
  escalatedAt: string;
  resolvedAt?: string;
}

interface ServiceRequest {
  id: string;
  title: string;
  description?: string;
  serviceType: ServiceType;
  srPriority: SRPriority;
  srStatus: SRStatus;
  serviceMode?: string;
  srCategory?: string;
  propertyId?: string;
  unitId?: string;
  assignedTo?: string;
  createdAt: string;
  dueAt?: string;
  metadata?: Record<string, unknown>;
  slaPolicyId?: string;
  shortStayBookingId?: string;
  paymentStatus?: string;
  paymentResponsibility?: string;
  serviceChargeAmount?: number;
  blockedReasonType?: string;
  blockedReason?: string;
  statusHistory?: StatusHistoryEntry[];
  assignments?: Assignment[];
  quotes?: Quote[];
  evidence?: Evidence[];
  escalations?: Escalation[];
}

interface Provider {
  id: string;
  userId: string;
  email?: string;
  name?: string;
  category?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtShort(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status: SRStatus) {
  const map: Record<SRStatus, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
    SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-700 border-blue-200" },
    APPROVED: { label: "Approved", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200" },
    QUOTING: { label: "Quoting", className: "bg-purple-100 text-purple-700 border-purple-200" },
    AWAITING_FUNDING: { label: "Awaiting Funding", className: "bg-orange-100 text-orange-700 border-orange-200" },
    FUNDED: { label: "Funded", className: "bg-teal-100 text-teal-700 border-teal-200" },
    ASSIGNED: { label: "Assigned", className: "bg-blue-100 text-blue-700 border-blue-200" },
    SCHEDULING_PENDING: { label: "Scheduling", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-700 border-blue-200" },
    BLOCKED: { label: "Blocked", className: "bg-red-100 text-red-700 border-red-200" },
    COMPLETED: { label: "Completed", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    CANCELLED: { label: "Cancelled", className: "bg-slate-100 text-slate-500 border-slate-200" },
    DISPUTED: { label: "Disputed", className: "bg-red-100 text-red-700 border-red-200" },
  };
  const s = map[status] ?? { label: status, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}

function priorityBadge(priority: SRPriority) {
  const map: Record<SRPriority, { label: string; className: string }> = {
    LOW: { label: "Low", className: "bg-slate-100 text-slate-600 border-slate-200" },
    NORMAL: { label: "Normal", className: "bg-blue-100 text-blue-700 border-blue-200" },
    HIGH: { label: "High", className: "bg-orange-100 text-orange-700 border-orange-200" },
    URGENT: { label: "Urgent", className: "bg-red-100 text-red-700 border-red-200" },
  };
  const s = map[priority] ?? { label: priority, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}

function typeBadge(type: ServiceType) {
  const map: Record<ServiceType, { label: string; className: string }> = {
    MAINTENANCE: { label: "Maintenance", className: "bg-blue-100 text-blue-700 border-blue-200" },
    INSPECTION: { label: "Inspection", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    LEGAL: { label: "Legal", className: "bg-purple-100 text-purple-700 border-purple-200" },
    PROXY: { label: "Proxy", className: "bg-teal-100 text-teal-700 border-teal-200" },
    VALUATION: { label: "Valuation", className: "bg-green-100 text-green-700 border-green-200" },
    CLEANING: { label: "Cleaning", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
    FOOD_DELIVERY: { label: "Food Delivery", className: "bg-orange-100 text-orange-700 border-orange-200" },
    AIRPORT_TRANSFER: { label: "Airport Transfer", className: "bg-sky-100 text-sky-700 border-sky-200" },
    GUEST_ASSISTANCE: { label: "Guest Assistance", className: "bg-pink-100 text-pink-700 border-pink-200" },
    CUSTOM: { label: "Custom", className: "bg-slate-100 text-slate-600 border-slate-200" },
  };
  const s = map[type] ?? { label: type, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}

const STATUS_DESCRIPTIONS: Record<SRStatus, string> = {
  DRAFT: "This request is in draft. Submit it to start the workflow.",
  SUBMITTED: "Awaiting manager review and approval.",
  APPROVED: "Approved. Ready to assign a provider or request a quote.",
  REJECTED: "This request has been rejected.",
  QUOTING: "Quotes are being collected from providers.",
  AWAITING_FUNDING: "Quote approved. Waiting for payment authorisation.",
  FUNDED: "Funded and ready to schedule.",
  ASSIGNED: "A provider has been assigned and notified.",
  SCHEDULING_PENDING: "Scheduling is being arranged with the provider.",
  IN_PROGRESS: "Work is actively underway.",
  BLOCKED: "Work is blocked. Manager action required.",
  COMPLETED: "Work has been completed successfully.",
  CANCELLED: "This request was cancelled.",
  DISPUTED: "There is an open dispute on this request.",
};

function metadataLabel(key: string): string {
  const labels: Record<string, string> = {
    category: "Category",
    inspectionType: "Inspection Type",
    caseReference: "Case Reference",
    legalCounsel: "Legal Counsel",
    purpose: "Purpose",
    valuationPurpose: "Valuation Purpose",
    roomDetails: "Room Details",
    deliveryTime: "Delivery Time",
    flightNumber: "Flight Number",
    transferDetails: "Transfer Details",
    assistanceType: "Assistance Type",
  };
  return labels[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function AssignProviderModal({
  open,
  onClose,
  onAssigned,
  srId,
}: {
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
  srId: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open || !user?.authToken) return;
    setFetching(true);
    void fetch("/api/v1/providers?status=ACTIVE", {
      headers: { Authorization: `Bearer ${user.authToken}` },
    })
      .then((r) => r.json())
      .then((j: { data: Provider[] }) => setProviders(j.data ?? []))
      .finally(() => setFetching(false));
  }, [open, user?.authToken]);

  const filtered = providers.filter(
    (p) =>
      !search ||
      (p.name ?? p.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleAssign() {
    if (!user?.authToken || !selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/service-requests/${srId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.authToken}`,
        },
        body: JSON.stringify({ assignedTo: selected }),
      });
      if (!res.ok) throw new Error("Failed");
      toast("Provider assigned successfully", "success");
      onAssigned();
      onClose();
    } catch {
      toast("Failed to assign provider", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title="Assign Provider"
      description="Search and select an active service provider"
    >
      <div className="space-y-4">
        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {fetching ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto [scrollbar-width:thin]">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-4">No providers found</p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.userId)}
                  className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                    selected === p.userId
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.name ?? p.email ?? p.userId.slice(0, 8)}</p>
                    {p.category && <p className="text-xs text-slate-500">{p.category}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleAssign()} disabled={!selected || loading}>
            {loading ? "Assigning…" : "Assign Provider"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function BlockModal({
  open,
  onClose,
  onBlocked,
  srId,
}: {
  open: boolean;
  onClose: () => void;
  onBlocked: () => void;
  srId: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("AWAITING_PARTS");
  const [otherText, setOtherText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBlock() {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/service-requests/${srId}/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.authToken}`,
        },
        body: JSON.stringify({
          blockedReasonType: reason,
          ...(reason === "OTHER" && otherText ? { blockedReason: otherText } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast("Request marked as blocked", "success");
      onBlocked();
      onClose();
    } catch {
      toast("Failed to block request", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title="Mark as Blocked"
      description="Select the reason this request is blocked"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Blocked Reason</label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="AWAITING_PARTS">Awaiting Parts</option>
            <option value="AWAITING_ACCESS">Awaiting Access</option>
            <option value="AWAITING_APPROVAL">Awaiting Approval</option>
            <option value="WEATHER">Weather Conditions</option>
            <option value="SAFETY_CONCERN">Safety Concern</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        {reason === "OTHER" && (
          <div>
            <label className="block text-sm font-medium text-slate-700">Additional Details</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={3}
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Describe the blocking reason"
            />
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="secondary" onClick={() => void handleBlock()} disabled={loading}>
            {loading ? "Blocking…" : "Mark Blocked"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TextInputModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  label,
  confirmLabel,
  confirmVariant = "secondary",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
  title: string;
  description?: string;
  label: string;
  confirmLabel: string;
  confirmVariant?: "secondary" | "outline";
  loading: boolean;
}) {
  const [text, setText] = useState("");
  useEffect(() => { if (!open) setText(""); }, [open]);

  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={title}
      description={description}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">{label}</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={confirmVariant} onClick={() => onConfirm(text)} disabled={loading || !text.trim()}>
            {loading ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EvidenceUploadModal({
  open,
  onClose,
  onUploaded,
  srId,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
  srId: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!open) { setFile(null); setCaption(""); } }, [open]);

  async function handleUpload() {
    if (!user?.authToken || !file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (caption) form.append("caption", caption);
      const res = await fetch(`/api/v1/service-requests/${srId}/evidence`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.authToken}` },
        body: form,
      });
      if (!res.ok) throw new Error("Failed");
      toast("Evidence uploaded", "success");
      onUploaded();
      onClose();
    } catch {
      toast("Failed to upload evidence", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title="Upload Evidence"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">File</label>
          <input
            type="file"
            accept="image/*,video/*"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Caption (optional)</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Brief description of the photo/video"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleUpload()} disabled={!file || loading}>
            {loading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ServiceRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [sr, setSr] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [showAssign, setShowAssign] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showUnblock, setShowUnblock] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  const load = useCallback(async () => {
    if (!user?.authToken || !id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/service-requests/${id}`, {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as { data: ServiceRequest };
      setSr(json.data);
    } finally {
      setLoading(false);
    }
  }, [user?.authToken, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function simpleAction(endpoint: string, body?: Record<string, unknown>) {
    if (!user?.authToken) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/service-requests/${id}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.authToken}`,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        toast(err.message ?? "Action failed", "error");
        return;
      }
      toast("Action completed successfully", "success");
      await load();
    } catch {
      toast("An error occurred", "error");
    } finally {
      setActionLoading(false);
    }
  }

  const role = user?.role ?? "landlord";
  const isManager = role === "admin" || role === "super_admin" || role === "landlord";
  const isExecutor = role === "staff";

  const openEscalation = sr?.escalations?.find((e) => !e.resolvedAt);

  // Build timeline steps from status history
  const timelineSteps: TimelineStep[] = (sr?.statusHistory ?? []).map((h, i) => ({
    id: h.id,
    label: h.toStatus.replace(/_/g, " "),
    status:
      i === (sr?.statusHistory?.length ?? 0) - 1
        ? "current"
        : "complete",
    timestamp: fmtDate(h.changedAt) + (h.note ? ` · ${h.note}` : ""),
  }));

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!sr) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold text-slate-700">Service request not found</p>
        <Button variant="outline" asChild>
          <Link href="/service-requests"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to list</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/service-requests"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Service Requests
        </Link>
      </div>

      {/* Escalation banner */}
      {openEscalation && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Open Escalation</p>
              <p className="text-sm text-red-700">{openEscalation.reason}</p>
              <p className="mt-1 text-xs text-red-500">Escalated {fmtDate(openEscalation.escalatedAt)}</p>
            </div>
          </div>
          {isManager && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-red-300 text-red-700 hover:bg-red-100"
              disabled={actionLoading}
              onClick={() => void simpleAction("resolve-escalation")}
            >
              Resolve Escalation
            </Button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono">{sr.id.slice(0, 8).toUpperCase()}</span>
              <span>·</span>
              <span>Created {fmtShort(sr.createdAt)}</span>
              {sr.dueAt && (
                <>
                  <span>·</span>
                  <span className={new Date(sr.dueAt) < new Date() && sr.srStatus !== "COMPLETED" && sr.srStatus !== "CANCELLED" ? "text-red-600 font-semibold" : ""}>
                    Due {fmtShort(sr.dueAt)}
                  </span>
                </>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{sr.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {typeBadge(sr.serviceType)}
              {priorityBadge(sr.srPriority)}
              {statusBadge(sr.srStatus)}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="space-y-4 lg:col-span-2">
          {/* Description */}
          <Section title="Description">
            {sr.description ? (
              <p className="whitespace-pre-wrap text-sm text-slate-700">{sr.description}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">No description provided</p>
            )}
          </Section>

          {/* Type-specific Metadata */}
          {sr.metadata && Object.keys(sr.metadata).length > 0 && (
            <Section title="Service Details">
              <dl className="divide-y divide-slate-100">
                {Object.entries(sr.metadata).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-4 py-2">
                    <dt className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {metadataLabel(k)}
                    </dt>
                    <dd className="flex-1 text-sm text-slate-700">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {/* Evidence Gallery */}
          <Section title="Evidence">
            {(sr.evidence ?? []).length === 0 ? (
              <p className="text-sm text-slate-400 italic">No evidence uploaded yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {(sr.evidence ?? []).map((ev) => (
                  <div key={ev.id} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {ev.fileUrl.match(/\.(mp4|mov|webm)$/i) ? (
                      <video src={ev.fileUrl} className="h-28 w-full object-cover" controls />
                    ) : (
                      <img src={ev.fileUrl} alt={ev.caption ?? "Evidence"} className="h-28 w-full object-cover" />
                    )}
                    <div className="p-2">
                      {ev.caption && <p className="text-xs font-medium text-slate-700 truncate">{ev.caption}</p>}
                      <p className="text-[10px] text-slate-400">{fmtShort(ev.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEvidence(true)}
              >
                <Upload className="mr-1.5 h-4 w-4" /> Upload Evidence
              </Button>
            </div>
          </Section>

          {/* Quote History */}
          {(sr.quotes ?? []).length > 0 && (
            <Section title="Quote History">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Scope</th>
                    <th className="pb-2 pr-4">Valid Until</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(sr.quotes ?? []).map((q) => (
                    <tr key={q.id} className="text-sm">
                      <td className="py-2 pr-4 font-mono font-medium">
                        KES {q.amount.toLocaleString("en-KE")}
                      </td>
                      <td className="max-w-[160px] truncate py-2 pr-4 text-slate-600">{q.scope ?? "—"}</td>
                      <td className="py-2 pr-4 text-slate-500">{q.validUntil ? fmtShort(q.validUntil) : "—"}</td>
                      <td className="py-2 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          q.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700"
                            : q.status === "REJECTED"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-2 text-slate-500">{fmtShort(q.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isManager && sr.srStatus === "QUOTING" && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => void simpleAction("quotes/approve")}
                    disabled={actionLoading}
                  >
                    Approve Quote
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void simpleAction("quotes/reject")}
                    disabled={actionLoading}
                  >
                    Reject Quote
                  </Button>
                </div>
              )}
            </Section>
          )}

          {/* Status History Timeline */}
          <Section title="Status History">
            {timelineSteps.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No status transitions yet</p>
            ) : (
              <StatusTimeline steps={timelineSteps} />
            )}
          </Section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* Status card */}
          <Section title="Current Status">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                {statusBadge(sr.srStatus)}
                <p className="mt-1 text-xs text-slate-500">
                  {STATUS_DESCRIPTIONS[sr.srStatus] ?? ""}
                </p>
              </div>
            </div>
          </Section>

          {/* Assignment card */}
          <Section title="Assignment">
            {sr.assignedTo ? (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Assigned</p>
                  <p className="font-mono text-xs text-slate-500">{sr.assignedTo.slice(0, 12)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Not yet assigned</p>
            )}

            {/* Assignment history */}
            {(sr.assignments ?? []).length > 1 && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">History</p>
                <div className="space-y-1.5">
                  {(sr.assignments ?? []).map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-600">{a.assignedTo.slice(0, 10)}</span>
                      <span className="text-slate-400">{fmtShort(a.assignedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Payment card */}
          {(sr.paymentStatus || sr.serviceChargeAmount != null) && (
            <Section title="Payment">
              <div className="space-y-2">
                {sr.paymentStatus && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Status</span>
                    <span className="font-semibold text-slate-800">{sr.paymentStatus}</span>
                  </div>
                )}
                {sr.paymentResponsibility && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Responsibility</span>
                    <span className="font-semibold text-slate-800">{sr.paymentResponsibility}</span>
                  </div>
                )}
                {sr.serviceChargeAmount != null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Charge</span>
                    <span className="font-mono font-semibold text-slate-800">
                      KES {sr.serviceChargeAmount.toLocaleString("en-KE")}
                    </span>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Booking Context */}
          {sr.shortStayBookingId && (
            <Section title="Booking Context">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FileText className="h-4 w-4 text-slate-400" />
                <span>Booking ID: </span>
                <span className="font-mono text-xs text-slate-500">{sr.shortStayBookingId.slice(0, 12)}</span>
              </div>
            </Section>
          )}

          {/* Action buttons */}
          <Section title="Actions">
            <div className="flex flex-col gap-2">
              {/* DRAFT → Submit */}
              {sr.srStatus === "DRAFT" && (
                <Button
                  className="w-full"
                  disabled={actionLoading}
                  onClick={() => void simpleAction("submit")}
                >
                  Submit Request
                </Button>
              )}

              {/* SUBMITTED → Approve / Reject (manager) */}
              {sr.srStatus === "SUBMITTED" && isManager && (
                <>
                  <Button
                    className="w-full"
                    disabled={actionLoading}
                    onClick={() => void simpleAction("approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                    disabled={actionLoading}
                    onClick={() => setShowReject(true)}
                  >
                    Reject
                  </Button>
                </>
              )}

              {/* APPROVED → Assign / Request Quote (manager) */}
              {sr.srStatus === "APPROVED" && isManager && (
                <>
                  <Button
                    className="w-full"
                    disabled={actionLoading}
                    onClick={() => setShowAssign(true)}
                  >
                    Assign Provider
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={actionLoading}
                    onClick={() => void simpleAction("request-quote")}
                  >
                    Request Quote
                  </Button>
                </>
              )}

              {/* ASSIGNED / SCHEDULING_PENDING → Start Work (executor/staff) */}
              {(sr.srStatus === "ASSIGNED" || sr.srStatus === "SCHEDULING_PENDING") && (isExecutor || isManager) && (
                <Button
                  className="w-full"
                  disabled={actionLoading}
                  onClick={() => void simpleAction("start")}
                >
                  Start Work
                </Button>
              )}

              {/* IN_PROGRESS → Mark Blocked / Complete / Escalate */}
              {sr.srStatus === "IN_PROGRESS" && (
                <>
                  {(isExecutor || isManager) && (
                    <Button
                      variant="outline"
                      className="w-full border-red-300 text-red-700 hover:bg-red-50"
                      disabled={actionLoading}
                      onClick={() => setShowBlock(true)}
                    >
                      Mark Blocked
                    </Button>
                  )}
                  {(isExecutor || isManager) && (
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={actionLoading}
                      onClick={() => setShowComplete(true)}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark Complete
                    </Button>
                  )}
                  {isManager && (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={actionLoading}
                      onClick={() => void simpleAction("escalate")}
                    >
                      Escalate
                    </Button>
                  )}
                </>
              )}

              {/* BLOCKED → Unblock (manager) */}
              {sr.srStatus === "BLOCKED" && isManager && (
                <Button
                  className="w-full"
                  disabled={actionLoading}
                  onClick={() => setShowUnblock(true)}
                >
                  Unblock
                </Button>
              )}

              {/* COMPLETED → Dispute */}
              {sr.srStatus === "COMPLETED" && (
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  disabled={actionLoading}
                  onClick={() => setShowDispute(true)}
                >
                  Dispute
                </Button>
              )}

              {/* Any active → Cancel (manager) */}
              {isManager &&
                ![
                  "COMPLETED",
                  "CANCELLED",
                  "REJECTED",
                  "DISPUTED",
                ].includes(sr.srStatus) && (
                  <Button
                    variant="ghost"
                    className="w-full text-slate-500 hover:text-red-600"
                    disabled={actionLoading}
                    onClick={() => setShowCancel(true)}
                  >
                    <X className="mr-1.5 h-4 w-4" /> Cancel Request
                  </Button>
                )}
            </div>
          </Section>
        </div>
      </div>

      {/* Modals */}
      <AssignProviderModal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        onAssigned={() => void load()}
        srId={id}
      />

      <BlockModal
        open={showBlock}
        onClose={() => setShowBlock(false)}
        onBlocked={() => void load()}
        srId={id}
      />

      <TextInputModal
        open={showUnblock}
        onClose={() => setShowUnblock(false)}
        onConfirm={(text) => {
          void simpleAction("unblock", { resolutionNotes: text }).then(() => {
            setShowUnblock(false);
          });
        }}
        title="Unblock Request"
        description="Provide resolution notes to unblock this request"
        label="Resolution Notes"
        confirmLabel="Unblock"
        confirmVariant="secondary"
        loading={actionLoading}
      />

      <TextInputModal
        open={showComplete}
        onClose={() => setShowComplete(false)}
        onConfirm={(text) => {
          void simpleAction("complete", { resolutionNotes: text }).then(() => {
            setShowComplete(false);
          });
        }}
        title="Mark as Complete"
        description="Provide notes about the completed work"
        label="Resolution Notes"
        confirmLabel="Mark Complete"
        confirmVariant="secondary"
        loading={actionLoading}
      />

      <TextInputModal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={(text) => {
          void simpleAction("cancel", { reason: text }).then(() => {
            setShowCancel(false);
          });
        }}
        title="Cancel Request"
        description="Provide a reason for cancelling this request"
        label="Reason"
        confirmLabel="Cancel Request"
        confirmVariant="outline"
        loading={actionLoading}
      />

      <TextInputModal
        open={showReject}
        onClose={() => setShowReject(false)}
        onConfirm={(text) => {
          void simpleAction("reject", { reason: text }).then(() => {
            setShowReject(false);
          });
        }}
        title="Reject Request"
        description="Provide a reason for rejecting this request"
        label="Reason"
        confirmLabel="Reject"
        confirmVariant="outline"
        loading={actionLoading}
      />

      <TextInputModal
        open={showDispute}
        onClose={() => setShowDispute(false)}
        onConfirm={(text) => {
          void simpleAction("dispute", { reason: text }).then(() => {
            setShowDispute(false);
          });
        }}
        title="Dispute Completion"
        description="Explain why you are disputing the completed work"
        label="Reason"
        confirmLabel="Submit Dispute"
        confirmVariant="outline"
        loading={actionLoading}
      />

      <EvidenceUploadModal
        open={showEvidence}
        onClose={() => setShowEvidence(false)}
        onUploaded={() => void load()}
        srId={id}
      />
    </div>
  );
}
