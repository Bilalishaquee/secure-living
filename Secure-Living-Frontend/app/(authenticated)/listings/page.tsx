"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Globe, ImagePlus, Megaphone, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatKes } from "@/lib/utils";


const STATUS_TABS = ["All", "DRAFT", "PUBLISHED", "UNDER_OFFER", "LET", "WITHDRAWN"];

const STATUS_COLORS: Record<string, string> = {
  DRAFT:       "bg-slate-100 text-slate-700",
  PUBLISHED:   "bg-green-100 text-green-700",
  UNDER_OFFER: "bg-blue-100 text-blue-700",
  LET:         "bg-purple-100 text-purple-700",
  WITHDRAWN:   "bg-red-100 text-red-700",
};

type ListingForm = {
  unitId: string;
  title: string;
  description: string;
  listingPurpose: string;
  rentAmount: string;
  saleAmountKes: string;
  availableFrom: string;
  leaseDuration: string;
  depositModel: string;
  furnished: boolean;
  petFriendly: boolean;
  featuresText: string;
  photoUrl: string;
  photos: string[];
  contactUnlockFeeKes: string;
  customAttributes: { key: string; label: string; value: string }[];
};

const initialForm: ListingForm = {
  unitId: "",
  title: "",
  description: "",
  listingPurpose: "Rental",
  rentAmount: "",
  saleAmountKes: "",
  availableFrom: "",
  leaseDuration: "",
  depositModel: "LANDLORD_RESERVE",
  furnished: false,
  petFriendly: false,
  featuresText: "",
  photoUrl: "",
  photos: [],
  contactUnlockFeeKes: "",
  customAttributes: [],
};

type Listing = {
  id: string;
  title: string;
  rentAmount: number;
  currency: string;
  status: string;
  availableFrom: string;
  publishedAt: string | null;
  depositModel: string;
  escrowBadge: boolean;
  fullyCoveredBadge: boolean;
  createdAt: string;
  unit: { unitNumber: string; unitType: string; bedrooms: number | null };
  _count: { applications: number };
};

export default function ListingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [vacantUnits, setVacantUnits] = useState<Array<{ id: string; unitNumber: string; propertyId: string }>>([]);
  const [form, setForm] = useState<ListingForm>(initialForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/listings`, {
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        const j = await res.json();
        setListings(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadVacantUnits() {
    const res = await fetch(`/api/v1/units?status=vacant`, {
      headers: { Authorization: `Bearer ${user?.authToken}` },
    });
    if (res.ok) {
      const j = await res.json();
      setVacantUnits(j.data ?? []);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  const filtered = activeTab === "All" ? listings : listings.filter((l) => l.status === activeTab);

  function openCreateModal() {
    setForm(initialForm);
    setCreateOpen(true);
    void loadVacantUnits();
  }

  function featuresFromText(value: string) {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function addPhotoUrl() {
    const value = form.photoUrl.trim();
    if (!value) return;
    setForm((f) => ({ ...f, photoUrl: "", photos: [...f.photos, value] }));
  }

  function removePhoto(index: number) {
    setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== index) }));
  }

  async function addPhotoFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Only image files can be added as listing photos", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast("Listing photo must be 2MB or smaller", "error");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    setForm((f) => ({ ...f, photos: [...f.photos, dataUrl] }));
  }

  function addCustomAttribute() {
    setForm((f) => ({
      ...f,
      customAttributes: [...f.customAttributes, { key: "", label: "", value: "" }],
    }));
  }

  function updateCustomAttribute(index: number, patch: Partial<{ key: string; label: string; value: string }>) {
    setForm((f) => ({
      ...f,
      customAttributes: f.customAttributes.map((attr, i) => (i === index ? { ...attr, ...patch } : attr)),
    }));
  }

  function removeCustomAttribute(index: number) {
    setForm((f) => ({ ...f, customAttributes: f.customAttributes.filter((_, i) => i !== index) }));
  }

  function customAttributesForSubmit() {
    const attrs = form.customAttributes
      .map((attr) => ({
        key: (attr.key || attr.label).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""),
        label: attr.label.trim(),
        value: attr.value.trim(),
      }))
      .filter((attr) => attr.key && attr.label && attr.value);

    if (form.saleAmountKes.trim()) {
      attrs.unshift({
        key: "sale_amount_kes",
        label: "Sale Amount (KES)",
        value: form.saleAmountKes.trim(),
      });
    }
    attrs.unshift({
      key: "listing_purpose",
      label: "Listing Purpose",
      value: form.listingPurpose,
    });
    return attrs;
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({
          unitId: form.unitId,
          title: form.title,
          rentAmount: parseFloat(form.rentAmount),
          availableFrom: form.availableFrom,
          leaseDuration: form.leaseDuration || undefined,
          description: form.description || undefined,
          furnished: form.furnished,
          petFriendly: form.petFriendly,
          features: featuresFromText(form.featuresText),
          photos: form.photos,
          contactUnlockFeeKes: form.contactUnlockFeeKes ? parseFloat(form.contactUnlockFeeKes) : undefined,
          customAttributes: customAttributesForSubmit(),
          depositModel: form.depositModel,
        }),
      });
      if (res.ok) {
        const j = await res.json();
        toast("Listing created", "success");
        setCreateOpen(false);
        router.push(`/listings/${j.data.id}`);
      } else {
        const j = await res.json();
        toast((j as { error?: string }).error ?? "Failed to create", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function republishListing(listingId: string) {
    const res = await fetch(`/api/v1/listings/${listingId}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user?.authToken}` },
    });
    if (res.ok) {
      toast("Listing republished", "success");
      await load();
    } else {
      const j = await res.json();
      toast((j as { error?: string }).error ?? "Failed to republish listing", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listings</h1>
          <p className="mt-1 text-sm text-slate-500">Manage rental listings for vacant units</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" /> Create Listing
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            {tab === "All" ? `All (${listings.length})` : `${tab} (${listings.filter((l) => l.status === tab).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Megaphone className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No listings</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => {
            const sc = STATUS_COLORS[l.status] ?? "bg-slate-100 text-slate-700";
            return (
              <Card key={l.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/listings/${l.id}`)}
                      className="min-w-0 text-left font-semibold text-slate-900 hover:text-blue-700"
                    >
                      <span className="line-clamp-2">{l.title}</span>
                    </button>
                    <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${sc}`}>{l.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Unit {l.unit?.unitNumber} · {l.unit?.unitType}
                    {l.unit?.bedrooms ? ` · ${l.unit.bedrooms} bed` : ""}
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatKes(l.rentAmount)} <span className="text-sm font-normal text-slate-500">/mo</span>
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>From {new Date(l.availableFrom).toLocaleDateString()}</span>
                    <span>{l._count.applications} application{l._count.applications !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {l.escrowBadge ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Escrow Badge</span>
                    ) : null}
                    {l.fullyCoveredBadge ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Fully Covered</span>
                    ) : null}
                    {!l.escrowBadge && !l.fullyCoveredBadge ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Landlord Reserve</span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/listings/${l.id}`)}
                      className="gap-1.5"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </Button>
                    {l.status === "WITHDRAWN" ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void republishListing(l.id)}
                        className="gap-1.5"
                      >
                        <Globe className="h-3.5 w-3.5" /> Republish
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Create Listing" className="max-w-[56rem]">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Unit *</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.unitId}
              onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
            >
              <option value="">Select vacant unit…</option>
              {vacantUnits.map((u) => (
                <option key={u.id} value={u.id}>Unit {u.unitNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Listing Title *</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Spacious 2BR in Westlands"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={4}
              placeholder="Describe the unit, neighborhood, fittings, parking, security, and viewing terms."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Listing Purpose</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.listingPurpose}
              onChange={(e) => setForm((f) => ({ ...f, listingPurpose: e.target.value }))}
            >
              <option value="Rental">Rental</option>
              <option value="Sale">Sale</option>
              <option value="Rent or Sale">Rent or Sale</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Monthly Rent (KES) *</label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.rentAmount}
                onChange={(e) => setForm((f) => ({ ...f, rentAmount: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Sale Amount (KES)</label>
              <input
                type="number"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Optional asking price"
                value={form.saleAmountKes}
                onChange={(e) => setForm((f) => ({ ...f, saleAmountKes: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Available From *</label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={form.availableFrom}
                onChange={(e) => setForm((f) => ({ ...f, availableFrom: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Lease Duration</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="e.g. 12 months, Monthly"
                value={form.leaseDuration}
                onChange={(e) => setForm((f) => ({ ...f, leaseDuration: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.furnished}
                onChange={(e) => setForm((f) => ({ ...f, furnished: e.target.checked }))}
              />
              Furnished
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.petFriendly}
                onChange={(e) => setForm((f) => ({ ...f, petFriendly: e.target.checked }))}
              />
              Pet friendly
            </label>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Features / Amenities</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="One per line or comma-separated, e.g. Parking, Borehole, Balcony, CCTV"
              value={form.featuresText}
              onChange={(e) => setForm((f) => ({ ...f, featuresText: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Listing Pictures</label>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Paste image URL"
                value={form.photoUrl}
                onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
              />
              <Button type="button" variant="outline" onClick={addPhotoUrl}>
                Add URL
              </Button>
            </div>
            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-700">
              <ImagePlus className="h-4 w-4" />
              Upload image from device
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void addPhotoFile(e.target.files?.[0] ?? null);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            {form.photos.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {form.photos.map((photo, index) => (
                  <div key={`${photo}-${index}`} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={`Listing photo ${index + 1}`} className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-slate-700 shadow hover:text-red-600"
                      aria-label="Remove photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contact Unlock Fee (KES)</label>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Leave blank to use platform default"
              value={form.contactUnlockFeeKes}
              onChange={(e) => setForm((f) => ({ ...f, contactUnlockFeeKes: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-slate-700">Additional Listing Attributes</label>
              <Button type="button" size="sm" variant="outline" onClick={addCustomAttribute}>
                <Plus className="h-3.5 w-3.5" /> Add attribute
              </Button>
            </div>
            {form.customAttributes.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-500">
                Add custom fields such as parking spaces, floor level, service charge, title status, viewing notes, or agency terms.
              </p>
            ) : (
              <div className="space-y-2">
                {form.customAttributes.map((attr, index) => (
                  <div key={index} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Key, e.g. parking_spaces"
                      value={attr.key}
                      onChange={(e) => updateCustomAttribute(index, { key: e.target.value })}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Label, e.g. Parking Spaces"
                      value={attr.label}
                      onChange={(e) => updateCustomAttribute(index, { label: e.target.value })}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Value"
                      value={attr.value}
                      onChange={(e) => updateCustomAttribute(index, { value: e.target.value })}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomAttribute(index)} aria-label="Remove attribute">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Deposit Listing Badge</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={form.depositModel}
              onChange={(e) => setForm((f) => ({ ...f, depositModel: e.target.value }))}
            >
              <option value="LANDLORD_RESERVE">Landlord Reserve</option>
              <option value="DEPOSIT_ESCROW">Deposit Escrow - show Escrow Badge</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!form.unitId || !form.title || !form.rentAmount || !form.availableFrom || saving}
              className="flex-1"
            >
              {saving ? "Creating…" : "Create Listing"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
