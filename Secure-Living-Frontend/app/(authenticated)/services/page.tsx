"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Briefcase, Home, Scale, Palette, Sparkles, Wrench, BedDouble, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";


const ICON_MAP: Record<string, React.ElementType> = {
  "due-diligence": Scale,
  "foreigner-resettlement": Home,
  "property-valuation": Building2,
  "legal-advisory": Briefcase,
  "interior-design": Palette,
  "cleaning": Sparkles,
  "maintenance": Wrench,
  "airbnb-management": BedDouble,
};

const GRADIENT_MAP: Record<string, string> = {
  "due-diligence": "from-blue-500 to-blue-700",
  "foreigner-resettlement": "from-emerald-500 to-emerald-700",
  "property-valuation": "from-violet-500 to-violet-700",
  "legal-advisory": "from-amber-500 to-amber-700",
  "interior-design": "from-rose-500 to-rose-700",
  "cleaning": "from-teal-500 to-teal-700",
  "maintenance": "from-orange-500 to-orange-700",
  "airbnb-management": "from-sky-500 to-sky-700",
};

type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
};

export default function ServicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [enquireOpen, setEnquireOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<ServiceCategory | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/service-categories`)
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (j?.data) setCategories(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Pre-fill name/email from user profile
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.name || "",
        email: f.email || user.email || "",
      }));
    }
  }, [user]);

  function openEnquire(cat: ServiceCategory) {
    setSelectedCat(cat);
    setEnquireOpen(true);
  }

  async function handleEnquire() {
    if (!selectedCat || !form.name || !form.email || !form.message) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/service-enquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.authToken ? { Authorization: `Bearer ${user?.authToken}` } : {}),
        },
        body: JSON.stringify({
          categoryId: selectedCat.id,
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          message: form.message,
        }),
      });
      if (res.ok) {
        toast({ title: "Enquiry submitted! We'll be in touch soon.", variant: "success" });
        setEnquireOpen(false);
        setForm((f) => ({ ...f, phone: "", message: "" }));
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Supporting Services</h1>
        <p className="mt-1 text-sm text-slate-500">Professional services across the full property lifecycle</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <MessageSquare className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No services available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.slug] ?? Building2;
            const gradient = GRADIENT_MAP[cat.slug] ?? "from-slate-500 to-slate-700";
            return (
              <Card key={cat.id} className="flex flex-col transition-shadow hover:shadow-md">
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md`}>
                    <Icon className="h-5 w-5 text-white" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{cat.name}</h3>
                  {cat.tagline && (
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{cat.tagline}</p>
                  )}
                  {cat.description && !cat.tagline && (
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500 line-clamp-3">{cat.description}</p>
                  )}
                  <Button
                    onClick={() => openEnquire(cat)}
                    className="mt-4 w-full gap-2"
                  >
                    <MessageSquare className="h-4 w-4" /> Enquire
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={enquireOpen} onOpenChange={setEnquireOpen} title={`Enquire: ${selectedCat?.name ?? ""}`}>
        <div className="space-y-4">
          {selectedCat?.description && (
            <p className="text-sm text-slate-600 rounded-lg bg-slate-50 p-3">{selectedCat.description}</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Your Name *</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="+254 7XX XXX XXX"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Message *</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={4}
              placeholder="Describe what you need…"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setEnquireOpen(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={handleEnquire}
              disabled={!form.name || !form.email || !form.message || saving}
              className="flex-1"
            >
              {saving ? "Submitting…" : "Submit Enquiry"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
