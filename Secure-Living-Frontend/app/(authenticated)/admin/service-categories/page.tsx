"use client";

import { useEffect, useState } from "react";
import { Plus, ToggleLeft, ToggleRight, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";


type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm = { name: "", slug: "", tagline: "", description: "", sortOrder: "0" };

export default function ServiceCategoriesAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/service-categories`, {
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        const j = await res.json();
        setCategories(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(cat: ServiceCategory) {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      tagline: cat.tagline ?? "",
      description: cat.description ?? "",
      sortOrder: String(cat.sortOrder),
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        tagline: form.tagline || null,
        description: form.description || null,
        sortOrder: parseInt(form.sortOrder) || 0,
      };
      const url = editing
        ? `/api/v1/service-categories/${editing.id}`
        : `/api/v1/service-categories`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: editing ? "Updated" : "Created", variant: "success" });
        setModalOpen(false);
        load();
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(cat: ServiceCategory) {
    const res = await fetch(`/api/v1/service-categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    if (res.ok) {
      toast({ title: cat.isActive ? "Deactivated" : "Activated", variant: "success" });
      load();
    } else {
      const j = await res.json();
      toast({ title: j.error ?? "Failed", variant: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Categories</h1>
          <p className="mt-1 text-sm text-slate-500">Manage public-facing service categories shown on the homepage and /services page</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tagline</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{cat.slug}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-600">{cat.tagline ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{cat.sortOrder}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cat.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          className="text-slate-400 hover:text-slate-700"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(cat)}
                          className={cat.isActive ? "text-green-500 hover:text-slate-400" : "text-slate-400 hover:text-green-500"}
                          title={cat.isActive ? "Deactivate" : "Activate"}
                        >
                          {cat.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">No categories yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editing ? "Edit Category" : "Add Category"}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Slug *</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              placeholder="e.g. due-diligence"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tagline</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Short description shown on cards"
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Sort Order</label>
            <input
              type="number"
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.slug || saving} className="flex-1">
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
