"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Eye, Plus, Search, ShieldOff } from "lucide-react";

type ComplianceNumber = {
  id: string;
  complianceId: string;
  tenantId: string;
  propertyId: string | null;
  unitId: string | null;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  records?: { id: string; recordType: string; description: string | null; status: string; checkedAt: string }[];
};

type TenantOption = { tenantUserId: string; name: string; email: string; propertyName: string | null; unitNumber: string | null };
type PropertyOption = { id: string; name: string; propertyCode: string };
type UnitOption = { id: string; unitNumber: string; propertyId: string };

const STATUS_COLORS: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  EXPIRED: "error",
  REVOKED: "error",
};

export default function CompliancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complianceNumbers, setComplianceNumbers] = useState<ComplianceNumber[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedCompliance, setSelectedCompliance] = useState<ComplianceNumber | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ tenantId: "", propertyId: "", unitId: "" });
  const [saving, setSaving] = useState(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadCompliance(code?: string) {
    if (!user) return;
    const qs = code?.trim() ? `?code=${encodeURIComponent(code.trim())}` : "";
    const res = await fetch(`/api/v1/compliance-numbers${qs}`, { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: ComplianceNumber[] };
      setComplianceNumbers(json.data ?? []);
    } else {
      setComplianceNumbers([]);
    }
  }

  async function loadFormOptions() {
    if (!user) return;
    setLoadingOptions(true);
    try {
      const [tenantsRes, propertiesRes, unitsRes] = await Promise.all([
        fetch("/api/v1/tenants", { headers: authHeader() }),
        fetch("/api/v1/properties", { headers: authHeader() }),
        fetch("/api/v1/units", { headers: authHeader() }),
      ]);
      if (tenantsRes.ok) { const d = (await tenantsRes.json()) as { data: TenantOption[] }; setTenants(d.data ?? []); }
      if (propertiesRes.ok) { const d = (await propertiesRes.json()) as { data: PropertyOption[] }; setProperties(d.data ?? []); }
      if (unitsRes.ok) { const d = (await unitsRes.json()) as { data: UnitOption[] }; setUnits(d.data ?? []); }
    } finally { setLoadingOptions(false); }
  }

  useEffect(() => {
    void loadCompliance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (showCreate) void loadFormOptions();
  }, [showCreate]);

  useEffect(() => {
    const t = setTimeout(() => { void loadCompliance(search); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleRevoke() {
    if (!selectedCompliance) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/v1/compliance-numbers/${selectedCompliance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ status: "REVOKED", revokedReason: revokeReason.trim() || undefined }),
      });
      if (res.ok) {
        toast("Compliance number revoked.", "success");
        setSelectedCompliance(null);
        setRevokeReason("");
        await loadCompliance(search);
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to revoke.", "error");
      }
    } finally {
      setRevoking(false);
    }
  }

  async function handleCreate() {
    if (!user || !createForm.tenantId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/compliance-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          organizationId: user.organizationId,
          tenantId: createForm.tenantId,
          propertyId: createForm.propertyId || undefined,
          unitId: createForm.unitId || undefined,
        }),
      });
      if (res.ok) {
        toast("Compliance number issued.", "success");
        setShowCreate(false);
        setCreateForm({ tenantId: "", propertyId: "", unitId: "" });
        await loadCompliance();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to issue compliance number.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const filtered = filterStatus === "ALL" ? complianceNumbers : complianceNumbers.filter((c) => c.status === filterStatus);

  const columns: Column<ComplianceNumber>[] = [
    { key: "complianceId", header: "Compliance ID", sortable: true },
    { key: "tenantId", header: "Tenant" },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={STATUS_COLORS[r.status] ?? "neutral"}>{r.status}</Badge>,
    },
    {
      key: "issuedAt",
      header: "Issued Date",
      render: (r) => new Date(r.issuedAt).toLocaleDateString(),
    },
    {
      key: "id",
      header: "",
      render: (r) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedCompliance(r)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Compliance</h1>
          <p className="app-page-lead">
            Secure Living compliance numbers act like a property/agent/tenant &quot;number plate&quot; — format{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">SLC-{"{"}region{"}"}-{"{"}6 digits{"}"}</code>,
            auto-generated and collision-checked so no two are ever the same.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="REVOKED">Revoked</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Issue Compliance Number
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by compliance number (e.g. SLC-NAI-)"
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
        />
      </div>

      <DataTable data={filtered} columns={columns} rowKey={(r) => r.id} />

      <Modal open={!!selectedCompliance} onOpenChange={(o) => { if (!o) setSelectedCompliance(null); }} title="Compliance Details">
        {selectedCompliance && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Compliance ID</p>
                <p className="text-sm font-medium">{selectedCompliance.complianceId}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Status</p>
                <Badge variant={STATUS_COLORS[selectedCompliance.status] ?? "neutral"}>{selectedCompliance.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Tenant</p>
                <p className="text-sm">{selectedCompliance.tenantId}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Issued</p>
                <p className="text-sm">{new Date(selectedCompliance.issuedAt).toLocaleDateString()}</p>
              </div>
              {selectedCompliance.expiresAt && (
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Expires</p>
                  <p className="text-sm">{new Date(selectedCompliance.expiresAt).toLocaleDateString()}</p>
                </div>
              )}
              {selectedCompliance.status === "REVOKED" && selectedCompliance.revokedReason && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-[var(--text-secondary)]">Revocation Reason</p>
                  <p className="text-sm">{selectedCompliance.revokedReason}</p>
                </div>
              )}
            </div>

            {selectedCompliance.status !== "REVOKED" && (
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                  Revoke this compliance number
                </label>
                <input
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <Button
                  variant="outline"
                  className="w-full gap-2 text-red-600 hover:bg-red-50"
                  onClick={() => { void handleRevoke(); }}
                  disabled={revoking}
                >
                  <ShieldOff className="h-4 w-4" />
                  {revoking ? "Revoking…" : "Revoke"}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={showCreate} onOpenChange={setShowCreate} title="Issue Compliance Number">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Tenant ID *</label>
            <div className="flex gap-2">
              <input
                value={createForm.tenantId}
                onChange={(e) => setCreateForm((f) => ({ ...f, tenantId: e.target.value }))}
                placeholder="Type tenant ID"
                className="w-1/2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <Select
                value={createForm.tenantId}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, tenantId: v }))}
              >
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="Select tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingOptions ? (
                    <SelectItem value="__loading" disabled>Loading...</SelectItem>
                  ) : tenants.length === 0 ? (
                    <SelectItem value="__empty" disabled>No tenants found</SelectItem>
                  ) : (
                    tenants.map((t) => (
                      <SelectItem key={t.tenantUserId} value={t.tenantUserId}>
                        {t.name}{t.email ? ` — ${t.email}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Property ID (optional)</label>
            <div className="flex gap-2">
              <input
                value={createForm.propertyId}
                onChange={(e) => setCreateForm((f) => ({ ...f, propertyId: e.target.value, unitId: f.propertyId !== e.target.value ? "" : f.unitId }))}
                placeholder="Type property ID"
                className="w-1/2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <Select
                value={createForm.propertyId}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, propertyId: v, unitId: "" }))}
              >
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="Select property..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingOptions ? (
                    <SelectItem value="__loading" disabled>Loading...</SelectItem>
                  ) : properties.length === 0 ? (
                    <SelectItem value="__empty" disabled>No properties found</SelectItem>
                  ) : (
                    properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}{p.propertyCode ? ` (${p.propertyCode})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Unit ID (optional)</label>
            <div className="flex gap-2">
              <input
                value={createForm.unitId}
                onChange={(e) => setCreateForm((f) => ({ ...f, unitId: e.target.value }))}
                placeholder="Type unit ID"
                className="w-1/2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <Select
                value={createForm.unitId}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, unitId: v }))}
              >
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="Select unit..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingOptions ? (
                    <SelectItem value="__loading" disabled>Loading...</SelectItem>
                  ) : (
                    (createForm.propertyId
                      ? units.filter((u) => u.propertyId === createForm.propertyId)
                      : units
                    ).length === 0 ? (
                      <SelectItem value="__empty" disabled>No units found</SelectItem>
                    ) : (
                      (createForm.propertyId
                        ? units.filter((u) => u.propertyId === createForm.propertyId)
                        : units
                      ).map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.unitNumber ? `${u.unitNumber} (${u.id.slice(0, 8)})` : u.id.slice(0, 12)}
                        </SelectItem>
                      ))
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => { void handleCreate(); }} disabled={!createForm.tenantId || saving}>
              {saving ? "Issuing..." : "Issue"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
