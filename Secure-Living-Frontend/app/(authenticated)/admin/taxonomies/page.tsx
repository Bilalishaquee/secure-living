"use client";

import { useEffect, useState, useCallback } from "react";
import { Tags, Settings2, RefreshCw, Plus, CheckCircle2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";

type CustomField = {
  id: string;
  fieldLabel: string;
  fieldType: string;
  fieldOptions: string[];
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
};

type ServiceTypeConfig = {
  id: string;
  serviceType: string;
  quoteRequired: boolean;
  supervisorApprovalRequired: boolean;
  evidenceRequirements: string[];
  assignmentRestrictions: string;
  escrowRules: string | null;
  slaPolicyId: string | null;
  updatedAt: string;
};

const FIELD_TYPE_COLORS: Record<string, string> = {
  text:     "bg-blue-50 text-blue-700",
  dropdown: "bg-purple-50 text-purple-700",
  checkbox: "bg-amber-50 text-amber-700",
  upload:   "bg-slate-100 text-slate-600",
  date:     "bg-teal-50 text-teal-700",
  number:   "bg-indigo-50 text-indigo-700",
};

type Tab = "custom-fields" | "service-types";

export default function TaxonomiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("custom-fields");
  const [fields, setFields] = useState<CustomField[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // New custom field form
  const [showAddField, setShowAddField] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [presets, setPresets] = useState<{ key: string; name: string; description: string; fieldCount: number }[]>([]);
  const [applyingPreset, setApplyingPreset] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<string>("text");
  const [newOptions, setNewOptions] = useState("");
  const [newRequired, setNewRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  // New service type form
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceType, setNewServiceType] = useState("");
  const [newQuoteRequired, setNewQuoteRequired] = useState(false);
  const [newSupervisor, setNewSupervisor] = useState(false);
  const [newAssignment, setNewAssignment] = useState("open");
  const [newEscrow, setNewEscrow] = useState("");
  const [savingService, setSavingService] = useState(false);

  const loadFields = useCallback(async () => {
    if (!user?.authToken) return;
    const res = await fetch("/api/v1/applications/custom-fields", {
      headers: { Authorization: `Bearer ${user.authToken}` },
    });
    if (res.ok) {
      const json = await res.json() as { data: CustomField[] };
      setFields(json.data ?? []);
    }
  }, [user?.authToken]);

  const loadPresets = useCallback(async () => {
    if (!user?.authToken) return;
    const res = await fetch("/api/v1/applications/custom-fields/presets", {
      headers: { Authorization: `Bearer ${user.authToken}` },
    });
    if (res.ok) {
      const json = await res.json() as { data: { key: string; name: string; description: string; fieldCount: number }[] };
      setPresets(json.data ?? []);
    }
  }, [user?.authToken]);

  async function applyPreset(key: string) {
    if (!user?.authToken) return;
    setApplyingPreset(true);
    try {
      const res = await fetch("/api/v1/applications/custom-fields/presets", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ preset: key, organizationId: user?.organizationId }),
      });
      if (res.ok) {
        toast("Preset fields added — you can still edit or remove any of them", "success");
        setShowPresets(false);
        void loadFields();
      } else {
        const j = await res.json().catch(() => ({}));
        toast((j as { error?: string }).error ?? "Failed to apply preset", "error");
      }
    } finally {
      setApplyingPreset(false);
    }
  }

  const loadServiceTypes = useCallback(async () => {
    const res = await fetch("/api/v1/service-type-configs", {
      headers: { Authorization: `Bearer ${user?.authToken ?? ""}` },
    });
    if (res.ok) {
      const json = await res.json() as { data: ServiceTypeConfig[] };
      setServiceTypes(json.data ?? []);
    }
  }, [user?.authToken]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadFields(), loadServiceTypes()]);
    } finally {
      setLoading(false);
    }
  }, [loadFields, loadServiceTypes]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void loadPresets(); }, [loadPresets]);

  async function addCustomField() {
    if (!user?.authToken || !newLabel.trim()) {
      toast("Field label is required", "error");
      return;
    }
    setSaving(true);
    try {
      const opts = newOptions.split(",").map((s) => s.trim()).filter(Boolean);
      const orgId = user?.organizationId ?? "";
      const res = await fetch("/api/v1/applications/custom-fields", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId: orgId,
          fieldLabel: newLabel.trim(),
          fieldType: newType,
          fieldOptions: opts,
          isRequired: newRequired,
          displayOrder: fields.length + 1,
        }),
      });
      if (res.ok) {
        toast("Custom field created", "success");
        setShowAddField(false);
        setNewLabel(""); setNewType("text"); setNewOptions(""); setNewRequired(false);
        void loadFields();
      } else {
        const j = await res.json() as { error?: string };
        toast(j.error ?? "Failed to create field", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function addServiceType() {
    if (!user?.authToken || !newServiceType.trim()) {
      toast("Service type name is required", "error");
      return;
    }
    setSavingService(true);
    try {
      const res = await fetch("/api/v1/service-type-configs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceType: newServiceType.trim(),
          quoteRequired: newQuoteRequired,
          supervisorApprovalRequired: newSupervisor,
          assignmentRestrictions: newAssignment,
          escrowRules: newEscrow.trim() || undefined,
          evidenceRequirements: [],
        }),
      });
      if (res.ok) {
        toast("Service type saved", "success");
        setShowAddService(false);
        setNewServiceType(""); setNewQuoteRequired(false); setNewSupervisor(false);
        setNewAssignment("open"); setNewEscrow("");
        void loadServiceTypes();
      } else {
        const j = await res.json() as { error?: string };
        toast(j.error ?? "Failed to save", "error");
      }
    } finally {
      setSavingService(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Toolbar */}
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Taxonomies</h1>
          <p className="app-page-lead">Manage application custom fields and service type configurations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {tab === "custom-fields" && (
            <>
              <Button size="sm" variant="outline" onClick={() => setShowPresets((s) => !s)}>
                <Sparkles className="mr-1.5 h-4 w-4" /> Use Preset
              </Button>
              <Button size="sm" onClick={() => setShowAddField(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Field
              </Button>
            </>
          )}
          {tab === "service-types" && (
            <Button size="sm" onClick={() => setShowAddService(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Service Type
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <p className="font-semibold">What is a &quot;taxonomy&quot; here?</p>
        <p className="mt-1 text-sky-800">
          A taxonomy is a category, type, or custom field you define once — it then shows up as an option
          everywhere that kind of thing is used across the platform. Secure Living has six of them. Two are
          managed directly on this page (the tabs below); the other four live on their own pages, linked here
          for reference.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sky-800">
          <li>
            <strong>Application Templates</strong> <span className="text-sky-600">(this page — &quot;Application Custom Fields&quot; tab)</span> —
            the questions and required documents a tenant must fill in/upload when applying to rent a unit
            (e.g. &quot;Employer name&quot;, a payslip upload). Add, reorder, or require them here; changes
            apply to every new application immediately. Presets (Standard Residential, Furnished Short-Term,
            Commercial) can seed a starting set.
          </li>
          <li>
            <strong>Service Modes</strong> <span className="text-sky-600">(this page — &quot;Service Type Configs&quot; tab)</span> —
            the rules for each marketplace service category (e.g. Plumbing, Electrical): whether a quote is
            required, whether a supervisor must approve it, and what evidence a provider must upload to mark a
            job complete. Only Super Admin can create/edit these.
          </li>
          <li>
            <strong>Property Categories</strong> <a href="/properties/new" className="underline">(set on Add/Edit Property)</a> —
            classifies a property as Residential, Commercial, Short-Stay, etc. Controls which checklist and
            application templates make sense for it and how it's grouped on the Properties page.
          </li>
          <li>
            <strong>Service Categories</strong> <a href="/admin/service-categories" className="underline">(Service Categories page)</a> —
            the marketplace service types themselves (Plumbing, Cleaning, Security, Painting...). Used when a
            provider registers what they offer, and when a tenant/landlord raises a Service Enquiry. Each one
            can have a Service Mode (above) attached.
          </li>
          <li>
            <strong>Checklist Templates</strong> <a href="/checklists" className="underline">(Inspection Checklist Templates page)</a> —
            reusable move-in/move-out inspection forms (Area, Item, Qty, plus any custom columns a landlord
            adds). Assigned to a lease when a tenant moves in or out.
          </li>
          <li>
            <strong>Listing Types</strong> <span className="text-sky-600">(set via the property/unit&apos;s category and unit type)</span> —
            a listing doesn&apos;t have its own separate &quot;type&quot; field; it inherits its category
            (residential/commercial/short-stay) and unit type from the property and unit it&apos;s published
            from. This determines which filters and attributes apply to it on the public listing.
          </li>
        </ul>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {([
          { key: "custom-fields",  label: "Application Custom Fields", icon: Tags },
          { key: "service-types",  label: "Service Type Configs",       icon: Settings2 },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? "border-brand-navy text-brand-navy"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : tab === "custom-fields" ? (
        <div className="space-y-4">
          {/* Preset picker — instantly seed a starter set of application fields for a
              common rental type; fields remain fully editable afterwards. */}
          {showPresets && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 space-y-3">
              <p className="text-sm font-semibold text-purple-900">Start From a Preset</p>
              <p className="text-xs text-purple-700">
                Instantly add a built-in set of application fields for a common rental type — you can still edit or remove any of them afterwards.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {presets.map((p) => (
                  <div key={p.key} className="rounded-xl border border-purple-200 bg-white p-4 space-y-2">
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.description}</p>
                    <p className="text-xs text-slate-400">{p.fieldCount} fields</p>
                    <Button size="sm" className="w-full" disabled={applyingPreset} onClick={() => void applyPreset(p.key)}>
                      {applyingPreset ? "Applying…" : "Use This Preset"}
                    </Button>
                  </div>
                ))}
                {presets.length === 0 && <p className="text-sm text-slate-400">No presets available.</p>}
              </div>
            </div>
          )}

          {/* Add field form */}
          {showAddField && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 space-y-4">
              <p className="text-sm font-semibold text-blue-900">New Application Custom Field</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Field Label *</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    placeholder="e.g. Employment Status"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Field Type</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    {["text", "dropdown", "checkbox", "upload", "date", "number"].map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                {newType === "dropdown" && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium text-slate-600">Options (comma-separated)</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="Option A, Option B, Option C"
                      value={newOptions}
                      onChange={(e) => setNewOptions(e.target.value)}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    id="req-toggle"
                    type="checkbox"
                    checked={newRequired}
                    onChange={(e) => setNewRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                  />
                  <label htmlFor="req-toggle" className="text-sm text-slate-700">Required field</label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void addCustomField()} disabled={saving}>
                  {saving ? "Saving…" : "Create Field"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddField(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {fields.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center">
              <Tags className="h-12 w-12 text-slate-200" />
              <p className="text-lg font-medium text-slate-700">No custom fields</p>
              <p className="text-sm text-slate-400">Add custom fields to collect extra info on applications.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">Field Label</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Options</th>
                    <th className="px-4 py-3 text-center">Required</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {fields.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{f.fieldLabel}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${FIELD_TYPE_COLORS[f.fieldType] ?? "bg-slate-100 text-slate-600"}`}>
                          {f.fieldType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {f.fieldOptions.length > 0
                          ? f.fieldOptions.join(", ")
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {f.isRequired
                          ? <span className="text-xs font-semibold text-red-600">Yes</span>
                          : <span className="text-xs text-slate-400">No</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {f.isActive
                          ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Active</span>
                          : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">Inactive</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">{f.displayOrder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Add service type form */}
          {showAddService && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 space-y-4">
              <p className="text-sm font-semibold text-blue-900">New Service Type Configuration</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">Service Type Key *</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    placeholder="e.g. plumbing_repair"
                    value={newServiceType}
                    onChange={(e) => setNewServiceType(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Assignment Restrictions</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    value={newAssignment}
                    onChange={(e) => setNewAssignment(e.target.value)}
                  >
                    <option value="open">Open (any provider)</option>
                    <option value="verified_only">Verified providers only</option>
                    <option value="in_house">In-house staff only</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Escrow Rules (optional)</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    placeholder="e.g. hold 20% until sign-off"
                    value={newEscrow}
                    onChange={(e) => setNewEscrow(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={newQuoteRequired} onChange={(e) => setNewQuoteRequired(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                    Quote required
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={newSupervisor} onChange={(e) => setNewSupervisor(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                    Supervisor approval
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void addServiceType()} disabled={savingService}>
                  {savingService ? "Saving…" : "Save Config"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddService(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {serviceTypes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center">
              <Settings2 className="h-12 w-12 text-slate-200" />
              <p className="text-lg font-medium text-slate-700">No service type configs</p>
              <p className="text-sm text-slate-400">Configure rules for each service type to control quoting, assignments, and escrow.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {serviceTypes.map((st) => (
                <div key={st.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{st.serviceType}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Updated {new Date(st.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {st.quoteRequired && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Quote required</span>
                      )}
                      {st.supervisorApprovalRequired && (
                        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">Supervisor approval</span>
                      )}
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {st.assignmentRestrictions === "open" ? "Open assignment"
                          : st.assignmentRestrictions === "verified_only" ? "Verified only"
                          : st.assignmentRestrictions}
                      </span>
                    </div>
                  </div>

                  {(st.evidenceRequirements.length > 0 || st.escrowRules) && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
                      {st.evidenceRequirements.length > 0 && (
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                          <p className="font-semibold uppercase tracking-wide text-slate-400 mb-1">Evidence Required</p>
                          <p className="text-slate-700">{st.evidenceRequirements.join(", ")}</p>
                        </div>
                      )}
                      {st.escrowRules && (
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                          <p className="font-semibold uppercase tracking-wide text-slate-400 mb-1">Escrow Rules</p>
                          <p className="text-slate-700">{st.escrowRules}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
