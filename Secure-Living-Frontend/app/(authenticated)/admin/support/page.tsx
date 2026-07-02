"use client";

import { useEffect, useState, useCallback } from "react";
import { Ticket, RefreshCw, CheckCircle2, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";

// Service Enquiry workflow (UPDATE.md): Received -> Assigned -> Quotation Sent -> Accepted
// -> In Progress -> Completed -> Closed. NEW/CANCELLED kept for legacy rows.
type EnquiryStatus = "NEW" | "RECEIVED" | "ASSIGNED" | "QUOTATION_SENT" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CLOSED" | "CANCELLED";

type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: EnquiryStatus;
  assignedTo: string | null;
  quotationAmount: number | null;
  createdAt: string;
  resolvedAt: string | null;
  serviceCategory: { name: string; slug: string } | null;
};

type SupportItem = {
  id: string;
  ticketNumber?: string;
  contactNumber?: string;
  leadNumber?: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  category?: string;
  priority?: string;
  status: string;
  assignedTo?: string | null;
  createdAt: string;
  leadType?: string;
  pipeline?: string;
  source?: string;
};

const STATUS_CONFIG: Record<EnquiryStatus, { label: string; color: string }> = {
  NEW:            { label: "New (legacy)", color: "bg-blue-100 text-blue-700" },
  RECEIVED:       { label: "Received",       color: "bg-blue-100 text-blue-700" },
  ASSIGNED:       { label: "Assigned",       color: "bg-indigo-100 text-indigo-700" },
  QUOTATION_SENT: { label: "Quotation Sent", color: "bg-purple-100 text-purple-700" },
  ACCEPTED:       { label: "Accepted",       color: "bg-teal-100 text-teal-700" },
  IN_PROGRESS:    { label: "In Progress",    color: "bg-amber-100 text-amber-700" },
  COMPLETED:      { label: "Completed",      color: "bg-emerald-100 text-emerald-700" },
  CLOSED:         { label: "Closed",         color: "bg-slate-200 text-slate-600" },
  CANCELLED:      { label: "Cancelled",      color: "bg-slate-100 text-slate-500" },
};

const STATUS_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW:            ["ASSIGNED", "CANCELLED"],
  RECEIVED:       ["ASSIGNED", "CANCELLED"],
  ASSIGNED:       ["QUOTATION_SENT", "CANCELLED"],
  QUOTATION_SENT: ["ACCEPTED", "CANCELLED"],
  ACCEPTED:       ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS:    ["COMPLETED", "CANCELLED"],
  COMPLETED:      ["CLOSED"],
  CLOSED:         [],
  CANCELLED:      [],
};

// Support Ticket workflow: New -> Assigned -> In Progress -> Awaiting User -> Resolved -> Closed.
const TICKET_TRANSITIONS: Record<string, string[]> = {
  NEW:            ["ASSIGNED"],
  ASSIGNED:       ["IN_PROGRESS"],
  IN_PROGRESS:    ["AWAITING_USER", "RESOLVED"],
  AWAITING_USER:  ["IN_PROGRESS", "RESOLVED"],
  RESOLVED:       ["CLOSED"],
  CLOSED:         [],
};

// Contact Request workflow: New -> Assigned -> Contacted -> Qualified -> Closed.
const CONTACT_TRANSITIONS: Record<string, string[]> = {
  NEW:        ["ASSIGNED"],
  ASSIGNED:   ["CONTACTED"],
  CONTACTED:  ["QUALIFIED", "CLOSED"],
  QUALIFIED:  ["CLOSED"],
  CLOSED:     [],
};

const SUPPORT_ITEM_LABELS: Record<string, string> = {
  NEW: "New", ASSIGNED: "Assigned", IN_PROGRESS: "In Progress", AWAITING_USER: "Awaiting User",
  RESOLVED: "Resolved", CLOSED: "Closed", CONTACTED: "Contacted", QUALIFIED: "Qualified",
};

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EnquiryStatus | "ALL">("ALL");
  const [module, setModule] = useState<"tickets" | "enquiries" | "contacts" | "leads">("tickets");
  const [supportItems, setSupportItems] = useState<SupportItem[]>([]);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/service-enquiries", {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (res.ok) {
        const json = await res.json() as { data: Enquiry[] };
        setEnquiries(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.authToken]);

  useEffect(() => { void load(); }, [load]);

  const loadSupportModule = useCallback(async () => {
    if (!user?.authToken || module === "enquiries") return;
    setModuleLoading(true);
    try {
      const res = await fetch(`/api/v1/support?module=${module}`, {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (res.ok) {
        const json = await res.json() as { data: SupportItem[] };
        setSupportItems(json.data ?? []);
      }
    } finally {
      setModuleLoading(false);
    }
  }, [module, user?.authToken]);

  useEffect(() => { void loadSupportModule(); }, [loadSupportModule]);

  async function updateStatus(id: string, status: EnquiryStatus) {
    if (!user?.authToken) return;
    let quotationAmount: number | undefined;
    if (status === "QUOTATION_SENT") {
      const raw = window.prompt("Quotation amount (KES):");
      if (raw === null) return;
      quotationAmount = Number(raw);
      if (!raw || Number.isNaN(quotationAmount)) { toast("Enter a valid quotation amount", "error"); return; }
    }
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/v1/service-enquiries/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${user.authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, ...(quotationAmount !== undefined && { quotationAmount }) }),
      });
      if (res.ok) {
        toast("Status updated", "success");
        void load();
      } else {
        try {
          const j = await res.json() as { error?: string };
          toast(j.error ?? "Failed to update", "error");
        } catch {
          toast(`Failed to update (${res.status})`, "error");
        }
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateSupportItem(id: string, status: string) {
    if (!user?.authToken || module === "enquiries" || module === "leads") return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/v1/support/${module}/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user.authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast("Status updated", "success"); void loadSupportModule(); }
      else { const j = await res.json().catch(() => ({} as { error?: string })); toast(j.error ?? "Failed to update", "error"); }
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = filter === "ALL" ? enquiries : enquiries.filter((e) => e.status === filter);
  const newCount = enquiries.filter((e) => e.status === "NEW").length;

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Support</h1>
          <p className="app-page-lead">Platform support, service enquiries, and contact requests are tracked separately.</p>
        </div>
        <div className="flex items-center gap-3">
          {newCount > 0 && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              {newCount} new
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "tickets" as const, label: "Support Tickets" },
          { key: "enquiries" as const, label: "Service Enquiries" },
          { key: "contacts" as const, label: "Contact Requests" },
          { key: "leads" as const, label: "CRM Leads" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setModule(item.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              module === item.key ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {module !== "enquiries" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-slate-900">
            {module === "tickets"
              ? "Platform-related issues and technical support"
              : module === "contacts"
                ? "General contact, demo, partnership, and information requests"
                : "Business opportunities routed from website enquiries"}
          </p>
          {moduleLoading ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : supportItems.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No records in this module.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {supportItems.map((item) => {
                const transitions = module === "tickets" ? TICKET_TRANSITIONS[item.status] ?? []
                  : module === "contacts" ? CONTACT_TRANSITIONS[item.status] ?? []
                  : [];
                return (
                <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.email}{item.phone ? ` · ${item.phone}` : ""} · {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {SUPPORT_ITEM_LABELS[item.status] ?? item.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{item.message}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.ticketNumber ?? item.contactNumber ?? item.leadNumber}
                    {item.category ? ` · ${item.category}` : ""}
                    {item.leadType ? ` · ${item.leadType}` : ""}
                    {item.pipeline ? ` · ${item.pipeline}` : ""}
                    {item.priority ? ` · ${item.priority}` : ""}
                  </p>
                  {transitions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {transitions.map((t) => (
                        <Button
                          key={t}
                          size="sm"
                          variant={t === "CLOSED" ? "outline" : "secondary"}
                          disabled={updatingId === item.id}
                          onClick={() => void updateSupportItem(item.id, t)}
                        >
                          {SUPPORT_ITEM_LABELS[t] ?? t}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "RECEIVED", "ASSIGNED", "QUOTATION_SENT", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-brand-navy text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f === "ALL" ? "All" : STATUS_CONFIG[f as EnquiryStatus].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <Ticket className="h-12 w-12 text-slate-200" />
          <p className="text-lg font-medium text-slate-700">No tickets</p>
          <p className="text-sm text-slate-400">No support tickets match this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((e) => {
            const sc = STATUS_CONFIG[e.status];
            const transitions = STATUS_TRANSITIONS[e.status];
            return (
              <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{e.name}</p>
                      <p className="text-xs text-slate-500">
                        {e.email}{e.phone ? ` · ${e.phone}` : ""} ·{" "}
                        {e.serviceCategory?.name ?? "General"} ·{" "}
                        {new Date(e.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.color}`}>
                    {sc.label}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {e.message}
                </div>

                {e.quotationAmount != null && (
                  <p className="text-sm font-medium text-slate-700">Quotation: KES {e.quotationAmount.toLocaleString()}</p>
                )}

                {transitions.length > 0 && (
                  <div className="flex gap-2">
                    {transitions.map((t) => (
                      <Button
                        key={t}
                        size="sm"
                        variant={t === "CANCELLED" ? "outline" : "secondary"}
                        disabled={updatingId === e.id}
                        onClick={() => void updateStatus(e.id, t)}
                      >
                        {STATUS_CONFIG[t].label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}
