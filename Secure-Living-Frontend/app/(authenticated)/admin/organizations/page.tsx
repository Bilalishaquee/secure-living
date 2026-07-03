"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

type OrgType = "Diaspora Client" | "Agency" | "Independent Manager";
type OrgRow = {
  id: string;
  name: string;
  type: string;
  country: string;
  email: string;
  phone?: string | null;
  kraPin?: string | null;
  bankPayoutAccount?: string | null;
  usersCount: number;
  status: string;
  rejectionReason?: string | null;
  reapplicationCount?: number;
  deactivationReason?: string | null;
  branches: { id: string; name: string; location?: string | null; usersCount?: number }[];
};

type AuditRow = {
  id: string;
  action: string;
  userId: string;
  timestamp: string;
  afterJson: unknown;
};

const CHECKLIST_ITEMS: { key: "businessRegistrationVerified" | "contactDetailsConfirmed" | "kycDocumentsReviewed"; label: string }[] = [
  { key: "businessRegistrationVerified", label: "Business registration verified" },
  { key: "contactDetailsConfirmed", label: "Contact details confirmed" },
  { key: "kycDocumentsReviewed", label: "KYC documents reviewed" },
];

export default function OrganizationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(orgs[0]?.id ?? null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Independent Manager" as OrgType,
    country: "Kenya",
    email: "",
    phone: "",
  });
  const [branchDraft, setBranchDraft] = useState<Record<string, string>>({});
  const [reviewTarget, setReviewTarget] = useState<OrgRow | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [rejectReason, setRejectReason] = useState("");
  const [editTarget, setEditTarget] = useState<OrgRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", kraPin: "", bankPayoutAccount: "" });
  const [deactivateTarget, setDeactivateTarget] = useState<OrgRow | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [auditTarget, setAuditTarget] = useState<string | null>(null);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);

  const isSuperAdmin = user?.permissions?.includes("*") ?? false;

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const res = await fetch("/api/v1/organizations", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as { data: OrgRow[] };
      setOrgs(json.data);
      setExpanded(json.data[0]?.id ?? null);
    })();
  }, [user]);

  const toggle = (id: string) => {
    setExpanded((e) => (e === id ? null : id));
  };

  const createOrg = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast("Please fill required fields", "error");
      return;
    }
    const res = await fetch("/api/v1/organizations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.authToken ?? ""}`,
      },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      toast("Organization creation failed", "error");
      return;
    }
    const json = (await res.json()) as { data: OrgRow };
    setOrgs((o) => [json.data, ...o]);
    setModalOpen(false);
    setForm({
      name: "",
      type: "Independent Manager",
      country: "Kenya",
      email: "",
      phone: "",
    });
    toast("Organization created", "success");
  };

  const openReview = (org: OrgRow) => {
    setReviewTarget(org);
    setChecklist({});
    setRejectReason("");
  };

  const submitReview = async (decision: "approve" | "reject") => {
    if (!reviewTarget) return;
    if (decision === "reject" && !rejectReason.trim()) {
      toast("A rejection reason is required", "error");
      return;
    }
    const res = await fetch(`/api/v1/organizations/${reviewTarget.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.authToken ?? ""}`,
      },
      body: JSON.stringify({
        decision,
        note: rejectReason.trim() || undefined,
        checklist: {
          businessRegistrationVerified: !!checklist.businessRegistrationVerified,
          contactDetailsConfirmed: !!checklist.contactDetailsConfirmed,
          kycDocumentsReviewed: !!checklist.kycDocumentsReviewed,
        },
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast(j.error ?? "Failed to update organization", "error");
      return;
    }
    const json = (await res.json()) as { data: OrgRow };
    setOrgs((items) => items.map((o) => (o.id === reviewTarget.id ? { ...o, ...json.data } : o)));
    setReviewTarget(null);
    toast(decision === "approve" ? "Organization approved" : "Organization rejected", "success");
  };

  const reapply = async (orgId: string) => {
    const res = await fetch(`/api/v1/organizations/${orgId}/reapply`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user?.authToken ?? ""}` },
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast(j.error ?? "Failed to resubmit", "error");
      return;
    }
    const json = (await res.json()) as { data: OrgRow };
    setOrgs((items) => items.map((o) => (o.id === orgId ? { ...o, ...json.data } : o)));
    toast("Resubmitted for review", "success");
  };

  const openEdit = (org: OrgRow) => {
    setEditTarget(org);
    setEditForm({
      name: org.name,
      email: org.email,
      phone: org.phone ?? "",
      kraPin: org.kraPin ?? "",
      bankPayoutAccount: org.bankPayoutAccount ?? "",
    });
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    const res = await fetch(`/api/v1/organizations/${editTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken ?? ""}` },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast(j.error ?? "Failed to save changes", "error");
      return;
    }
    const json = (await res.json()) as { data: OrgRow };
    setOrgs((items) => items.map((o) => (o.id === editTarget.id ? { ...o, ...json.data } : o)));
    setEditTarget(null);
    toast("Organization updated", "success");
  };

  const submitDeactivation = async (action: "activate" | "deactivate") => {
    if (!deactivateTarget) return;
    if (action === "deactivate" && !deactivateReason.trim()) {
      toast("A reason is required to deactivate", "error");
      return;
    }
    const res = await fetch(`/api/v1/organizations/${deactivateTarget.id}/activation`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken ?? ""}` },
      body: JSON.stringify({ action, reason: deactivateReason.trim() || undefined }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast(j.error ?? "Failed", "error");
      return;
    }
    const json = (await res.json()) as { data: OrgRow };
    setOrgs((items) => items.map((o) => (o.id === deactivateTarget.id ? { ...o, ...json.data } : o)));
    setDeactivateTarget(null);
    setDeactivateReason("");
    toast(action === "activate" ? "Organization activated" : "Organization deactivated", "success");
  };

  const openAudit = async (orgId: string) => {
    setAuditTarget(orgId);
    const res = await fetch(`/api/v1/audit-logs?resourceType=Organization&resourceId=${orgId}`, {
      headers: { Authorization: `Bearer ${user?.authToken ?? ""}` },
    });
    if (res.ok) {
      const json = (await res.json()) as { data: AuditRow[] };
      setAuditRows(json.data);
    }
  };

  const addBranch = async (orgId: string) => {
    const name = (branchDraft[orgId] ?? "").trim();
    if (!name) return;
    const res = await fetch(`/api/v1/organizations/${orgId}/branches`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${user?.authToken ?? ""}`,
      },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      toast("Failed to add branch", "error");
      return;
    }
    const json = (await res.json()) as { data: { id: string; name: string; location?: string } };
    setOrgs((items) =>
      items.map((i) => (i.id === orgId ? { ...i, branches: [...i.branches, json.data] } : i))
    );
    setBranchDraft((s) => ({ ...s, [orgId]: "" }));
  };

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Organizations &amp; branches</h1>
          <p className="app-page-lead">Diaspora clients, agencies, and independent managers</p>
        </div>
        <Button type="button" className="shrink-0" onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-xs text-sky-800">
        <strong>Ownership model:</strong> Admins and Super Admins can create organizations here. Landlords and
        agencies can also self-register from the public registration flow. Landlord/independent-manager organizations
        become active immediately; agency organizations enter pending review and cannot operate until Super Admin
        approval. Only a Super Admin can approve, reject, activate, or deactivate an organization. Organization owners
        can maintain their own contact, tax, and payout details.
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Create organization"
        description="Add a new organization. Agency organizations are created in Pending Review until Super Admin approval."
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Organization name</label>
            <input
              className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as OrgType }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Diaspora Client">Diaspora Client</SelectItem>
                <SelectItem value="Agency">Agency</SelectItem>
                <SelectItem value="Independent Manager">Independent Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Country</label>
            <input
              className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Primary email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <Button type="button" className="w-full" onClick={createOrg}>
            Save organization
          </Button>
        </div>
      </Modal>

      <div className="space-y-4">
        {orgs.map((org) => (
          <Card key={org.id}>
            <CardContent className="p-0">
              <button
                type="button"
                onClick={() => toggle(org.id)}
                className="flex w-full flex-wrap items-center gap-2 gap-y-3 border-b border-slate-200/60 px-4 py-4 text-left transition-colors hover:bg-sky-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue sm:flex-nowrap sm:gap-3"
                aria-expanded={expanded === org.id}
              >
                {expanded === org.id ? (
                  <ChevronDown className="h-5 w-5 shrink-0 text-brand-blue" />
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-navy">{org.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{org.type}</p>
                </div>
                <Badge variant="neutral">{org.branches.length} branches</Badge>
                <Badge variant="neutral">{org.usersCount} users</Badge>
                <Badge
                  variant={
                    org.status === "pending_review" ? "warning"
                    : org.status === "rejected" || org.status === "inactive" ? "error"
                    : "success"
                  }
                >
                  {org.status === "pending_review" ? "Pending Review" : org.status}
                </Badge>
                <div className="flex shrink-0 gap-2" onClick={(e) => e.stopPropagation()}>
                  {isSuperAdmin && org.status === "pending_review" && (
                    <Button type="button" size="sm" onClick={() => openReview(org)}>
                      Review
                    </Button>
                  )}
                  {org.status === "rejected" && (
                    <Button type="button" size="sm" variant="outline" onClick={() => reapply(org.id)}>
                      Resubmit
                    </Button>
                  )}
                  {isSuperAdmin && (org.status === "active" || org.status === "inactive") && (
                    <Button type="button" size="sm" variant="outline" onClick={() => setDeactivateTarget(org)}>
                      {org.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(org)}>
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => void openAudit(org.id)}>
                    Audit Trail
                  </Button>
                </div>
              </button>
              {org.status === "pending_review" && (
                <p className="border-b border-amber-100 bg-amber-50/60 px-4 py-2 text-xs text-amber-800">
                  Operations locked: this {org.type.toLowerCase()} organization is awaiting Super Admin compliance
                  review and will not receive operational permissions until approved.
                  {(org.reapplicationCount ?? 0) > 0 && ` (Resubmitted ${org.reapplicationCount}×)`}
                  {!isSuperAdmin && " Only a Super Admin can review it."}
                </p>
              )}
              {org.status === "rejected" && org.rejectionReason && (
                <p className="border-b border-red-100 bg-red-50/60 px-4 py-2 text-xs text-red-800">
                  Rejected: {org.rejectionReason}
                </p>
              )}
              {org.status === "inactive" && org.deactivationReason && (
                <p className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
                  Operations locked: this organization is inactive and its users will not receive operational
                  permissions. Reason: {org.deactivationReason}
                </p>
              )}
              {expanded === org.id ? (
                <div className="space-y-4 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-brand-navy">Branches</h3>
                    <div className="flex gap-2">
                      <input
                        className="rounded-md border border-surface-border px-2 py-1 text-xs"
                        placeholder="New branch"
                        value={branchDraft[org.id] ?? ""}
                        onChange={(e) =>
                          setBranchDraft((s) => ({ ...s, [org.id]: e.target.value }))
                        }
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => addBranch(org.id)}>
                        + Add Branch
                      </Button>
                    </div>
                  </div>
                  <div className="app-touch-x-scroll overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead className="text-[var(--text-secondary)]">
                        <tr>
                          <th className="py-2 pr-4 font-medium">Branch</th>
                          <th className="py-2 pr-4 font-medium">Location</th>
                          <th className="py-2 pr-4 font-medium">Users</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {org.branches.map((b) => (
                          <tr key={b.id}>
                            <td className="py-3 pr-4 font-medium">{b.name}</td>
                            <td className="py-3 pr-4">{b.location}</td>
                            <td className="py-3 pr-4">{b.usersCount ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Approval Checklist / Reject Modal */}
      <Modal open={!!reviewTarget} onOpenChange={(open) => { if (!open) setReviewTarget(null); }} title={`Review ${reviewTarget?.name ?? ""}`}>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-brand-navy">Approval checklist</p>
            {CHECKLIST_ITEMS.map((item) => (
              <label key={item.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!checklist[item.key]}
                  onChange={(e) => setChecklist((c) => ({ ...c, [item.key]: e.target.checked }))}
                />
                {item.label}
              </label>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium">Rejection reason (required if rejecting)</label>
            <textarea
              className="mt-1 min-h-20 w-full rounded-xl border border-surface-border px-3 py-2 text-sm"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain what's missing or incorrect…"
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1 text-red-600 hover:bg-red-50" onClick={() => void submitReview("reject")}>
              Reject
            </Button>
            <Button type="button" className="flex-1" onClick={() => void submitReview("approve")}>
              Approve
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Organization Modal */}
      <Modal open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }} title={`Edit ${editTarget?.name ?? ""}`}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">KRA PIN</label>
            <input className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm" value={editForm.kraPin} onChange={(e) => setEditForm((f) => ({ ...f, kraPin: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">Bank Payout Account</label>
            <input className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm" value={editForm.bankPayoutAccount} onChange={(e) => setEditForm((f) => ({ ...f, bankPayoutAccount: e.target.value }))} />
          </div>
          <Button type="button" className="w-full" onClick={() => void saveEdit()}>Save Changes</Button>
        </div>
      </Modal>

      {/* Activate/Deactivate Modal */}
      <Modal
        open={!!deactivateTarget}
        onOpenChange={(open) => { if (!open) { setDeactivateTarget(null); setDeactivateReason(""); } }}
        title={deactivateTarget?.status === "active" ? "Deactivate Organization" : "Activate Organization"}
      >
        <div className="space-y-4">
          {deactivateTarget?.status === "active" ? (
            <>
              <p className="text-sm text-slate-500">A reason is required — this will suspend the organization&apos;s ability to operate on the platform.</p>
              <textarea
                className="min-h-20 w-full rounded-xl border border-surface-border px-3 py-2 text-sm"
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="Reason for deactivation…"
              />
              <Button type="button" variant="outline" className="w-full text-red-600 hover:bg-red-50" onClick={() => void submitDeactivation("deactivate")}>
                Confirm Deactivation
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500">This will restore the organization&apos;s ability to operate on the platform.</p>
              <Button type="button" className="w-full" onClick={() => void submitDeactivation("activate")}>
                Confirm Activation
              </Button>
            </>
          )}
        </div>
      </Modal>

      {/* Audit Trail Modal */}
      <Modal open={!!auditTarget} onOpenChange={(open) => { if (!open) setAuditTarget(null); }} title="Audit Trail">
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {auditRows.length === 0 ? (
            <p className="text-sm text-slate-400">No audit history yet for this organization.</p>
          ) : (
            auditRows.map((row) => (
              <div key={row.id} className="rounded-lg border border-slate-100 px-3 py-2 text-xs">
                <p className="font-semibold text-slate-700">{row.action.replace(/_/g, " ")}</p>
                <p className="text-slate-400">{new Date(row.timestamp).toLocaleString()} · {row.userId.slice(0, 8)}…</p>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
