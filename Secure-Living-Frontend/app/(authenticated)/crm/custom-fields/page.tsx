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
import { Plus, Pencil, Trash2 } from "lucide-react";

type CustomField = {
  id: string;
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
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
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CustomField | null>(null);
  const [form, setForm] = useState({ fieldLabel: "", fieldType: "text", isRequired: false, displayOrder: 0 });
  const [saving, setSaving] = useState(false);

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

  useEffect(() => { void fetchFields(); }, [user]);

  function openEdit(field: CustomField) {
    setEditing(field);
    setForm({
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
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
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast(editing ? "Field updated." : "Field created.", "success");
        setShowAdd(false);
        setEditing(null);
        setForm({ fieldLabel: "", fieldType: "text", isRequired: false, displayOrder: 0 });
        await fetchFields();
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to save field.", "error");
      }
    } finally {
      setSaving(false);
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
    { key: "fieldType", header: "Type" },
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
          <h1 className="app-page-title">Application Custom Fields</h1>
          <p className="app-page-lead">Manage custom fields for rental application forms.</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ fieldLabel: "", fieldType: "text", isRequired: false, displayOrder: fields.length }); setShowAdd(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Field
        </Button>
      </div>

      <DataTable data={fields} columns={columns} rowKey={(r) => r.id} />

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
