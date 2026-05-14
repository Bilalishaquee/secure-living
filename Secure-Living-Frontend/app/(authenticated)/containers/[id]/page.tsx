"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Plus, Users, Pencil } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";


type Props = { params: { id: string } };

type ContainerDetail = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  managers: Array<{ id: string; userId: string; role: string; assignedAt: string }>;
  properties: Array<{
    id: string;
    name: string;
    propertyType: string;
    status: string;
    addressLine1: string;
    city: string | null;
  }>;
};

export default function ContainerDetailPage({ params }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [container, setContainer] = useState<ContainerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", address: "", city: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/containers/${params.id}`, {
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        const j = await res.json();
        setContainer(j.data);
        setEditForm({
          name: j.data.name,
          description: j.data.description ?? "",
          address: j.data.address ?? "",
          city: j.data.city ?? "",
        });
      } else if (res.status === 404) {
        router.push("/containers");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/containers/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast({ title: "Container updated", variant: "success" });
        setEditOpen(false);
        load();
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed to update", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (!container) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/containers" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Containers
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{container.name}</h1>
            <Badge variant="neutral" className="capitalize">{container.type}</Badge>
          </div>
          {(container.address || container.city) && (
            <p className="mt-1 text-sm text-slate-500">
              {[container.address, container.city, container.country].filter(Boolean).join(", ")}
            </p>
          )}
          {container.description && (
            <p className="mt-2 max-w-xl text-sm text-slate-600">{container.description}</p>
          )}
        </div>
        <Button variant="ghost" onClick={() => setEditOpen(true)} className="gap-2">
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      </div>

      {/* Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Properties ({container.properties.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {container.properties.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No properties in this container yet.
              <br />
              <Link href="/properties/new" className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:underline">
                <Plus className="h-3.5 w-3.5" /> Create a property
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {container.properties.map((p) => (
                <Link
                  key={p.id}
                  href={`/properties/${p.id}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{p.name}</p>
                    <p className="truncate text-xs text-slate-500">{p.propertyType} · {p.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Managers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Managers ({container.managers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {container.managers.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">No managers assigned</p>
          ) : (
            <div className="space-y-2">
              {container.managers.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{m.userId}</p>
                    <p className="text-xs capitalize text-slate-500">{m.role}</p>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(m.assignedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Modal open={editOpen} onOpenChange={setEditOpen} title="Edit Container">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={2}
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={editForm.city}
                onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={!editForm.name || saving} className="flex-1">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
