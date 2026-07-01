"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Plus, Eye, Check, X, Ban, ShieldCheck } from "lucide-react";

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

type UnitOption = {
  id: string;
  unitNumber: string;
  propertyId: string;
  status: string;
};

export default function VisitorsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [unitSearch, setUnitSearch] = useState("");
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

  async function loadUnits() {
    if (!user) return;
    const res = await fetch("/api/v1/units", { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: UnitOption[] };
      setUnits(json.data ?? []);
    }
  }

  useEffect(() => {
    void loadVisitors();
    void loadUnits();
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

  async function setVisitorBlacklist(visitorId: string, isBlacklisted: boolean) {
    if (!user) return;
    const res = await fetch(`/api/v1/visitors/${visitorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ isBlacklisted }),
    });
    if (res.ok) {
      toast(isBlacklisted ? "Visitor blacklisted." : "Visitor whitelisted.", "success");
      await loadVisitors();
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      toast(err.error ?? "Failed to update visitor.", "error");
    }
  }

  const filteredUnits = units.filter((unit) => {
    const q = unitSearch.trim().toLowerCase();
    if (!q) return true;
    return [unit.id, unit.unitNumber, unit.propertyId, unit.status].some((value) => value.toLowerCase().includes(q));
  }).slice(0, 12);

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
          {r.isBlacklisted ? (
            <Button variant="ghost" size="sm" onClick={() => { void setVisitorBlacklist(r.id, false); }} title="Whitelist visitor">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => { void setVisitorBlacklist(r.id, true); }} title="Blacklist visitor">
              <Ban className="h-4 w-4 text-red-600" />
            </Button>
          )}
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
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Unit</label>
            <input
              value={unitSearch}
              onChange={(e) => setUnitSearch(e.target.value)}
              placeholder="Search unit number, property, or ID"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-1 [scrollbar-width:thin]">
              {filteredUnits.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-500">No units found.</p>
              ) : filteredUnits.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, unitId: unit.id }));
                    setUnitSearch(`${unit.unitNumber} - ${unit.id}`);
                  }}
                  className={`block w-full rounded-md px-3 py-2 text-left text-sm ${form.unitId === unit.id ? "bg-blue-100 text-blue-900" : "hover:bg-white"}`}
                >
                  <span className="font-medium">{unit.unitNumber}</span>
                  <span className="ml-2 text-xs text-slate-500">{unit.status} - {unit.id}</span>
                </button>
              ))}
            </div>
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
