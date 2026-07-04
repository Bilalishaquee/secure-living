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
import { ClipboardList, FileCheck2, Plus, Pencil, Sparkles, Trash2 } from "lucide-react";

type CustomField = {
  id: string;
  fieldLabel: string;
  fieldType: string;
  fieldOptions?: string[];
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
};

type Preset = {
  key: string;
  name: string;
  description: string;
  fieldCount: number;
};

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "upload", label: "File Upload" },
];

export default function CustomFieldsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CustomField | null>(null);
  const [form, setForm] = useState({ fieldLabel: "", fieldType: "text", fieldOptions: "", isRequired: false, displayOrder: 0 });
  const [saving, setSaving] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState<string | null>(null);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function fetchFields() {
    if (!user) return;
    const res = await fetch("/api/v1/crm/custom-fields", { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: CustomField[] };
      setFields(json.data ?? []);
    } else {
      setFields([]);
    }
  }

  async function fetchPresets() {
    if (!user) return;
    const res = await fetch("/api/v1/applications/custom-fields/presets", { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: Preset[] };
      setPresets(json.data ?? []);
    }
  }

  useEffect(() => {
    void fetchFields();
    void fetchPresets();
  }, [user]);

  function openEdit(field: CustomField) {
    setEditing(field);
    setForm({
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      fieldOptions: (field.fieldOptions ?? []).join(", "),
      isRequired: field.isRequired,
      displayOrder: field.displayOrder,
    });
    setShowAdd(true);
  }

  async function handleSave() {
    if (!user || !form.fieldLabel) return;
    setSaving(true);
    try {
      const url = editing ? `/api/v1/crm/custom-fields/${editing.id}` : "/api/v1/crm/custom-fields";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          fieldLabel: form.fieldLabel.trim(),
          fieldType: form.fieldType,
          fieldOptions: form.fieldOptions.split(",").map((v) => v.trim()).filter(Boolean),
          isRequired: form.isRequired,
          displayOrder: form.displayOrder,
        }),
      });
      if (res.ok) {
        toast(editing ? "Field updated." : "Field created.", "success");
        setShowAdd(false);
        setEditing(null);
        setForm({ fieldLabel: "", fieldType: "text", fieldOptions: "", isRequired: false, displayOrder: 0 });
        await fetchFields();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to save field.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function applyPreset(presetKey: string) {
    if (!user) return;
    setApplyingPreset(presetKey);
    try {
      const res = await fetch("/api/v1/applications/custom-fields/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ preset: presetKey }),
      });
      if (res.ok) {
        const json = (await res.json()) as { data: CustomField[] };
        setFields(json.data ?? []);
        toast("Application preset applied.", "success");
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to apply preset.", "error");
      }
    } finally {
      setApplyingPreset(null);
    }
  }

  async function handleDelete(field: CustomField) {
    if (!user) return;
    const res = await fetch(`/api/v1/crm/custom-fields/${field.id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    if (res.ok) {
      toast("Field deleted.", "success");
      await fetchFields();
    } else {
      toast("Failed to delete field.", "error");
    }
  }

  const columns: Column<CustomField>[] = [
    { key: "fieldLabel", header: "Label", sortable: true },
    {
      key: "fieldType",
      header: "Type",
      render: (row) => (
        <div>
          <p className="capitalize">{row.fieldType.replace(/_/g, " ")}</p>
          {row.fieldOptions?.length ? <p className="text-xs text-slate-500">{row.fieldOptions.join(", ")}</p> : null}
        </div>
      ),
    },
    {
      key: "isRequired",
      header: "Required",
      render: (row) => row.isRequired ? <Badge variant="info">Required</Badge> : <Badge variant="neutral">Optional</Badge>,
    },
    { key: "displayOrder", header: "Order", sortable: true },
    {
      key: "id",
      header: "",
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { void handleDelete(row); }}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Rental Application Setup</h1>
          <p className="app-page-lead">Build the application form used before tenant screening and lease creation.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ fieldLabel: "", fieldType: "text", fieldOptions: "", isRequired: false, displayOrder: fields.length }); setShowAdd(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Field
        </Button>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <span className="rounded-xl bg-blue-50 p-2 text-blue-700"><ClipboardList className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Tenant onboarding cycle</p>
              <p className="mt-1 text-xs text-slate-500">Tenants submit the application, managers screen it, then an accepted application becomes a lease offer.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><FileCheck2 className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{fields.length} active fields</p>
              <p className="mt-1 text-xs text-slate-500">{fields.filter((field) => field.isRequired).length} required fields will block incomplete submissions.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <span className="rounded-xl bg-violet-50 p-2 text-violet-700"><Sparkles className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Preset available</p>
              <p className="mt-1 text-xs text-slate-500">Apply a ready-made application template, then edit labels, required status, and order.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Application Presets</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {presets.map((preset) => (
            <div key={preset.key} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{preset.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{preset.description}</p>
                  <p className="mt-2 text-xs font-semibold text-blue-700">{preset.fieldCount} fields</p>
                </div>
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={() => void applyPreset(preset.key)}
                disabled={applyingPreset === preset.key}
              >
                {applyingPreset === preset.key ? "Applying..." : "Apply Preset"}
              </Button>
            </div>
          ))}
          {!presets.length ? <p className="text-sm text-slate-500">No presets available.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application Form Fields</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable data={fields} columns={columns} rowKey={(r) => r.id} />
          {!fields.length ? (
            <div className="border-t border-slate-100 p-8 text-center">
              <p className="font-semibold text-slate-900">Start with a preset or add your first field</p>
              <p className="mt-1 text-sm text-slate-500">Recommended fields include identity proof, income, occupants, move-in date, and supporting documents.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Modal open={showAdd} onOpenChange={setShowAdd} title={editing ? "Edit Field" : "Add New Field"}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Label *</label>
            <input
              value={form.fieldLabel}
              onChange={(e) => setForm((f) => ({ ...f, fieldLabel: e.target.value }))}
              placeholder="e.g. Employment Status"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Field Type</label>
            <Select value={form.fieldType} onValueChange={(v) => setForm((f) => ({ ...f, fieldType: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.fieldType === "dropdown" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Dropdown Options</label>
              <input
                value={form.fieldOptions}
                onChange={(e) => setForm((f) => ({ ...f, fieldOptions: e.target.value }))}
                placeholder="e.g. Employed, Self-employed, Student"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
              <p className="mt-1 text-xs text-slate-500">Separate options with commas.</p>
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Display Order</label>
            <input
              type="number" min="0"
              value={form.displayOrder}
              onChange={(e) => setForm((f) => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-blue"
            />
            Required field
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={() => { void handleSave(); }} disabled={!form.fieldLabel || saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
