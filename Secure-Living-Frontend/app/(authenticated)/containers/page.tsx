"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Plus, Building2, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";


const TYPE_COLORS: Record<string, string> = {
  ESTATE: "bg-blue-100 text-blue-700",
  MALL: "bg-purple-100 text-purple-700",
  COMPLEX: "bg-teal-100 text-teal-700",
  COURTYARD: "bg-amber-100 text-amber-700",
  STANDALONE: "bg-slate-100 text-slate-700",
};

const CONTAINER_TYPES = [
  { value: "STANDALONE", label: "Standalone Property", description: "A single property not part of a larger development", icon: "🏠" },
  { value: "ESTATE", label: "Residential Estate", description: "Multiple residential properties in a planned estate", icon: "🏘️" },
  { value: "COMPLEX", label: "Apartment Complex", description: "Multi-building residential complex", icon: "🏢" },
  { value: "COURTYARD", label: "Courtyard", description: "Properties arranged around a shared courtyard", icon: "🏛️" },
  { value: "MALL", label: "Commercial Mall", description: "Multi-tenant commercial or retail development", icon: "🏬" },
];

type Container = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  _count: { properties: number; managers: number };
};

export default function ContainersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({ name: "", description: "", address: "", city: "", country: "Kenya" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/containers`, {
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        const j = await res.json();
        setContainers(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  async function handleCreate() {
    if (!selectedType || !form.name) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/containers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({ ...form, type: selectedType }),
      });
      if (res.ok) {
        toast({ title: "Container created", variant: "success" });
        setModalOpen(false);
        setStep(1);
        setSelectedType("");
        setForm({ name: "", description: "", address: "", city: "", country: "Kenya" });
        load();
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed to create", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Containers</h1>
          <p className="mt-1 text-sm text-slate-500">Group properties into estates, complexes, or malls</p>
        </div>
        <Button onClick={() => { setModalOpen(true); setStep(1); }} className="gap-2">
          <Plus className="h-4 w-4" /> New Container
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : containers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Layers className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No containers yet</p>
            <p className="mt-1 text-sm text-slate-500">Create a container to group your properties</p>
            <Button onClick={() => setModalOpen(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> New Container
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {containers.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/containers/${c.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-900">{c.name}</h3>
                    {c.city && <p className="text-sm text-slate-500">{c.city}{c.country ? `, ${c.country}` : ""}</p>}
                  </div>
                  <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLORS[c.type] ?? "bg-slate-100 text-slate-700"}`}>
                    {c.type}
                  </span>
                </div>
                {c.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{c.description}</p>
                )}
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" /> {c._count.properties} {c._count.properties === 1 ? "property" : "properties"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> {c._count.managers} {c._count.managers === 1 ? "manager" : "managers"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={step === 1 ? "Select Container Type" : "Container Details"} description={step === 1 ? "Choose the type of container that best describes your development" : undefined}>
        {step === 1 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CONTAINER_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => { setSelectedType(t.value); setStep(2); }}
                className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="font-semibold text-slate-900">{t.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder={`e.g. Greenwood ${selectedType === "ESTATE" ? "Estate" : selectedType === "MALL" ? "Mall" : "Complex"}`}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={handleCreate} disabled={!form.name || saving} className="flex-1">
                {saving ? "Creating…" : "Create Container"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
