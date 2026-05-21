"use client";

import { useEffect, useState, useCallback } from "react";
import {
  HardHat,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProviderStatus =
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "BLACKLISTED"
  | "REJECTED";

type ProviderCategory =
  | "INTERNAL"
  | "VERIFIED_MARKETPLACE"
  | "LANDLORD_PREFERRED"
  | "AGENCY_PREFERRED"
  | "TENANT_REFERRED";

interface Provider {
  id: string;
  userId: string;
  category: ProviderCategory;
  status: ProviderStatus;
  specializations?: string[];
  coverageAreas?: string[];
  bio?: string;
  trustScore?: number;
  email?: string;
  name?: string;
  createdAt: string;
}

interface CreateProviderPayload {
  userId: string;
  category: ProviderCategory;
  specializations: string[];
  coverageAreas: string[];
  bio: string;
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function categoryBadge(category: ProviderCategory) {
  const map: Record<ProviderCategory, { label: string; className: string }> = {
    INTERNAL: { label: "Internal", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    VERIFIED_MARKETPLACE: { label: "Verified Marketplace", className: "bg-green-100 text-green-700 border-green-200" },
    LANDLORD_PREFERRED: { label: "Landlord Preferred", className: "bg-blue-100 text-blue-700 border-blue-200" },
    AGENCY_PREFERRED: { label: "Agency Preferred", className: "bg-purple-100 text-purple-700 border-purple-200" },
    TENANT_REFERRED: { label: "Tenant Referred", className: "bg-orange-100 text-orange-700 border-orange-200" },
  };
  const s = map[category] ?? { label: category, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}

function statusBadge(status: ProviderStatus) {
  const map: Record<ProviderStatus, { label: string; className: string }> = {
    PENDING_APPROVAL: { label: "Pending Approval", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    INACTIVE: { label: "Inactive", className: "bg-slate-100 text-slate-500 border-slate-200" },
    SUSPENDED: { label: "Suspended", className: "bg-red-100 text-red-700 border-red-200" },
    BLACKLISTED: { label: "Blacklisted", className: "bg-red-200 text-red-900 border-red-300" },
    REJECTED: { label: "Rejected", className: "bg-slate-100 text-slate-500 border-slate-200" },
  };
  const s = map[status] ?? { label: status, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}

function TrustScore({ score }: { score?: number }) {
  if (score == null) return <span className="text-slate-400">—</span>;
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-600">{pct}</span>
    </div>
  );
}

// ─── Add Provider Modal ────────────────────────────────────────────────────────

function AddProviderModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [category, setCategory] = useState<ProviderCategory>("VERIFIED_MARKETPLACE");
  const [specs, setSpecs] = useState("");
  const [coverage, setCoverage] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!open) {
      setUserId("");
      setSpecs("");
      setCoverage("");
      setBio("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const payload: CreateProviderPayload = {
        userId: userId.trim(),
        category,
        specializations: specs.split(",").map((s) => s.trim()).filter(Boolean),
        coverageAreas: coverage.split(",").map((s) => s.trim()).filter(Boolean),
        bio: bio.trim(),
      };

      const res = await fetch("/api/v1/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        toast(err.message ?? "Failed to create provider", "error");
        return;
      }

      toast("Provider added successfully", "success");
      onCreated();
      onClose();
    } catch {
      toast("An error occurred", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title="Add Service Provider"
      description="Register a new provider in the system"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            User ID <span className="text-red-500">*</span>
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            placeholder="UUID of the user account"
          />
          <p className="mt-1 text-xs text-slate-400">The user must already have an account in the system</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Category</label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProviderCategory)}
          >
            <option value="INTERNAL">Internal</option>
            <option value="VERIFIED_MARKETPLACE">Verified Marketplace</option>
            <option value="LANDLORD_PREFERRED">Landlord Preferred</option>
            <option value="AGENCY_PREFERRED">Agency Preferred</option>
            <option value="TENANT_REFERRED">Tenant Referred</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Specializations</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={specs}
            onChange={(e) => setSpecs(e.target.value)}
            placeholder="Plumbing, Electrical, HVAC (comma-separated)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Coverage Areas</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
            placeholder="Nairobi, Westlands, Karen (comma-separated)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Bio</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short description of the provider's background and experience"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding…" : "Add Provider"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ActionTextModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  label,
  confirmLabel,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
  title: string;
  description?: string;
  label: string;
  confirmLabel: string;
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
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(text)} disabled={loading || !text.trim()}>
            {loading ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProvidersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [rows, setRows] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");

  // Action modals
  const [suspendTarget, setSuspendTarget] = useState<string | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<string | null>(null);
  const [blacklistTarget, setBlacklistTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterCategory) params.set("category", filterCategory);

      const res = await fetch(`/api/v1/providers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as { data: Provider[] };
      setRows(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [user?.authToken, filterStatus, filterCategory]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = search
    ? rows.filter(
        (r) =>
          (r.name ?? r.email ?? r.userId)
            .toLowerCase()
            .includes(search.toLowerCase())
      )
    : rows;

  // KPI counts
  const totalActive = rows.filter((r) => r.status === "ACTIVE").length;
  const pendingApproval = rows.filter((r) => r.status === "PENDING_APPROVAL").length;
  const suspendedBlacklisted = rows.filter(
    (r) => r.status === "SUSPENDED" || r.status === "BLACKLISTED"
  ).length;

  async function providerAction(
    providerId: string,
    action: string,
    body?: Record<string, unknown>
  ) {
    if (!user?.authToken) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/providers/${providerId}/${action}`, {
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
      toast("Action completed", "success");
      await load();
    } catch {
      toast("An error occurred", "error");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Service Providers</h1>
          <p className="app-page-lead">Manage your vetted and marketplace service providers</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Provider
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Active</p>
            <p className="text-2xl font-bold text-slate-900">{loading ? "—" : totalActive}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Pending Approval</p>
            <p className="text-2xl font-bold text-slate-900">{loading ? "—" : pendingApproval}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Suspended / Blacklisted</p>
            <p className="text-2xl font-bold text-slate-900">{loading ? "—" : suspendedBlacklisted}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search providers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BLACKLISTED">Blacklisted</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="INTERNAL">Internal</option>
          <option value="VERIFIED_MARKETPLACE">Verified Marketplace</option>
          <option value="LANDLORD_PREFERRED">Landlord Preferred</option>
          <option value="AGENCY_PREFERRED">Agency Preferred</option>
          <option value="TENANT_REFERRED">Tenant Referred</option>
        </select>
        {(filterStatus || filterCategory || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterStatus(""); setFilterCategory(""); setSearch(""); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <HardHat className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">No providers found</p>
            <p className="text-sm text-slate-500">Adjust your filters or add a new provider</p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Provider
            </Button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["Provider", "Category", "Status", "Specializations", "Trust Score", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {p.name ?? p.email ?? "—"}
                      </p>
                      <p className="font-mono text-xs text-slate-400">{p.userId.slice(0, 10)}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{categoryBadge(p.category)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="max-w-[200px] px-4 py-3 text-xs text-slate-600">
                    {(p.specializations ?? []).join(", ") || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <TrustScore score={p.trustScore} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {p.status === "PENDING_APPROVAL" && (
                        <Button
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => void providerAction(p.id, "approve")}
                        >
                          Approve
                        </Button>
                      )}
                      {(p.status === "ACTIVE" || p.status === "INACTIVE") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          disabled={actionLoading}
                          onClick={() => setSuspendTarget(p.id)}
                        >
                          Suspend
                        </Button>
                      )}
                      {p.status === "SUSPENDED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading}
                          onClick={() => setReactivateTarget(p.id)}
                        >
                          Reactivate
                        </Button>
                      )}
                      {(user?.role === "admin" || user?.role === "super_admin") &&
                        p.status !== "BLACKLISTED" &&
                        p.status !== "REJECTED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 bg-red-50 text-red-900 hover:bg-red-100"
                            disabled={actionLoading}
                            onClick={() => setBlacklistTarget(p.id)}
                          >
                            Blacklist
                          </Button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <AddProviderModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={() => void load()}
      />

      <ActionTextModal
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={(text) => {
          if (!suspendTarget) return;
          void providerAction(suspendTarget, "suspend", { reason: text }).then(() => {
            setSuspendTarget(null);
          });
        }}
        title="Suspend Provider"
        description="Provide a reason for suspending this provider"
        label="Reason"
        confirmLabel="Suspend Provider"
        loading={actionLoading}
      />

      <ActionTextModal
        open={!!reactivateTarget}
        onClose={() => setReactivateTarget(null)}
        onConfirm={(text) => {
          if (!reactivateTarget) return;
          void providerAction(reactivateTarget, "reactivate", { justification: text }).then(() => {
            setReactivateTarget(null);
          });
        }}
        title="Reactivate Provider"
        description="Provide justification for reactivating this provider"
        label="Justification"
        confirmLabel="Reactivate"
        loading={actionLoading}
      />

      <ActionTextModal
        open={!!blacklistTarget}
        onClose={() => setBlacklistTarget(null)}
        onConfirm={(text) => {
          if (!blacklistTarget) return;
          void providerAction(blacklistTarget, "blacklist", { reason: text }).then(() => {
            setBlacklistTarget(null);
          });
        }}
        title="Blacklist Provider"
        description="This action permanently bans the provider. Provide a detailed reason."
        label="Reason for blacklisting"
        confirmLabel="Blacklist Provider"
        loading={actionLoading}
      />
    </div>
  );
}
