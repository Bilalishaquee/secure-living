"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Plus, Eye, Check, X } from "lucide-react";

type Visitor = {
  id: string;
  name: string;
  phone: string | null;
  unitId: string | null;
  organizationId: string;
  isBlacklisted: boolean;
  notes: string | null;
};

type VisitLog = {
  id: string;
  visitorId: string;
  status: string;
  approvalStatus: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  approvalMethod: string | null;
  purpose: string;
};

export default function VisitorsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", unitId: "" });
  const [saving, setSaving] = useState(false);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadVisitors() {
    if (!user) return;
    const res = await fetch("/api/v1/visitors", { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: Visitor[] };
      setVisitors(json.data ?? []);
    } else {
      setVisitors([]);
    }
  }

  useEffect(() => {
    void loadVisitors();
  }, [user]);

  async function fetchLogs(visitorId: string) {
    if (!user) return;
    setShowLogs(visitorId);
    const res = await fetch(`/api/v1/visitor-logs?visitorId=${visitorId}`, {
      headers: authHeader(),
    });
    if (res.ok) {
      const json = (await res.json()) as { data: VisitLog[] };
      setLogs(json.data ?? []);
    } else {
      setLogs([]);
    }
  }

  async function handleApprove(visitId: string) {
    if (!user) return;
    const res = await fetch(`/api/v1/visitor-logs/${visitId}/approve`, {
      method: "PATCH",
      headers: authHeader(),
    });
    if (res.ok) {
      toast("Visit approved.", "success");
      if (showLogs) await fetchLogs(showLogs);
    } else {
      toast("Failed to approve.", "error");
    }
  }

  async function handleDeny(visitId: string) {
    if (!user) return;
    const res = await fetch(`/api/v1/visitor-logs/${visitId}/deny`, {
      method: "PATCH",
      headers: authHeader(),
    });
    if (res.ok) {
      toast("Visit denied.", "success");
      if (showLogs) await fetchLogs(showLogs);
    } else {
      toast("Failed to deny.", "error");
    }
  }

  async function handleAdd() {
    if (!user || !form.name || !form.phone) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          organizationId: user.organizationId,
          name: form.name,
          phone: form.phone,
          unitId: form.unitId || undefined,
        }),
      });
      if (res.ok) {
        toast("Visitor added.", "success");
        setShowAdd(false);
        setForm({ name: "", phone: "", unitId: "" });
        await loadVisitors();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to add visitor.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Visitor>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "phone", header: "Phone", render: (r) => r.phone ?? "--" },
    { key: "unitId", header: "Unit", render: (r) => r.unitId ?? "--" },
    {
      key: "isBlacklisted",
      header: "Status",
      render: (r) => r.isBlacklisted ? <Badge variant="error">Blacklisted</Badge> : <Badge variant="success">Active</Badge>,
    },
    {
      key: "id",
      header: "",
      render: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { void fetchLogs(r.id); }}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const logColumns: Column<VisitLog>[] = [
    { key: "purpose", header: "Purpose" },
    {
      key: "approvalStatus",
      header: "Status",
      render: (r) => {
        const variant =
          r.approvalStatus === "APPROVED" || r.approvalStatus === "AUTO_APPROVED"
            ? "success"
            : r.approvalStatus === "DENIED"
            ? "error"
            : "warning";
        return <Badge variant={variant}>{r.approvalStatus}</Badge>;
      },
    },
    { key: "checkInAt", header: "Check In", render: (r) => r.checkInAt ? new Date(r.checkInAt).toLocaleString() : "--" },
    { key: "checkOutAt", header: "Check Out", render: (r) => r.checkOutAt ? new Date(r.checkOutAt).toLocaleString() : "--" },
    { key: "approvalMethod", header: "Method", render: (r) => r.approvalMethod ?? "--" },
    {
      key: "id",
      header: "",
      render: (r) =>
        r.approvalStatus === "PENDING" ? (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => { void handleApprove(r.id); }}>
              <Check className="h-4 w-4 text-emerald-500" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { void handleDeny(r.id); }}>
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Visitors</h1>
          <p className="app-page-lead">Manage visitors, check-ins, and access approvals.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Visitor
        </Button>
      </div>

      <DataTable data={visitors} columns={columns} rowKey={(r) => r.id} />

      <Modal open={showAdd} onOpenChange={setShowAdd} title="Add Visitor">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Name *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Phone *</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Unit ID</label>
            <input value={form.unitId} onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => { void handleAdd(); }} disabled={!form.name || !form.phone || saving}>
              {saving ? "Saving..." : "Add Visitor"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!showLogs} onOpenChange={(o) => { if (!o) setShowLogs(null); }} title="Visitor Logs">
        <DataTable data={logs} columns={logColumns} rowKey={(r) => r.id} />
      </Modal>
    </div>
  );
}
