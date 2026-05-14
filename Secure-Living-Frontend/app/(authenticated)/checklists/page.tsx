"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";


type TemplateItem = { id?: string; label: string; description: string; sortOrder: number };
type Template = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  isActive: boolean;
  _count?: { items: number };
  items?: TemplateItem[];
};

const emptyTemplate = { name: "", type: "MOVE_IN", description: "" };
const emptyItem = { label: "", description: "", sortOrder: 0 };

export default function ChecklistsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [tplForm, setTplForm] = useState(emptyTemplate);
  const [items, setItems] = useState<TemplateItem[]>([{ label: "", description: "", sortOrder: 0 }]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/checklist-templates`, {
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        const j = await res.json();
        setTemplates(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplate(id: string) {
    const res = await fetch(`/api/v1/checklist-templates/${id}`, {
      headers: { Authorization: `Bearer ${user?.authToken}` },
    });
    if (res.ok) {
      const j = await res.json();
      setSelected(j.data);
      setItems(j.data.items?.length > 0 ? j.data.items : [{ label: "", description: "", sortOrder: 0 }]);
      setTplForm({ name: j.data.name, type: j.data.type, description: j.data.description ?? "" });
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  function openCreate() {
    setSelected(null);
    setCreating(true);
    setTplForm(emptyTemplate);
    setItems([{ label: "", description: "", sortOrder: 0 }]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const validItems = items
        .filter((i) => i.label.trim())
        .map((i, idx) => ({ ...i, sortOrder: idx }));

      if (selected) {
        const res = await fetch(`/api/v1/checklist-templates/${selected.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
          body: JSON.stringify({ ...tplForm, items: validItems }),
        });
        if (res.ok) {
          toast({ title: "Template updated", variant: "success" });
          setSelected(null);
          load();
        } else {
          const j = await res.json();
          toast({ title: j.error ?? "Failed", variant: "error" });
        }
      } else {
        const res = await fetch(`/api/v1/checklist-templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
          body: JSON.stringify({ ...tplForm, items: validItems }),
        });
        if (res.ok) {
          toast({ title: "Template created", variant: "success" });
          setCreating(false);
          load();
        } else {
          const j = await res.json();
          toast({ title: j.error ?? "Failed", variant: "error" });
        }
      }
    } finally {
      setSaving(false);
    }
  }

  function addItem() {
    setItems((prev) => [...prev, { label: "", description: "", sortOrder: prev.length }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof TemplateItem, value: string) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  if (selected || creating) {
    const isEdit = !!selected;
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{isEdit ? "Edit Template" : "New Template"}</h1>
          <Button variant="ghost" onClick={() => { setSelected(null); setCreating(false); }}>Back</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Template Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Template Name *</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Standard Move-In Checklist"
                value={tplForm.name}
                onChange={(e) => setTplForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={tplForm.type}
                onChange={(e) => setTplForm((f) => ({ ...f, type: e.target.value }))}
              >
                <option value="MOVE_IN">Move-In</option>
                <option value="MOVE_OUT">Move-Out</option>
                <option value="INSPECTION">Inspection</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                rows={2}
                value={tplForm.description}
                onChange={(e) => setTplForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Checklist Items</CardTitle>
              <Button size="sm" variant="ghost" onClick={addItem} className="gap-1">
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <GripVertical className="mt-2.5 h-4 w-4 shrink-0 text-slate-300" />
                <div className="flex-1 space-y-2">
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder={`Item ${idx + 1} label *`}
                    value={item.label}
                    onChange={(e) => updateItem(idx, "label", e.target.value)}
                  />
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Description (optional)"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="mt-2.5 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {items.filter((i) => i.label.trim()).length === 0 && (
              <p className="text-xs text-slate-400">Add at least one item with a label</p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => { setSelected(null); setCreating(false); }} className="flex-1">Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!tplForm.name || items.filter((i) => i.label.trim()).length === 0 || saving}
            className="flex-1"
          >
            {saving ? "Saving…" : isEdit ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Checklist Templates</h1>
          <p className="mt-1 text-sm text-slate-500">Create reusable move-in and move-out checklists to assign to tenants</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ClipboardList className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No templates yet</p>
            <p className="mt-1 text-sm text-slate-500">Create checklist templates to standardise move-in and move-out inspections</p>
            <Button onClick={openCreate} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Create First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => loadTemplate(t.id)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${t.type === "MOVE_IN" ? "bg-blue-100 text-blue-700" : t.type === "MOVE_OUT" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-700"}`}>
                      {t.type.replace("_", "-")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); loadTemplate(t.id); }}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                {t.description && <p className="mt-2 text-sm text-slate-500 line-clamp-2">{t.description}</p>}
                <p className="mt-3 text-xs text-slate-400">{t._count?.items ?? 0} items</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
