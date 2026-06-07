"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { QrCode } from "lucide-react";

type QrApplication = {
  id: string;
  qrToken: string;
  applicantName: string;
  applicantPhone: string;
  listingId: string | null;
  status: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
  EXPIRED: "neutral",
};

export default function QrApplicationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<QrApplication[]>([]);
  const [showGenerate, setShowGenerate] = useState(false);
  const [form, setForm] = useState({ listingId: "", applicantName: "", applicantPhone: "" });
  const [saving, setSaving] = useState(false);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadApplications() {
    if (!user) return;
    const res = await fetch("/api/v1/qr-applications", { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: QrApplication[] };
      setApplications(json.data ?? []);
    } else {
      setApplications([]);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, [user]);

  async function handleGenerate() {
    if (!user || !form.applicantName || !form.applicantPhone) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/qr-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          listingId: form.listingId || undefined,
          applicantName: form.applicantName,
          applicantPhone: form.applicantPhone,
        }),
      });
      if (res.ok) {
        toast("QR application generated.", "success");
        setShowGenerate(false);
        setForm({ listingId: "", applicantName: "", applicantPhone: "" });
        await loadApplications();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to generate QR application.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<QrApplication>[] = [
    { key: "qrToken", header: "QR Token", sortable: true },
    { key: "applicantName", header: "Applicant" },
    { key: "applicantPhone", header: "Phone" },
    { key: "listingId", header: "Listing", render: (r) => r.listingId ?? "--" },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={STATUS_COLORS[r.status] ?? "neutral"}>{r.status}</Badge>,
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
          <h1 className="app-page-title">QR Applications</h1>
          <p className="app-page-lead">Manage QR-based rental applications.</p>
        </div>
        <Button onClick={() => setShowGenerate(true)}>
          <QrCode className="mr-1.5 h-4 w-4" /> Generate QR Application
        </Button>
      </div>

      <DataTable data={applications} columns={columns} rowKey={(r) => r.id} />

      <Modal open={showGenerate} onOpenChange={setShowGenerate} title="Generate QR Application">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Applicant Name *</label>
            <input value={form.applicantName} onChange={(e) => setForm((f) => ({ ...f, applicantName: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Applicant Phone *</label>
            <input value={form.applicantPhone} onChange={(e) => setForm((f) => ({ ...f, applicantPhone: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Listing ID (optional)</label>
            <input value={form.listingId} onChange={(e) => setForm((f) => ({ ...f, listingId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
            <Button onClick={() => { void handleGenerate(); }} disabled={!form.applicantName || !form.applicantPhone || saving}>
              {saving ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
