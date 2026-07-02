"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { formatKes } from "@/lib/utils";
import { Upload, Plus } from "lucide-react";

type PastRentRecord = {
  id: string;
  tenantId: string;
  unitId: string;
  periodYear: number;
  periodMonth: number;
  rentAmountKes: number;
  paidAmountKes: number;
  balanceKes: number;
  dueDate: string | null;
  paidDate: string | null;
};

type ImportJob = {
  id: string;
  status: string;
  recordCount: number;
  successCount: number;
  errorCount: number;
  fileName: string;
  createdAt: string;
};

type UnlinkedGroup = {
  legacyUnitId: string;
  legacyTenantIds: string[];
  propertyId: string | null;
  recordCount: number;
};

type UnitOption = { id: string; unitNumber: string; propertyId: string };

const JOB_STATUS_COLORS: Record<string, "success" | "warning" | "error" | "neutral"> = {
  COMPLETED: "success",
  PROCESSING: "warning",
  FAILED: "error",
  PENDING: "neutral",
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DataImportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<PastRentRecord[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    tenantId: "",
    unitId: "",
    periodYear: new Date().getFullYear().toString(),
    periodMonth: (new Date().getMonth() + 1).toString(),
    rentAmountKes: "",
    paidAmountKes: "0",
  });
  const [saving, setSaving] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [unlinkedGroups, setUnlinkedGroups] = useState<UnlinkedGroup[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [linkChoice, setLinkChoice] = useState<Record<string, string>>({});
  const [linking, setLinking] = useState<string | null>(null);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadData() {
    if (!user) return;
    const [recRes, jobRes, unlinkedRes, unitsRes] = await Promise.all([
      fetch("/api/v1/data-import/rent-records", { headers: authHeader() }),
      fetch("/api/v1/data-import/jobs", { headers: authHeader() }),
      fetch("/api/v1/data-import/unlinked-records", { headers: authHeader() }),
      fetch("/api/v1/units", { headers: authHeader() }),
    ]);
    if (recRes.ok) {
      const j = (await recRes.json()) as { data: PastRentRecord[] };
      setRecords(j.data ?? []);
    }
    if (jobRes.ok) {
      const j = (await jobRes.json()) as { data: ImportJob[] };
      setJobs(j.data ?? []);
    }
    if (unlinkedRes.ok) {
      const j = (await unlinkedRes.json()) as { data: UnlinkedGroup[] };
      setUnlinkedGroups(j.data ?? []);
    }
    if (unitsRes.ok) {
      const j = (await unitsRes.json()) as { data: UnitOption[] };
      setUnits(j.data ?? []);
    }
  }

  useEffect(() => {
    void loadData();
  }, [user]);

  async function handleLinkGroup(legacyUnitId: string) {
    if (!user) return;
    const unitId = linkChoice[legacyUnitId];
    if (!unitId) { toast("Select a unit to link to first.", "error"); return; }
    setLinking(legacyUnitId);
    try {
      const res = await fetch("/api/v1/data-import/link-records", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ legacyUnitId, unitId }),
      });
      if (res.ok) {
        const j = (await res.json()) as { data: { linkedCount: number } };
        toast(`Linked ${j.data.linkedCount} record(s) to the selected unit.`, "success");
        await loadData();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to link records.", "error");
      }
    } finally {
      setLinking(null);
    }
  }

  async function handleUpload() {
    if (!user || !csvText.trim()) return;
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      toast("CSV must include a header row and at least one data row.", "error");
      return;
    }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const records = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = cols[i] ?? ""; });
      return {
        tenantId: obj.tenantid ?? obj.tenant_id ?? "",
        unitId: obj.unitid ?? obj.unit_id ?? "",
        periodYear: parseInt(obj.periodyear ?? obj.year ?? "2024"),
        periodMonth: parseInt(obj.periodmonth ?? obj.month ?? "1"),
        rentAmountKes: parseFloat(obj.rentamountkes ?? obj.rent ?? "0"),
        paidAmountKes: parseFloat(obj.paidamountkes ?? obj.paid ?? "0"),
      };
    }).filter((r) => r.tenantId && r.unitId);

    if (records.length === 0) {
      toast("No valid records found in CSV.", "error");
      return;
    }

    const res = await fetch("/api/v1/data-import/rent-records/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ fileName: "manual.csv", fileFormat: "csv", records }),
    });
    if (res.ok) {
      const j = (await res.json()) as { data: ImportJob };
      toast(`Imported ${j.data.successCount} records (${j.data.errorCount} errors).`, "success");
      setCsvText("");
      await loadData();
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      toast(err.error ?? "Upload failed.", "error");
    }
  }

  async function handleManualSubmit() {
    if (!user) return;
    setSaving(true);
    try {
      const rent = parseFloat(manualForm.rentAmountKes);
      const paid = parseFloat(manualForm.paidAmountKes) || 0;
      const res = await fetch("/api/v1/data-import/rent-records", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          organizationId: user.organizationId,
          tenantId: manualForm.tenantId,
          unitId: manualForm.unitId,
          periodYear: parseInt(manualForm.periodYear),
          periodMonth: parseInt(manualForm.periodMonth),
          rentAmountKes: rent,
          paidAmountKes: paid,
          balanceKes: Math.max(0, rent - paid),
        }),
      });
      if (res.ok) {
        toast("Record added.", "success");
        setShowManual(false);
        setManualForm({
          tenantId: "", unitId: "",
          periodYear: new Date().getFullYear().toString(),
          periodMonth: (new Date().getMonth() + 1).toString(),
          rentAmountKes: "", paidAmountKes: "0",
        });
        await loadData();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to add record.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const recordColumns: Column<PastRentRecord>[] = [
    { key: "tenantId", header: "Tenant", sortable: true },
    { key: "unitId", header: "Unit" },
    {
      key: "period",
      header: "Period",
      sortable: true,
      render: (r) => `${MONTH_NAMES[(r.periodMonth ?? 1) - 1] ?? r.periodMonth} ${r.periodYear}`,
    },
    { key: "rentAmountKes", header: "Rent", render: (r) => formatKes(r.rentAmountKes) },
    { key: "paidAmountKes", header: "Paid", render: (r) => formatKes(r.paidAmountKes) },
    { key: "balanceKes", header: "Balance", render: (r) => formatKes(r.balanceKes) },
  ];

  const jobColumns: Column<ImportJob>[] = [
    { key: "fileName", header: "File" },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={JOB_STATUS_COLORS[r.status] ?? "neutral"}>{r.status}</Badge>,
    },
    {
      key: "recordCount",
      header: "Records",
      render: (r) => `${r.successCount}/${r.recordCount}`,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Data Import</h1>
          <p className="app-page-lead">Import past rent records and manage data migration.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowManual(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Manual Entry
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSV Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-[var(--text-secondary)]">
            Paste your CSV here. Expected columns: <code className="rounded bg-slate-100 px-1">tenantId, unitId, periodYear, periodMonth, rentAmountKes, paidAmountKes</code>
          </p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={5}
            placeholder="tenantId,unitId,periodYear,periodMonth,rentAmountKes,paidAmountKes&#10;tenant-1,unit-1,2024,1,30000,30000"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
          />
          <Button onClick={() => { void handleUpload(); }} disabled={!csvText.trim()}>
            <Upload className="mr-1.5 h-4 w-4" /> Upload Records
          </Button>
        </CardContent>
      </Card>

      {unlinkedGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Link Imported Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[var(--text-secondary)]">
              These imported records reference legacy unit IDs from your old system. Match each one to the correct
              unit in Secure Living for a smooth transition — this links every record for that legacy unit at once.
            </p>
            {unlinkedGroups.map((g) => (
              <div key={g.legacyUnitId} className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="min-w-[180px]">
                  <p className="text-sm font-medium text-amber-900">Legacy unit: {g.legacyUnitId}</p>
                  <p className="text-xs text-amber-700">{g.recordCount} record(s) · {g.legacyTenantIds.length} tenant(s)</p>
                </div>
                <select
                  value={linkChoice[g.legacyUnitId] ?? ""}
                  onChange={(e) => setLinkChoice((c) => ({ ...c, [g.legacyUnitId]: e.target.value }))}
                  className="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select the real unit…</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.unitNumber} ({u.id})</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={() => { void handleLinkGroup(g.legacyUnitId); }}
                  disabled={!linkChoice[g.legacyUnitId] || linking === g.legacyUnitId}
                >
                  {linking === g.legacyUnitId ? "Linking…" : "Link"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Past Rent Records</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={records} columns={recordColumns} rowKey={(r) => r.id} />
        </CardContent>
      </Card>

      {showManual && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Past Rent Record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Tenant ID *</label>
                <input value={manualForm.tenantId} onChange={(e) => setManualForm((f) => ({ ...f, tenantId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Unit ID *</label>
                <input value={manualForm.unitId} onChange={(e) => setManualForm((f) => ({ ...f, unitId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Year *</label>
                <input type="number" min="2000" value={manualForm.periodYear} onChange={(e) => setManualForm((f) => ({ ...f, periodYear: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Month *</label>
                <input type="number" min="1" max="12" value={manualForm.periodMonth} onChange={(e) => setManualForm((f) => ({ ...f, periodMonth: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Rent (KES) *</label>
                <input type="number" value={manualForm.rentAmountKes} onChange={(e) => setManualForm((f) => ({ ...f, rentAmountKes: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Paid (KES)</label>
                <input type="number" value={manualForm.paidAmountKes} onChange={(e) => setManualForm((f) => ({ ...f, paidAmountKes: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { void handleManualSubmit(); }} disabled={!manualForm.tenantId || !manualForm.unitId || !manualForm.rentAmountKes || saving}>
                {saving ? "Saving..." : "Add Record"}
              </Button>
              <Button variant="ghost" onClick={() => setShowManual(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={jobs} columns={jobColumns} rowKey={(r) => r.id} />
        </CardContent>
      </Card>
    </div>
  );
}
