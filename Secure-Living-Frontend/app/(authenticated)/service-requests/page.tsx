"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Wrench,
  Plane,
  Scale,
  Search,
  Star,
  Truck,
  UtensilsCrossed,
  Users,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

// ─── Types ────────────────────────────────────────────────────────────────────

type SRStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "QUOTING"
  | "AWAITING_FUNDING"
  | "FUNDED"
  | "ASSIGNED"
  | "SCHEDULING_PENDING"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

type SRPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

type ServiceType =
  | "MAINTENANCE"
  | "INSPECTION"
  | "LEGAL"
  | "PROXY"
  | "VALUATION"
  | "CLEANING"
  | "FOOD_DELIVERY"
  | "AIRPORT_TRANSFER"
  | "GUEST_ASSISTANCE"
  | "CUSTOM";

type ServiceMode = "MANAGED" | "MARKETPLACE" | "INTERNAL";
type SRCategory = "OPERATIONAL" | "GUEST_SERVICE" | "EMERGENCY";
type RequestSource =
  | "MOBILE_APP"
  | "WEB_PORTAL"
  | "RECEPTION"
  | "PHONE"
  | "EMAIL"
  | "WALK_IN";

interface ServiceRequest {
  id: string;
  title: string;
  serviceType: ServiceType;
  srPriority: SRPriority;
  srStatus: SRStatus;
  propertyId?: string;
  unitId?: string;
  assignedTo?: string;
  createdAt: string;
  dueAt?: string;
  metadata?: Record<string, unknown>;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
}

interface CreateSRPayload {
  title: string;
  description: string;
  serviceType: ServiceType;
  serviceMode: ServiceMode;
  srCategory: SRCategory;
  srPriority: SRPriority;
  propertyId?: string;
  unitId?: string;
  requestSource: RequestSource;
  dueAt?: string;
  metadata?: Record<string, unknown>;
}

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function statusBadge(status: SRStatus) {
  const map: Record<SRStatus, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
    SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-700 border-blue-200" },
    APPROVED: { label: "Approved", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200" },
    QUOTING: { label: "Quoting", className: "bg-purple-100 text-purple-700 border-purple-200" },
    AWAITING_FUNDING: { label: "Awaiting Funding", className: "bg-orange-100 text-orange-700 border-orange-200" },
    FUNDED: { label: "Funded", className: "bg-teal-100 text-teal-700 border-teal-200" },
    ASSIGNED: { label: "Assigned", className: "bg-blue-100 text-blue-700 border-blue-200" },
    SCHEDULING_PENDING: { label: "Scheduling", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-700 border-blue-200" },
    BLOCKED: { label: "Blocked", className: "bg-red-100 text-red-700 border-red-200" },
    COMPLETED: { label: "Completed", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    CANCELLED: { label: "Cancelled", className: "bg-slate-100 text-slate-500 border-slate-200" },
    DISPUTED: { label: "Disputed", className: "bg-red-100 text-red-700 border-red-200" },
  };
  const s = map[status] ?? { label: status, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
      {status === "IN_PROGRESS" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
      )}
      {s.label}
    </span>
  );
}

function priorityBadge(priority: SRPriority) {
  const map: Record<SRPriority, { label: string; className: string }> = {
    LOW: { label: "Low", className: "bg-slate-100 text-slate-600 border-slate-200" },
    NORMAL: { label: "Normal", className: "bg-blue-100 text-blue-700 border-blue-200" },
    HIGH: { label: "High", className: "bg-orange-100 text-orange-700 border-orange-200" },
    URGENT: { label: "Urgent", className: "bg-red-100 text-red-700 border-red-200" },
  };
  const s = map[priority] ?? { label: priority, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}

function typeBadge(type: ServiceType) {
  const map: Record<ServiceType, { label: string; className: string }> = {
    MAINTENANCE: { label: "Maintenance", className: "bg-blue-100 text-blue-700 border-blue-200" },
    INSPECTION: { label: "Inspection", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    LEGAL: { label: "Legal", className: "bg-purple-100 text-purple-700 border-purple-200" },
    PROXY: { label: "Proxy", className: "bg-teal-100 text-teal-700 border-teal-200" },
    VALUATION: { label: "Valuation", className: "bg-green-100 text-green-700 border-green-200" },
    CLEANING: { label: "Cleaning", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
    FOOD_DELIVERY: { label: "Food Delivery", className: "bg-orange-100 text-orange-700 border-orange-200" },
    AIRPORT_TRANSFER: { label: "Airport Transfer", className: "bg-sky-100 text-sky-700 border-sky-200" },
    GUEST_ASSISTANCE: { label: "Guest Assistance", className: "bg-pink-100 text-pink-700 border-pink-200" },
    CUSTOM: { label: "Custom", className: "bg-slate-100 text-slate-600 border-slate-200" },
  };
  const s = map[type] ?? { label: type, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}

// ─── Type icons ────────────────────────────────────────────────────────────────

const typeIcons: Record<ServiceType, React.ComponentType<{ className?: string }>> = {
  MAINTENANCE: Wrench,
  INSPECTION: Search,
  LEGAL: Scale,
  PROXY: Users,
  VALUATION: Star,
  CLEANING: Sparkles,
  FOOD_DELIVERY: UtensilsCrossed,
  AIRPORT_TRANSFER: Plane,
  GUEST_ASSISTANCE: Truck,
  CUSTOM: Zap,
};

const typeDescriptions: Record<ServiceType, string> = {
  MAINTENANCE: "Repairs & upkeep",
  INSPECTION: "Property inspections",
  LEGAL: "Legal matters",
  PROXY: "Representation",
  VALUATION: "Property valuation",
  CLEANING: "Cleaning services",
  FOOD_DELIVERY: "Food & beverages",
  AIRPORT_TRANSFER: "Transport services",
  GUEST_ASSISTANCE: "Guest support",
  CUSTOM: "Custom request",
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabKey =
  | "ALL"
  | "MAINTENANCE"
  | "INSPECTION"
  | "LEGAL"
  | "PROXY"
  | "VALUATION"
  | "CLEANING"
  | "HOSPITALITY"
  | "CUSTOM";

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "MAINTENANCE", label: "Maintenance" },
  { key: "INSPECTION", label: "Inspection" },
  { key: "LEGAL", label: "Legal" },
  { key: "PROXY", label: "Proxy" },
  { key: "VALUATION", label: "Valuation" },
  { key: "CLEANING", label: "Cleaning" },
  { key: "HOSPITALITY", label: "Hospitality" },
  { key: "CUSTOM", label: "Custom" },
];

const HOSPITALITY_TYPES: ServiceType[] = ["FOOD_DELIVERY", "AIRPORT_TRANSFER", "GUEST_ASSISTANCE"];

function tabToTypes(tab: TabKey): ServiceType[] | null {
  if (tab === "ALL") return null;
  if (tab === "HOSPITALITY") return HOSPITALITY_TYPES;
  return [tab as ServiceType];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

const ALL_TYPES: ServiceType[] = [
  "MAINTENANCE",
  "INSPECTION",
  "LEGAL",
  "PROXY",
  "VALUATION",
  "CLEANING",
  "FOOD_DELIVERY",
  "AIRPORT_TRANSFER",
  "GUEST_ASSISTANCE",
  "CUSTOM",
];

// ─── Create Modal ──────────────────────────────────────────────────────────────

function CreateRequestModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<ServiceType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceMode, setServiceMode] = useState<ServiceMode>("MANAGED");
  const [srCategory, setSrCategory] = useState<SRCategory>("OPERATIONAL");
  const [priority, setPriority] = useState<SRPriority>("NORMAL");
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [requestSource, setRequestSource] = useState<RequestSource>("WEB_PORTAL");
  const [dueAt, setDueAt] = useState("");
  // Extra fields
  const [extraMaintCat, setExtraMaintCat] = useState("");
  const [extraInspType, setExtraInspType] = useState("");
  const [extraLegalRef, setExtraLegalRef] = useState("");
  const [extraLegalCounsel, setExtraLegalCounsel] = useState("");
  const [extraProxyPurpose, setExtraProxyPurpose] = useState("");
  const [extraValPurpose, setExtraValPurpose] = useState("");
  const [extraFoodRoom, setExtraFoodRoom] = useState("");
  const [extraFoodTime, setExtraFoodTime] = useState("");
  const [extraFlight, setExtraFlight] = useState("");
  const [extraTransferDetails, setExtraTransferDetails] = useState("");
  const [extraGuestAssist, setExtraGuestAssist] = useState("");

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedType(null);
      setTitle("");
      setDescription("");
      setPropertyId("");
      setUnitId("");
      setDueAt("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !user?.authToken) return;
    void fetch("/api/v1/properties", {
      headers: { Authorization: `Bearer ${user.authToken}` },
    })
      .then((r) => r.json())
      .then((j: { data: Property[] }) => setProperties(j.data ?? []));
  }, [open, user?.authToken]);

  useEffect(() => {
    if (!propertyId || !user?.authToken) {
      setUnits([]);
      setUnitId("");
      return;
    }
    void fetch(`/api/v1/units?propertyId=${propertyId}`, {
      headers: { Authorization: `Bearer ${user.authToken}` },
    })
      .then((r) => r.json())
      .then((j: { data: Unit[] }) => setUnits(j.data ?? []));
  }, [propertyId, user?.authToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.authToken || !selectedType) return;
    setSubmitting(true);
    try {
      const meta: Record<string, unknown> = {};
      if (selectedType === "MAINTENANCE" && extraMaintCat) meta.category = extraMaintCat;
      if (selectedType === "INSPECTION" && extraInspType) meta.inspectionType = extraInspType;
      if (selectedType === "LEGAL") {
        if (extraLegalRef) meta.caseReference = extraLegalRef;
        if (extraLegalCounsel) meta.legalCounsel = extraLegalCounsel;
      }
      if (selectedType === "PROXY" && extraProxyPurpose) meta.purpose = extraProxyPurpose;
      if (selectedType === "VALUATION" && extraValPurpose) meta.valuationPurpose = extraValPurpose;
      if (selectedType === "FOOD_DELIVERY") {
        if (extraFoodRoom) meta.roomDetails = extraFoodRoom;
        if (extraFoodTime) meta.deliveryTime = extraFoodTime;
      }
      if (selectedType === "AIRPORT_TRANSFER") {
        if (extraFlight) meta.flightNumber = extraFlight;
        if (extraTransferDetails) meta.transferDetails = extraTransferDetails;
      }
      if (selectedType === "GUEST_ASSISTANCE" && extraGuestAssist) meta.assistanceType = extraGuestAssist;

      const payload: CreateSRPayload = {
        title,
        description,
        serviceType: selectedType,
        serviceMode,
        srCategory,
        srPriority: priority,
        requestSource,
        ...(propertyId ? { propertyId } : {}),
        ...(unitId ? { unitId } : {}),
        ...(dueAt ? { dueAt: new Date(dueAt).toISOString() } : {}),
        ...(Object.keys(meta).length > 0 ? { metadata: meta } : {}),
      };

      const createRes = await fetch("/api/v1/service-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) {
        const err = (await createRes.json()) as { message?: string };
        toast(err.message ?? "Failed to create request", "error");
        return;
      }

      const created = (await createRes.json()) as { data: { id: string } };
      const srId = created.data.id;

      await fetch(`/api/v1/service-requests/${srId}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.authToken}` },
      });

      toast("Service request created and submitted", "success");
      onCreated();
      onClose();
    } catch {
      toast("An error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={step === 1 ? "New Service Request — Select Type" : `New ${selectedType?.replace(/_/g, " ")} Request`}
      description={step === 1 ? "Choose the type of service you need" : "Fill in the request details"}
      className="max-w-2xl"
    >
      {step === 1 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {ALL_TYPES.map((type) => {
            const Icon = typeIcons[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => { setSelectedType(type); setStep(2); }}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center transition hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <Icon className="h-7 w-7 text-blue-600" />
                <span className="text-xs font-semibold text-slate-700">{type.replace(/_/g, " ")}</span>
                <span className="text-[10px] text-slate-500">{typeDescriptions[type]}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Title <span className="text-red-500">*</span></label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Short descriptive title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description <span className="text-red-500">*</span></label>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Describe the issue or request"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Service Mode</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={serviceMode}
                onChange={(e) => setServiceMode(e.target.value as ServiceMode)}
              >
                <option value="MANAGED">Managed</option>
                <option value="MARKETPLACE">Marketplace</option>
                <option value="INTERNAL">Internal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Category</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={srCategory}
                onChange={(e) => setSrCategory(e.target.value as SRCategory)}
              >
                <option value="OPERATIONAL">Operational</option>
                <option value="GUEST_SERVICE">Guest Service</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Priority</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={priority}
                onChange={(e) => setPriority(e.target.value as SRPriority)}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Request Source</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={requestSource}
                onChange={(e) => setRequestSource(e.target.value as RequestSource)}
              >
                <option value="WEB_PORTAL">Web Portal</option>
                <option value="MOBILE_APP">Mobile App</option>
                <option value="RECEPTION">Reception</option>
                <option value="PHONE">Phone</option>
                <option value="EMAIL">Email</option>
                <option value="WALK_IN">Walk-in</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Property</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
              >
                <option value="">— None —</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Unit</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                disabled={!propertyId}
              >
                <option value="">— None —</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.unitNumber}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Due Date</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
          </div>

          {/* Type-specific extra fields */}
          {selectedType === "MAINTENANCE" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Maintenance Category</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={extraMaintCat}
                onChange={(e) => setExtraMaintCat(e.target.value)}
              >
                <option value="">— Select —</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="HVAC">HVAC</option>
                <option value="PEST_CONTROL">Pest Control</option>
                <option value="PAINTING">Painting</option>
                <option value="CARPENTRY">Carpentry</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          )}
          {selectedType === "INSPECTION" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Inspection Type</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={extraInspType}
                onChange={(e) => setExtraInspType(e.target.value)}
              >
                <option value="">— Select —</option>
                <option value="MOVE_IN">Move-In</option>
                <option value="MOVE_OUT">Move-Out</option>
                <option value="ROUTINE">Routine</option>
                <option value="FIRE_SAFETY">Fire Safety</option>
              </select>
            </div>
          )}
          {selectedType === "LEGAL" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Case Reference</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={extraLegalRef}
                  onChange={(e) => setExtraLegalRef(e.target.value)}
                  placeholder="Case number or reference"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Legal Counsel</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={extraLegalCounsel}
                  onChange={(e) => setExtraLegalCounsel(e.target.value)}
                  placeholder="Counsel name"
                />
              </div>
            </div>
          )}
          {selectedType === "PROXY" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Purpose of Proxy</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={extraProxyPurpose}
                onChange={(e) => setExtraProxyPurpose(e.target.value)}
                placeholder="e.g. Attend AGM on behalf of owner"
              />
            </div>
          )}
          {selectedType === "VALUATION" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Valuation Purpose</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={extraValPurpose}
                onChange={(e) => setExtraValPurpose(e.target.value)}
              >
                <option value="">— Select —</option>
                <option value="INSURANCE">Insurance</option>
                <option value="SALE">Sale</option>
                <option value="REFINANCE">Refinance</option>
                <option value="ANNUAL">Annual Review</option>
              </select>
            </div>
          )}
          {selectedType === "FOOD_DELIVERY" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Room / Unit Details</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={extraFoodRoom}
                  onChange={(e) => setExtraFoodRoom(e.target.value)}
                  placeholder="Room or unit number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Delivery Time</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={extraFoodTime}
                  onChange={(e) => setExtraFoodTime(e.target.value)}
                />
              </div>
            </div>
          )}
          {selectedType === "AIRPORT_TRANSFER" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Flight Number</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={extraFlight}
                  onChange={(e) => setExtraFlight(e.target.value)}
                  placeholder="e.g. KQ101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Pickup / Dropoff Details</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={extraTransferDetails}
                  onChange={(e) => setExtraTransferDetails(e.target.value)}
                  placeholder="Terminal, time, notes"
                />
              </div>
            </div>
          )}
          {selectedType === "GUEST_ASSISTANCE" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Type of Assistance Needed</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={extraGuestAssist}
                onChange={(e) => setExtraGuestAssist(e.target.value)}
                placeholder="e.g. Luggage help, local guide"
              />
            </div>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Create & Submit"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ServiceRequestsPage() {
  const { user } = useAuth();

  const [rows, setRows] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  // KPI counts
  const [kpiOpen, setKpiOpen] = useState(0);
  const [kpiBlocked, setKpiBlocked] = useState(0);
  const [kpiCompleted, setKpiCompleted] = useState(0);
  const [kpiOverdue, setKpiOverdue] = useState(0);

  const load = useCallback(async () => {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const types = tabToTypes(activeTab);
      const params = new URLSearchParams();
      if (types && types.length === 1) params.set("serviceType", types[0]);
      if (filterStatus) params.set("srStatus", filterStatus);
      if (filterPriority) params.set("srPriority", filterPriority);
      if (filterMode) params.set("serviceMode", filterMode);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/v1/service-requests?${params.toString()}`, {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as {
        data: ServiceRequest[];
        meta?: { totalPages?: number };
      };
      let data = json.data ?? [];

      // Client-side filter for HOSPITALITY (multi-type)
      if (activeTab === "HOSPITALITY") {
        data = data.filter((r) => HOSPITALITY_TYPES.includes(r.serviceType));
      }

      // Date range filter
      if (filterFrom) {
        const from = new Date(filterFrom).getTime();
        data = data.filter((r) => new Date(r.createdAt).getTime() >= from);
      }
      if (filterTo) {
        const to = new Date(filterTo).getTime() + 86400000;
        data = data.filter((r) => new Date(r.createdAt).getTime() <= to);
      }

      setRows(data);
      setTotalPages(json.meta?.totalPages ?? 1);

      // Compute KPIs
      const openStatuses: SRStatus[] = ["SUBMITTED", "APPROVED", "ASSIGNED", "IN_PROGRESS"];
      setKpiOpen(data.filter((r) => openStatuses.includes(r.srStatus)).length);
      setKpiBlocked(data.filter((r) => r.srStatus === "BLOCKED").length);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setKpiCompleted(
        data.filter(
          (r) =>
            r.srStatus === "COMPLETED" &&
            new Date(r.createdAt) >= monthStart
        ).length
      );
      setKpiOverdue(
        data.filter(
          (r) =>
            r.dueAt &&
            new Date(r.dueAt) < now &&
            r.srStatus !== "COMPLETED" &&
            r.srStatus !== "CANCELLED"
        ).length
      );
    } finally {
      setLoading(false);
    }
  }, [user?.authToken, activeTab, filterStatus, filterPriority, filterMode, filterFrom, filterTo, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Service Requests</h1>
          <p className="app-page-lead">Manage all service requests across your portfolio</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New Request
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Open", value: kpiOpen, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Blocked", value: kpiBlocked, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Completed (this month)", value: kpiCompleted, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Overdue", value: kpiOverdue, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((k) => (
          <div
            key={k.label}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${k.bg} ${k.color}`}>
              <k.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className="text-2xl font-bold text-slate-900">{loading ? "—" : k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {(["DRAFT","SUBMITTED","APPROVED","REJECTED","QUOTING","AWAITING_FUNDING","FUNDED","ASSIGNED","SCHEDULING_PENDING","IN_PROGRESS","BLOCKED","COMPLETED","CANCELLED","DISPUTED"] as SRStatus[]).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={filterPriority}
          onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
        >
          <option value="">All Priorities</option>
          {(["LOW","NORMAL","HIGH","URGENT"] as SRPriority[]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={filterMode}
          onChange={(e) => { setFilterMode(e.target.value); setPage(1); }}
        >
          <option value="">All Modes</option>
          <option value="MANAGED">Managed</option>
          <option value="MARKETPLACE">Marketplace</option>
          <option value="INTERNAL">Internal</option>
        </select>
        <input
          type="date"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={filterFrom}
          onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
          placeholder="From"
          title="From date"
        />
        <input
          type="date"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={filterTo}
          onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
          placeholder="To"
          title="To date"
        />
        {(filterStatus || filterPriority || filterMode || filterFrom || filterTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterStatus("");
              setFilterPriority("");
              setFilterMode("");
              setFilterFrom("");
              setFilterTo("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Wrench className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">No service requests found</p>
            <p className="text-sm text-slate-500">Adjust your filters or create a new request</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New Request
            </Button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["#", "Title", "Type", "Priority", "Status", "Property/Unit", "Assigned To", "Created", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                    {shortId(r.id)}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-sm font-medium text-slate-800">
                    {r.title}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{typeBadge(r.serviceType)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{priorityBadge(r.srPriority)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{statusBadge(r.srStatus)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {r.propertyId ? <span className="font-mono">{r.propertyId.slice(0, 6)}</span> : "—"}
                    {r.unitId ? <span className="ml-1 text-slate-400">/ {r.unitId.slice(0, 6)}</span> : ""}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {r.assignedTo ? <span className="font-mono">{r.assignedTo.slice(0, 8)}</span> : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {fmtDate(r.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/service-requests/${r.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateRequestModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => void load()}
      />
    </div>
  );
}
