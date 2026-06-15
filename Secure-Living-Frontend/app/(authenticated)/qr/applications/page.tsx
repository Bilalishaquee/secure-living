"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { QrCode, Download, Copy, ExternalLink } from "lucide-react";

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
  PENDING:   "warning",
  VERIFIED:  "success",
  APPLIED:   "info",
  COMPLETED: "success",
  EXPIRED:   "neutral",
};

function buildApplyUrl(token: string): string {
  const base =
    (typeof window !== "undefined" ? window.location.origin : "") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "";
  return `${base}/qr/apply?token=${encodeURIComponent(token)}`;
}

// Downloads the SVG QR code element as a PNG via canvas
function downloadQr(svgEl: Element | null, token: string) {
  if (!svgEl) return;
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement("canvas");
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    const link = document.createElement("a");
    link.download = `${token}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
}

function QrModal({
  application,
  onClose,
}: {
  application: QrApplication;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const applyUrl = buildApplyUrl(application.qrToken);

  function copyUrl() {
    navigator.clipboard.writeText(applyUrl).then(() => toast("Link copied!", "success"));
  }

  function handleDownload() {
    const svgEl = qrContainerRef.current?.querySelector("svg");
    downloadQr(svgEl ?? null, application.qrToken);
  }

  return (
    <Modal open onOpenChange={onClose} title="QR Application Code">
      <div className="flex flex-col items-center gap-6">
        {/* QR Code */}
        <div ref={qrContainerRef} className="rounded-2xl border-4 border-slate-100 bg-white p-5 shadow-inner">
          <QRCode
            value={applyUrl}
            size={240}
            level="H"
            style={{ display: "block" }}
          />
        </div>

        {/* Applicant info */}
        <div className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Applicant</span>
            <span className="font-medium text-slate-700">{application.applicantName}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-slate-400">Phone</span>
            <span className="font-medium text-slate-700">{application.applicantPhone}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-slate-400">Status</span>
            <Badge variant={STATUS_COLORS[application.status] ?? "neutral"}>{application.status}</Badge>
          </div>
        </div>

        {/* URL preview */}
        <div className="w-full">
          <p className="mb-1 text-xs font-medium text-slate-500">Scan URL</p>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="flex-1 break-all font-mono text-xs text-slate-600">{applyUrl}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1"
            onClick={handleDownload}
          >
            <Download className="mr-1.5 h-4 w-4" /> Download PNG
          </Button>
          <Button variant="outline" className="flex-1" onClick={copyUrl}>
            <Copy className="mr-1.5 h-4 w-4" /> Copy Link
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open(applyUrl, "_blank")}
          >
            <ExternalLink className="mr-1.5 h-4 w-4" /> Preview
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function QrApplicationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<QrApplication[]>([]);
  const [showGenerate, setShowGenerate] = useState(false);
  const [viewingQr, setViewingQr] = useState<QrApplication | null>(null);
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
        const json = (await res.json()) as { data: QrApplication };
        toast("QR application generated.", "success");
        setShowGenerate(false);
        setForm({ listingId: "", applicantName: "", applicantPhone: "" });
        await loadApplications();
        // Immediately show the QR code modal for the new entry
        setViewingQr(json.data);
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to generate QR application.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<QrApplication>[] = [
    {
      key: "qrToken",
      header: "QR Code",
      render: (r) => (
        <button
          onClick={() => setViewingQr(r)}
          className="group relative inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          title="Click to view QR code"
        >
          {/* Mini inline QR preview */}
          <span className="inline-block rounded border border-slate-200 bg-white p-0.5 shadow-sm transition group-hover:shadow-md">
            <QRCode
              value={buildApplyUrl(r.qrToken)}
              size={36}
              level="M"
            />
          </span>
          <span className="hidden max-w-[140px] truncate font-mono text-xs text-slate-500 sm:block">
            {r.qrToken}
          </span>
        </button>
      ),
    },
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
    {
      key: "id",
      header: "",
      render: (r) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setViewingQr(r)}
        >
          <QrCode className="h-3.5 w-3.5" />
        </Button>
      ),
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

      {/* Generate modal */}
      <Modal open={showGenerate} onOpenChange={setShowGenerate} title="Generate QR Application">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Applicant Name *</label>
            <input
              value={form.applicantName}
              onChange={(e) => setForm((f) => ({ ...f, applicantName: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Applicant Phone *</label>
            <input
              value={form.applicantPhone}
              onChange={(e) => setForm((f) => ({ ...f, applicantPhone: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="+254 700 000 000"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Listing ID (optional)</label>
            <input
              value={form.listingId}
              onChange={(e) => setForm((f) => ({ ...f, listingId: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Leave blank if no specific listing"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
            <Button
              onClick={() => { void handleGenerate(); }}
              disabled={!form.applicantName || !form.applicantPhone || saving}
            >
              {saving ? "Generating…" : "Generate"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* QR viewer modal */}
      {viewingQr && (
        <QrModal application={viewingQr} onClose={() => setViewingQr(null)} />
      )}
    </div>
  );
}
