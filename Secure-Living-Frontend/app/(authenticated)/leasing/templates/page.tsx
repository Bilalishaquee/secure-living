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
import { Upload } from "lucide-react";

type LeaseTemplate = {
  id: string;
  name: string;
  description: string | null;
  fileUrl: string;
  fileFormat: string;
  fileSizeBytes: number | null;
  isActive: boolean;
  propertyId: string | null;
  unitId: string | null;
  assignedCount: number;
};

export default function LeaseTemplatesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<LeaseTemplate[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", fileUrl: "", fileFormat: "pdf", propertyId: "", unitId: "" });
  const [saving, setSaving] = useState(false);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadTemplates() {
    if (!user) return;
    const res = await fetch("/api/v1/lease-templates", { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: LeaseTemplate[] };
      setTemplates(json.data ?? []);
    } else {
      setTemplates([]);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, [user]);

  async function handleUpload() {
    if (!user) return;
    if (!form.name || !form.fileUrl) {
      toast("Name and file URL are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/lease-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          organizationId: user.organizationId,
          name: form.name,
          description: form.description || undefined,
          fileUrl: form.fileUrl,
          fileFormat: form.fileFormat,
          propertyId: form.propertyId || undefined,
          unitId: form.unitId || undefined,
        }),
      });
      if (res.ok) {
        toast("Template uploaded.", "success");
        setShowUpload(false);
        setForm({ name: "", description: "", fileUrl: "", fileFormat: "pdf", propertyId: "", unitId: "" });
        await loadTemplates();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to upload template.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<LeaseTemplate>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "fileFormat", header: "Format" },
    {
      key: "isActive",
      header: "Active",
      render: (r) => r.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>,
    },
    { key: "propertyId", header: "Property", render: (r) => r.propertyId?.slice(0, 8) ?? "—" },
    { key: "unitId", header: "Unit", render: (r) => r.unitId?.slice(0, 8) ?? "—" },
    {
      key: "fileUrl",
      header: "File",
      render: (r) => r.fileUrl ? <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-brand-blue underline text-sm">View</a> : "—",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Lease Templates</h1>
          <p className="app-page-lead">Manage lease document templates for properties and units.</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="mr-1.5 h-4 w-4" /> Upload Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={templates} columns={columns} rowKey={(r) => r.id} />
        </CardContent>
      </Card>

      <Modal open={showUpload} onOpenChange={setShowUpload} title="Upload Lease Template">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Template Name *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard Residential Lease" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Description</label>
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">File URL *</label>
            <input value={form.fileUrl} onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))} placeholder="https://storage.example.com/lease-template.pdf" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Format</label>
            <Select value={form.fileFormat} onValueChange={(v) => setForm((f) => ({ ...f, fileFormat: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">DOCX</SelectItem>
                <SelectItem value="doc">DOC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Property ID (optional)</label>
            <input value={form.propertyId} onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Unit ID (optional)</label>
            <input value={form.unitId} onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button onClick={() => { void handleUpload(); }} disabled={!form.name || !form.fileUrl || saving}>
              {saving ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
