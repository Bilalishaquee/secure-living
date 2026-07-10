"use client";

import { useEffect, useState } from "react";
import { Plus, ToggleLeft, ToggleRight, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

type CategoryType = "MAINTENANCE" | "PROFESSIONAL";
type DeliveryMode = "INTERNAL" | "MANAGED" | "MARKETPLACE";
type Role = "TENANT" | "LANDLORD" | "PROPERTY_MANAGER" | "AGENCY" | "DEVELOPER" | "STAFF";

const ROLE_OPTIONS: { id: Role; label: string }[] = [
  { id: "TENANT", label: "Tenant" },
  { id: "LANDLORD", label: "Landlord" },
  { id: "PROPERTY_MANAGER", label: "Property Manager" },
  { id: "AGENCY", label: "Agency" },
  { id: "DEVELOPER", label: "Developer" },
  { id: "STAFF", label: "Staff" },
];

type CategoryConfig = {
  // Delivery Strategy
  deliveryMode: DeliveryMode;
  managedPartnerName: string;
  revenueSharePercent: string;
  // Visibility Rules
  visibleTo: Role[];
  // Availability Rules
  availabilityStart: string;
  availabilityEnd: string;
  allowProviderOverride: boolean;
  // Priority / Routing Rules
  tieBreaker: "RATING" | "PROXIMITY" | "AVAILABILITY";
  // Approval Rules
  requiresApproval: boolean;
  approver: "LANDLORD" | "TENANT" | "PROPERTY_MANAGER";
  // Quotation Rules
  requiresQuotation: boolean;
  // Payment Rules
  paymentRule: "ESCROW" | "INVOICE_AFTER_COMPLETION" | "SUBSCRIPTION";
  // Assignment Strategy
  assignmentStrategy: "AUTOMATIC" | "MANUAL" | "NEAREST_PROVIDER" | "LEAST_BUSY" | "CUSTOMER_CHOICE";
  // SLA / Requirements
  requiresLicense: boolean;
  requiresCredentials: boolean;
  requiresDocuments: boolean;
  // Automation Rules
  requestRatingAfterCompletion: boolean;
  notifyPropertyManager: boolean;
  notifyAccounts: boolean;
  updateReputationScore: boolean;
  autoIssueInvoice: boolean;
};

const defaultConfig: CategoryConfig = {
  deliveryMode: "INTERNAL",
  managedPartnerName: "",
  revenueSharePercent: "",
  visibleTo: ["TENANT", "LANDLORD", "PROPERTY_MANAGER", "AGENCY", "DEVELOPER", "STAFF"],
  availabilityStart: "08:00",
  availabilityEnd: "18:00",
  allowProviderOverride: true,
  tieBreaker: "RATING",
  requiresApproval: false,
  approver: "LANDLORD",
  requiresQuotation: false,
  paymentRule: "INVOICE_AFTER_COMPLETION",
  assignmentStrategy: "AUTOMATIC",
  requiresLicense: false,
  requiresCredentials: false,
  requiresDocuments: false,
  requestRatingAfterCompletion: true,
  notifyPropertyManager: true,
  notifyAccounts: false,
  updateReputationScore: true,
  autoIssueInvoice: false,
};

type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  order: number;
  categoryType: CategoryType;
  config: Partial<CategoryConfig> | null;
};

type FormState = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  icon: string;
  sortOrder: string;
  categoryType: CategoryType;
  isActive: boolean;
  config: CategoryConfig;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  icon: "",
  sortOrder: "0",
  categoryType: "MAINTENANCE",
  isActive: true,
  config: defaultConfig,
};

const labelCls = "mb-1 block text-sm font-medium text-slate-700";
const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

export default function ServiceCategoriesAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [typeFilter, setTypeFilter] = useState<"ALL" | CategoryType>("ALL");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/service-categories?all=1`, {
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
    setActiveTab("basic");
    setModalOpen(true);
  }

  function openEdit(cat: ServiceCategory) {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      tagline: cat.tagline ?? "",
      description: cat.description ?? "",
      icon: cat.icon ?? "",
      sortOrder: String(cat.order ?? 0),
      categoryType: cat.categoryType ?? "MAINTENANCE",
      isActive: cat.isActive,
      config: { ...defaultConfig, ...(cat.config ?? {}) },
    });
    setActiveTab("basic");
    setModalOpen(true);
  }

  function updateConfig<K extends keyof CategoryConfig>(key: K, value: CategoryConfig[K]) {
    setForm((f) => ({ ...f, config: { ...f.config, [key]: value } }));
  }

  function toggleVisibleRole(role: Role) {
    setForm((f) => {
      const has = f.config.visibleTo.includes(role);
      return {
        ...f,
        config: {
          ...f.config,
          visibleTo: has ? f.config.visibleTo.filter((r) => r !== role) : [...f.config.visibleTo, role],
        },
      };
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        tagline: form.tagline || null,
        description: form.description || null,
        icon: form.icon || null,
        sortOrder: parseInt(form.sortOrder) || 0,
        categoryType: form.categoryType,
        isActive: form.isActive,
        config: form.config,
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
        toast(editing ? "Updated" : "Created", "success");
        setModalOpen(false);
        load();
      } else {
        const j = await res.json();
        toast((j as { error?: string }).error ?? "Failed", "error");
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
      toast(cat.isActive ? "Deactivated" : "Activated", "success");
      load();
    } else {
      const j = await res.json();
      toast((j as { error?: string }).error ?? "Failed", "error");
    }
  }

  const visibleCategories = categories.filter((c) => typeFilter === "ALL" || c.categoryType === typeFilter);

  const tabs: TabItem[] = [
    {
      id: "basic",
      label: "Basic Info",
      content: (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Name *</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Slug *</label>
            <input
              className={`${inputCls} font-mono`}
              placeholder="e.g. due-diligence"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category Type *</label>
              <Select value={form.categoryType} onValueChange={(v) => setForm((f) => ({ ...f, categoryType: v as CategoryType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelCls}>Icon</label>
              <input
                className={inputCls}
                placeholder="e.g. 🔧 or icon name"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Tagline</label>
            <input
              className={inputCls}
              placeholder="Short description shown on cards"
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              className={inputCls}
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Sort Order</label>
              <input
                type="number"
                className={inputCls}
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Switch
                label="Active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "delivery",
      label: "Delivery Strategy",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Choose how this service is fulfilled. Internal = staff-only. Managed = a partner firm under
            revenue-share. Marketplace = open provider marketplace.
          </p>
          <div>
            <label className={labelCls}>Mode *</label>
            <Select value={form.config.deliveryMode} onValueChange={(v) => updateConfig("deliveryMode", v as DeliveryMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERNAL">Internal</SelectItem>
                <SelectItem value="MANAGED">Managed</SelectItem>
                <SelectItem value="MARKETPLACE">Marketplace</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.config.deliveryMode === "MANAGED" && (
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div>
                <label className={labelCls}>Managed Partner</label>
                <input
                  className={inputCls}
                  placeholder="Partner firm name"
                  value={form.config.managedPartnerName}
                  onChange={(e) => updateConfig("managedPartnerName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Revenue Share %</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="e.g. 20"
                  value={form.config.revenueSharePercent}
                  onChange={(e) => updateConfig("revenueSharePercent", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "visibility",
      label: "Visibility Rules",
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Which roles should see this service?</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((role) => (
              <label
                key={role.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.config.visibleTo.includes(role.id)}
                  onChange={() => toggleVisibleRole(role.id)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                {role.label}
              </label>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "availability",
      label: "Availability Rules",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Default availability window for this service. Providers may override within this rule.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Available From</label>
              <input
                type="time"
                className={inputCls}
                value={form.config.availabilityStart}
                onChange={(e) => updateConfig("availabilityStart", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Available Until</label>
              <input
                type="time"
                className={inputCls}
                value={form.config.availabilityEnd}
                onChange={(e) => updateConfig("availabilityEnd", e.target.value)}
              />
            </div>
          </div>
          <Switch
            label="Allow provider override"
            description="Let individual providers set their own availability within this default rule"
            checked={form.config.allowProviderOverride}
            onCheckedChange={(v) => updateConfig("allowProviderOverride", v)}
          />
        </div>
      ),
    },
    {
      id: "priority",
      label: "Priority / Routing",
      content: (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Default Order</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-600">
              Internal → Managed → Marketplace
            </div>
          </div>
          <div>
            <label className={labelCls}>Tie-breaker</label>
            <Select value={form.config.tieBreaker} onValueChange={(v) => updateConfig("tieBreaker", v as CategoryConfig["tieBreaker"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RATING">Rating</SelectItem>
                <SelectItem value="PROXIMITY">Proximity</SelectItem>
                <SelectItem value="AVAILABILITY">Availability</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      id: "approval",
      label: "Approval Rules",
      content: (
        <div className="space-y-4">
          <Switch
            label="Requires approval"
            checked={form.config.requiresApproval}
            onCheckedChange={(v) => updateConfig("requiresApproval", v)}
          />
          {form.config.requiresApproval && (
            <div>
              <label className={labelCls}>Approver</label>
              <Select value={form.config.approver} onValueChange={(v) => updateConfig("approver", v as CategoryConfig["approver"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LANDLORD">Landlord</SelectItem>
                  <SelectItem value="TENANT">Tenant</SelectItem>
                  <SelectItem value="PROPERTY_MANAGER">Property Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "quotation",
      label: "Quotation Rules",
      content: (
        <Switch
          label="Requires quotation before work begins"
          checked={form.config.requiresQuotation}
          onCheckedChange={(v) => updateConfig("requiresQuotation", v)}
        />
      ),
    },
    {
      id: "payment",
      label: "Payment Rules",
      content: (
        <div>
          <label className={labelCls}>Payment Rule</label>
          <Select value={form.config.paymentRule} onValueChange={(v) => updateConfig("paymentRule", v as CategoryConfig["paymentRule"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ESCROW">Escrow</SelectItem>
              <SelectItem value="INVOICE_AFTER_COMPLETION">Invoice After Completion</SelectItem>
              <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      id: "assignment",
      label: "Assignment Strategy",
      content: (
        <div>
          <label className={labelCls}>Strategy</label>
          <Select
            value={form.config.assignmentStrategy}
            onValueChange={(v) => updateConfig("assignmentStrategy", v as CategoryConfig["assignmentStrategy"])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AUTOMATIC">Automatic</SelectItem>
              <SelectItem value="MANUAL">Manual</SelectItem>
              <SelectItem value="NEAREST_PROVIDER">Nearest Provider</SelectItem>
              <SelectItem value="LEAST_BUSY">Least Busy</SelectItem>
              <SelectItem value="CUSTOMER_CHOICE">Customer Choice</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      id: "sla",
      label: "SLA / Requirements",
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Provider requirements — set sensible defaults, override per service as needed.</p>
          <Switch label="Requires license" checked={form.config.requiresLicense} onCheckedChange={(v) => updateConfig("requiresLicense", v)} />
          <Switch label="Requires credentials" checked={form.config.requiresCredentials} onCheckedChange={(v) => updateConfig("requiresCredentials", v)} />
          <Switch label="Requires documents" checked={form.config.requiresDocuments} onCheckedChange={(v) => updateConfig("requiresDocuments", v)} />
        </div>
      ),
    },
    {
      id: "automation",
      label: "Automation Rules",
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Post-completion automation triggers.</p>
          <Switch label="Request rating after completion" checked={form.config.requestRatingAfterCompletion} onCheckedChange={(v) => updateConfig("requestRatingAfterCompletion", v)} />
          <Switch label="Notify property manager" checked={form.config.notifyPropertyManager} onCheckedChange={(v) => updateConfig("notifyPropertyManager", v)} />
          <Switch label="Notify accounts" checked={form.config.notifyAccounts} onCheckedChange={(v) => updateConfig("notifyAccounts", v)} />
          <Switch label="Update reputation score" checked={form.config.updateReputationScore} onCheckedChange={(v) => updateConfig("updateReputationScore", v)} />
          <Switch label="Auto-issue invoice" checked={form.config.autoIssueInvoice} onCheckedChange={(v) => updateConfig("autoIssueInvoice", v)} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Categories</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure Maintenance vs Professional services, delivery strategy, visibility, and rules —
            shown on the homepage, /services page, and Maintenance Services module.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {(["ALL", "MAINTENANCE", "PROFESSIONAL"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              typeFilter === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t === "ALL" ? "All" : t === "MAINTENANCE" ? "Maintenance" : "Professional"}
          </button>
        ))}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tagline</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{cat.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={cat.categoryType === "PROFESSIONAL" ? "info" : "success"}>
                        {cat.categoryType === "PROFESSIONAL" ? "Professional" : "Maintenance"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{cat.slug}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-600">{cat.tagline ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{cat.order}</td>
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
                {visibleCategories.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">No categories yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Edit Category" : "Add Category"}
        className="max-w-[52rem]"
      >
        <div className="space-y-6">
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
          <div className="flex gap-3 border-t border-slate-100 pt-4">
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
