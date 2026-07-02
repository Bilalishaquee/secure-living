"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Plus, Pencil, Trash2, GripVertical, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

type TemplateItem = { id?: string; area: string; item: string; qty: number };
type CustomColumn = { key: string; label: string; type: "text" | "number" | "photo" | "file" | "checkbox" };
type Template = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  customColumns?: CustomColumn[] | null;
  _count?: { items: number };
  items?: { id?: string; section: string; item: string; defaultQty?: number; order: number }[];
};
type Preset = { key: string; name: string; category: string; description: string; itemCount: number };

const CUSTOM_COLUMN_PRESETS: { label: string; type: CustomColumn["type"] }[] = [
  { label: "Photo Evidence", type: "photo" },
  { label: "Responsible Party", type: "text" },
  { label: "Replacement Cost", type: "number" },
  { label: "Tenant Initials", type: "text" },
  { label: "Inspector Notes", type: "text" },
  { label: "Contractor Quote", type: "file" },
  { label: "Invoice Upload", type: "file" },
];

function slugifyColumnKey(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "field";
}

const CATEGORIES = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "FURNISHED", label: "Furnished" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "SHORT_STAY", label: "Short Stay" },
  { value: "CUSTOM", label: "Custom" },
];

const CATEGORY_BADGE: Record<string, string> = {
  RESIDENTIAL: "bg-blue-100 text-blue-700",
  FURNISHED: "bg-purple-100 text-purple-700",
  COMMERCIAL: "bg-amber-100 text-amber-700",
  SHORT_STAY: "bg-emerald-100 text-emerald-700",
  CUSTOM: "bg-slate-100 text-slate-700",
};

const emptyTemplate = { name: "", category: "RESIDENTIAL", description: "" };
const emptyItem: TemplateItem = { area: "", item: "", qty: 1 };

export default function ChecklistsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [tplForm, setTplForm] = useState(emptyTemplate);
  const [items, setItems] = useState<TemplateItem[]>([{ ...emptyItem }]);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [saving, setSaving] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showPresets, setShowPresets] = useState(false);

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

  async function loadPresets() {
    const res = await fetch(`/api/v1/checklist-templates/presets`, {
      headers: { Authorization: `Bearer ${user?.authToken}` },
    });
    if (res.ok) {
      const j = await res.json();
      setPresets(j.data ?? []);
    }
  }

  async function loadTemplate(id: string) {
    const res = await fetch(`/api/v1/checklist-templates/${id}`, {
      headers: { Authorization: `Bearer ${user?.authToken}` },
    });
    if (res.ok) {
      const j = await res.json();
      const tpl = j.data as Template;
      setSelected(tpl);
      setItems(
        tpl.items && tpl.items.length > 0
          ? tpl.items.map((it) => ({ id: it.id, area: it.section, item: it.item, qty: it.defaultQty ?? 1 }))
          : [{ ...emptyItem }],
      );
      setTplForm({ name: tpl.name, category: tpl.category ?? "CUSTOM", description: tpl.description ?? "" });
      setCustomColumns(tpl.customColumns ?? []);
    }
  }

  useEffect(() => {
    if (user?.authToken) {
      load();
      loadPresets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.authToken]);

  function openCreate() {
    setSelected(null);
    setCreating(true);
    setTplForm(emptyTemplate);
    setItems([{ ...emptyItem }]);
    setCustomColumns([]);
  }

  function addCustomColumnPreset(preset: { label: string; type: CustomColumn["type"] }) {
    setCustomColumns((prev) => {
      const key = slugifyColumnKey(preset.label);
      if (prev.some((c) => c.key === key)) return prev;
      return [...prev, { key, label: preset.label, type: preset.type }];
    });
  }

  function addCustomColumn() {
    setCustomColumns((prev) => [...prev, { key: `field_${prev.length + 1}`, label: "", type: "text" }]);
  }

  function updateCustomColumn(idx: number, field: keyof CustomColumn, value: string) {
    setCustomColumns((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        const next = { ...c, [field]: value } as CustomColumn;
        if (field === "label") next.key = slugifyColumnKey(value);
        return next;
      }),
    );
  }

  function removeCustomColumn(idx: number) {
    setCustomColumns((prev) => prev.filter((_, i) => i !== idx));
  }

  async function applyPreset(key: string) {
    const res = await fetch(`/api/v1/checklist-templates/presets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
      body: JSON.stringify({ preset: key }),
    });
    if (res.ok) {
      toast("Preset template created", "success");
      setShowPresets(false);
      load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast(j.error ?? "Failed to apply preset", "error");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const validItems = items
        .filter((i) => i.item.trim())
        .map((i, idx) => ({ section: i.area.trim() || "General", item: i.item.trim(), defaultQty: i.qty || 1, order: idx }));

      const validColumns = customColumns.filter((c) => c.label.trim());
      const body = JSON.stringify({
        name: tplForm.name,
        category: tplForm.category,
        description: tplForm.description,
        items: validItems,
        customColumns: validColumns,
      });

      if (selected) {
        const res = await fetch(`/api/v1/checklist-templates/${selected.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
          body,
        });
        if (res.ok) {
          toast("Template updated", "success");
          setSelected(null);
          load();
        } else {
          const j = await res.json();
          toast(j.error ?? "Failed", "error");
        }
      } else {
        const res = await fetch(`/api/v1/checklist-templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
          body,
        });
        if (res.ok) {
          toast("Template created", "success");
          setCreating(false);
          load();
        } else {
          const j = await res.json();
          toast(j.error ?? "Failed", "error");
        }
      }
    } finally {
      setSaving(false);
    }
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof TemplateItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  if (selected || creating) {
    const isEdit = !!selected;
    return (
      <div className="mx-auto max-w-3xl space-y-6">
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
                placeholder="e.g. Standard Residential Inspection"
                value={tplForm.name}
                onChange={(e) => setTplForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={tplForm.category}
                onChange={(e) => setTplForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
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
            <div className="hidden gap-2 px-6 text-xs font-medium uppercase tracking-wide text-slate-400 sm:flex">
              <span className="flex-1">Area</span>
              <span className="flex-1">Item *</span>
              <span className="w-20">Qty</span>
              <span className="w-6" />
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <GripVertical className="mt-2.5 h-4 w-4 shrink-0 text-slate-300" />
                <input
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Area (e.g. Living Room)"
                  value={item.area}
                  onChange={(e) => updateItem(idx, "area", e.target.value)}
                />
                <input
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder={`Item ${idx + 1} *`}
                  value={item.item}
                  onChange={(e) => updateItem(idx, "item", e.target.value)}
                />
                <input
                  type="number"
                  min={1}
                  className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={item.qty}
                  onChange={(e) => updateItem(idx, "qty", parseInt(e.target.value, 10) || 1)}
                />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="mt-2.5 text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {items.filter((i) => i.item.trim()).length === 0 && (
              <p className="text-xs text-slate-400">Add at least one item</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Custom Columns</CardTitle>
              <Button size="sm" variant="ghost" onClick={addCustomColumn} className="gap-1">
                <Plus className="h-3 w-3" /> Add Column
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Add landlord-defined fields captured per checklist row (e.g. Photo Evidence, Responsible Party,
              Replacement Cost, Tenant Initials, Inspector Notes, Contractor Quote, Invoice Upload). No restrictions.
            </p>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_COLUMN_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => addCustomColumnPreset(p)}
                  disabled={customColumns.some((c) => c.key === slugifyColumnKey(p.label))}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  + {p.label}
                </button>
              ))}
            </div>
            {customColumns.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="hidden gap-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-400 sm:flex">
                  <span className="flex-1">Column Label</span>
                  <span className="w-32">Field Type</span>
                  <span className="w-6" />
                </div>
                {customColumns.map((c, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <input
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Column label (e.g. Tenant Initials)"
                      value={c.label}
                      onChange={(e) => updateCustomColumn(idx, "label", e.target.value)}
                    />
                    <select
                      className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={c.type}
                      onChange={(e) => updateCustomColumn(idx, "type", e.target.value)}
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="photo">Photo</option>
                      <option value="file">File</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                    <button type="button" onClick={() => removeCustomColumn(idx)} className="mt-2.5 text-slate-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => { setSelected(null); setCreating(false); }} className="flex-1">Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!tplForm.name || items.filter((i) => i.item.trim()).length === 0 || saving}
            className="flex-1"
          >
            {saving ? "Savingâ€¦" : isEdit ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inspection Checklist Templates</h1>
          <p className="mt-1 text-sm text-slate-500">Build reusable inspection checklists (Area, Item, Qty) to assign to tenants for move-in / move-out</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPresets(true)} className="gap-2">
            <Sparkles className="h-4 w-4" /> Use Preset
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Template
          </Button>
        </div>
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
            <p className="mt-1 text-sm text-slate-500">Create a template or start from a built-in preset</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setShowPresets(true)} className="gap-2">
                <Sparkles className="h-4 w-4" /> Use Preset
              </Button>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" /> Create Template
              </Button>
            </div>
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
                    {t.category && (
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_BADGE[t.category] ?? "bg-slate-100 text-slate-700"}`}>
                        {t.category.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); loadTemplate(t.id); }} className="text-slate-400 hover:text-slate-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                {t.description && <p className="mt-2 text-sm text-slate-500 line-clamp-2">{t.description}</p>}
                <p className="mt-3 text-xs text-slate-400">
                  {t._count?.items ?? 0} items
                  {t.customColumns && t.customColumns.length > 0 ? ` • ${t.customColumns.length} custom columns` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showPresets} onOpenChange={setShowPresets} title="Start from a Preset">
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Instantly create an editable template from a Secure Living built-in inspection checklist.</p>
          {presets.map((p) => (
            <div key={p.key} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-500">{p.description} Â· {p.itemCount} items</p>
              </div>
              <Button size="sm" onClick={() => applyPreset(p.key)}>Use</Button>
            </div>
          ))}
          {presets.length === 0 && <p className="text-sm text-slate-400">No presets available.</p>}
        </div>
      </Modal>
    </div>
  );
}
