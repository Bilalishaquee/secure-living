"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { RectificationBanner } from "@/components/rectification/RectificationBanner";
import { Building2, RotateCcw, MapPin, Pencil } from "lucide-react";

type OrgBranch = {
  id: string;
  name: string;
  location: string | null;
  status: string;
};

type Organization = {
  id: string;
  name: string;
  type: string;
  country: string;
  email: string;
  phone: string | null;
  kraPin?: string | null;
  bankPayoutAccount?: string | null;
  status: string;
  rejectionReason: string | null;
  deactivationReason?: string | null;
  reapplicationCount?: number;
  branches: OrgBranch[];
};

export default function TenantOrganizationPage() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRectIds, setActiveRectIds] = useState<Record<string, string>>({});
  const [editTarget, setEditTarget] = useState<Organization | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", kraPin: "", bankPayoutAccount: "" });

  const authHeader = useCallback(() => ({ Authorization: `Bearer ${user?.authToken ?? ""}` }), [user?.authToken]);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/me/organization", { headers: authHeader() });
      if (res.ok) {
        const { data } = await res.json();
        setOrgs(data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const STATUS_BADGE: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
    active: "success",
    pending_review: "warning",
    rejected: "error",
    inactive: "neutral",
  };

  const openEdit = (org: Organization) => {
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
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) return;
    setEditTarget(null);
    await fetchOrgs();
  };

  const reapply = async (orgId: string) => {
    const res = await fetch(`/api/v1/organizations/${orgId}/reapply`, {
      method: "POST",
      headers: authHeader(),
    });
    if (res.ok) await fetchOrgs();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-500">Loading...</div>;
  }

  if (orgs.length === 0) {
    return (
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="app-page-title">My Organization</h1>
            <p className="app-page-lead">You are not associated with any organization yet.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchOrgs}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Building2 className="h-12 w-12 text-gray-300" />
            <p className="text-sm text-gray-500">No organizations found. An admin must add you to an organization.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="app-page-title">My Organization</h1>
          <p className="app-page-lead">View your organization details and verification status.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrgs}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {orgs.map((org) => (
        <Card key={org.id}>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {org.name}
                <Badge variant={STATUS_BADGE[org.status] ?? "neutral"}>{org.status}</Badge>
              </CardTitle>
              <div className="flex gap-2">
                {org.status === "rejected" && (
                  <Button type="button" size="sm" variant="outline" onClick={() => void reapply(org.id)}>
                    Resubmit
                  </Button>
                )}
                <Button type="button" size="sm" variant="outline" onClick={() => openEdit(org)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {org.status === "pending_review" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Your organization is awaiting Super Admin approval. Operational access is locked until approval.
                {(org.reapplicationCount ?? 0) > 0 && ` Resubmitted ${org.reapplicationCount} time(s).`}
              </div>
            )}
            {org.status === "inactive" && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Your organization is inactive. Operational access is locked.
                {org.deactivationReason ? ` Reason: ${org.deactivationReason}` : ""}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Type</p>
                <p className="text-sm">{org.type}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Country</p>
                <p className="text-sm">{org.country}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Email</p>
                <p className="text-sm">{org.email}</p>
              </div>
              {org.phone && (
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Phone</p>
                  <p className="text-sm">{org.phone}</p>
                </div>
              )}
            </div>

            {org.branches.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Branches</p>
                <div className="space-y-1">
                  {org.branches.map((b) => (
                    <div key={b.id} className="flex items-center gap-2 rounded-md border border-slate-100 px-3 py-1.5 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span>{b.name}</span>
                      {b.location && <span className="text-xs text-gray-400">— {b.location}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(org.status === "rejected" || org.status === "REJECTED") && (
              <RectificationBanner
                module="organization"
                resourceId={org.id}
                originalStatus={org.status}
                rejectionReason={org.rejectionReason ?? undefined}
                activeRectification={activeRectIds[org.id] ? { id: activeRectIds[org.id], status: "initiated", deadline: new Date(Date.now() + 14 * 86400000).toISOString() } : null}
                onRectificationStarted={(id) => setActiveRectIds((prev) => ({ ...prev, [org.id]: id }))}
              />
            )}
          </CardContent>
        </Card>
      ))}

      <Modal open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }} title="Edit organization details">
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
            <label className="text-sm font-medium">Bank payout account</label>
            <input className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm" value={editForm.bankPayoutAccount} onChange={(e) => setEditForm((f) => ({ ...f, bankPayoutAccount: e.target.value }))} />
          </div>
          <Button type="button" className="w-full" onClick={() => void saveEdit()}>
            Save changes
          </Button>
        </div>
      </Modal>
    </div>
  );
}
