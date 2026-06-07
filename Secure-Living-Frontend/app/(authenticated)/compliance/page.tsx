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
import { Eye, Plus } from "lucide-react";

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
  const [selectedCompliance, setSelectedCompliance] = useState<ComplianceNumber | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ tenantId: "", propertyId: "", unitId: "" });
  const [saving, setSaving] = useState(false);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadCompliance() {
    if (!user) return;
    const res = await fetch("/api/v1/compliance-numbers", { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: ComplianceNumber[] };
      setComplianceNumbers(json.data ?? []);
    } else {
      setComplianceNumbers([]);
    }
  }

  useEffect(() => {
    void loadCompliance();
  }, [user]);

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
          <p className="app-page-lead">Secure Living compliance numbers and records.</p>
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
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showCreate} onOpenChange={setShowCreate} title="Issue Compliance Number">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Tenant ID *</label>
            <input value={createForm.tenantId} onChange={(e) => setCreateForm((f) => ({ ...f, tenantId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Property ID (optional)</label>
            <input value={createForm.propertyId} onChange={(e) => setCreateForm((f) => ({ ...f, propertyId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Unit ID (optional)</label>
            <input value={createForm.unitId} onChange={(e) => setCreateForm((f) => ({ ...f, unitId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
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
