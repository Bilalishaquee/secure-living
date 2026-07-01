"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Eye } from "lucide-react";

type Application = {
  id: string;
  applicantId: string;
  listingId: string;
  listing?: { id: string; title: string } | null;
  status: string;
  message: string | null;
  submittedAt: string;
  evidences: { id: string; filePath: string; fileName: string; mimeType: string | null; evidenceType: string | null }[];
  customFieldValues: { id: string; field: { fieldLabel: string }; value: string | null; fileUrl: string | null }[];
};

const STATUS_COLORS: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
  REVIEWING: "info",
  CANCELLED: "neutral",
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadApps() {
    if (!user) return;
    const res = await fetch("/api/v1/crm/applications", { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: Application[] };
      setApplications(json.data ?? []);
    } else {
      setApplications([]);
    }
  }

  useEffect(() => {
    void loadApps();
  }, [user]);

  const filtered = filterStatus === "ALL" ? applications : applications.filter((a) => a.status === filterStatus);

  const columns: Column<Application>[] = [
    { key: "applicantId", header: "Applicant ID", render: (r) => r.applicantId.slice(0, 8), sortable: true },
    { key: "listingId", header: "Listing", render: (r) => r.listing?.title ?? r.listingId.slice(0, 8) },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={STATUS_COLORS[row.status] ?? "neutral"}>{row.status}</Badge>,
    },
    {
      key: "submittedAt",
      header: "Submitted",
      render: (row) => new Date(row.submittedAt).toLocaleDateString(),
    },
    {
      key: "id",
      header: "",
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedApp(row)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Rental Applications</h1>
          <p className="app-page-lead">Review and manage rental applications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REVIEWING">Reviewing</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable data={filtered} columns={columns} rowKey={(r) => r.id} />

      <Modal open={!!selectedApp} onOpenChange={(o) => { if (!o) setSelectedApp(null); }} title="Application Details">
        {selectedApp && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Applicant ID</p>
                <p className="text-sm font-medium">{selectedApp.applicantId}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Status</p>
                <Badge variant={STATUS_COLORS[selectedApp.status] ?? "neutral"}>{selectedApp.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Listing</p>
                <p className="text-sm">{selectedApp.listing?.title ?? selectedApp.listingId}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Submitted</p>
                <p className="text-sm">{new Date(selectedApp.submittedAt).toLocaleDateString()}</p>
              </div>
              {selectedApp.message && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-[var(--text-secondary)]">Message</p>
                  <p className="text-sm">{selectedApp.message}</p>
                </div>
              )}
            </div>
            {selectedApp.customFieldValues && selectedApp.customFieldValues.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Custom Fields</p>
                <div className="space-y-1">
                  {selectedApp.customFieldValues.map((cf) => (
                    <div key={cf.id} className="flex justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                      <span className="text-[var(--text-secondary)]">{cf.field.fieldLabel}</span>
                      <span>{cf.value ?? (cf.fileUrl ? "(file uploaded)" : "—")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedApp.evidences && selectedApp.evidences.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Evidence</p>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.evidences.map((ev, i) => (
                    <a key={ev.id ?? i} href={ev.filePath} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-blue underline">
                      {ev.fileName || `Document ${i + 1}`}{ev.evidenceType ? ` (${ev.evidenceType})` : ""}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
