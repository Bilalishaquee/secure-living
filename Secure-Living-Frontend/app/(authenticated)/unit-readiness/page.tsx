"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReadinessStatus = "READY" | "PENDING_CLEAN" | "PENDING_INSPECTION" | "BLOCKED";

interface Property {
  id: string;
  name: string;
  type?: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
  readinessStatus?: ReadinessStatus;
  updatedAt?: string;
}

interface LinkedSR {
  id: string;
  title: string;
  srStatus: string;
  serviceType: string;
}

// ─── Card config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ReadinessStatus,
  {
    label: string;
    cardClass: string;
    labelClass: string;
    Icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
  }
> = {
  READY: {
    label: "Ready",
    cardClass: "border-emerald-200 bg-emerald-50",
    labelClass: "text-emerald-700",
    Icon: CheckCircle2,
    iconClass: "text-emerald-500",
  },
  PENDING_CLEAN: {
    label: "Pending Clean",
    cardClass: "border-yellow-200 bg-yellow-50",
    labelClass: "text-yellow-700",
    Icon: Sparkles,
    iconClass: "text-yellow-500",
  },
  PENDING_INSPECTION: {
    label: "Pending Inspection",
    cardClass: "border-orange-200 bg-orange-50",
    labelClass: "text-orange-700",
    Icon: Search,
    iconClass: "text-orange-500",
  },
  BLOCKED: {
    label: "Blocked",
    cardClass: "border-red-200 bg-red-50",
    labelClass: "text-red-700",
    Icon: AlertTriangle,
    iconClass: "text-red-500",
  },
};

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Unit Card ─────────────────────────────────────────────────────────────────

function UnitCard({
  unit,
  propertyName,
  linkedSRs,
  onMarkReady,
  actionLoading,
}: {
  unit: Unit;
  propertyName: string;
  linkedSRs: LinkedSR[];
  onMarkReady: (unitId: string) => void;
  actionLoading: string | null;
}) {
  const status = (unit.readinessStatus ?? "READY") as ReadinessStatus;
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.Icon;
  const isLoading = actionLoading === unit.id;
  const canMarkReady = status === "PENDING_CLEAN" || status === "PENDING_INSPECTION";

  return (
    <div className={`rounded-xl border-2 p-4 transition ${cfg.cardClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 shrink-0 ${cfg.iconClass}`} />
          <div>
            <p className="font-semibold text-slate-800">Unit {unit.unitNumber}</p>
            <p className="text-xs text-slate-500">{propertyName}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold ${cfg.labelClass}`}>{cfg.label}</span>
      </div>

      {unit.updatedAt && (
        <p className="mt-2 text-xs text-slate-400">Updated {fmtDate(unit.updatedAt)}</p>
      )}

      {linkedSRs.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Linked Requests
          </p>
          {linkedSRs.map((sr) => (
            <Link
              key={sr.id}
              href={`/service-requests/${sr.id}`}
              className="flex items-center gap-1.5 rounded-lg border border-white/60 bg-white/70 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
            >
              <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="truncate">{sr.title}</span>
              <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                {sr.srStatus.replace(/_/g, " ")}
              </span>
            </Link>
          ))}
        </div>
      )}

      {canMarkReady && (
        <div className="mt-3">
          <Button
            size="sm"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={isLoading}
            onClick={() => onMarkReady(unit.id)}
          >
            {isLoading ? "Updating…" : "Mark Ready"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function UnitReadinessPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropId, setSelectedPropId] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [linkedSRs, setLinkedSRs] = useState<Record<string, LinkedSR[]>>({});
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch short-stay properties
  useEffect(() => {
    if (!user?.authToken) return;
    setLoadingProps(true);
    void fetch("/api/v1/short-stay", {
      headers: { Authorization: `Bearer ${user.authToken}` },
    })
      .then((r) => r.json())
      .then((j: { data: Property[] }) => {
        const props = j.data ?? [];
        setProperties(props);
        if (props.length > 0) setSelectedPropId(props[0].id);
      })
      .catch(() => {
        // Fallback: load all properties
        void fetch("/api/v1/properties", {
          headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
        })
          .then((r) => r.json())
          .then((j: { data: Property[] }) => {
            const props = j.data ?? [];
            setProperties(props);
            if (props.length > 0) setSelectedPropId(props[0].id);
          });
      })
      .finally(() => setLoadingProps(false));
  }, [user?.authToken]);

  // Fetch units for selected property
  const loadUnits = useCallback(async () => {
    if (!user?.authToken || !selectedPropId) return;
    setLoadingUnits(true);
    try {
      const res = await fetch(`/api/v1/units?propertyId=${selectedPropId}`, {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as { data: Unit[] };
      const fetchedUnits = json.data ?? [];
      setUnits(fetchedUnits);

      // For BLOCKED / PENDING units, fetch linked SRs
      const pendingUnits = fetchedUnits.filter(
        (u) => u.readinessStatus && u.readinessStatus !== "READY"
      );

      const srMap: Record<string, LinkedSR[]> = {};
      await Promise.all(
        pendingUnits.map(async (u) => {
          try {
            // Fetch cleaning SRs for PENDING_CLEAN, inspection for PENDING_INSPECTION, any IN_PROGRESS for BLOCKED
            const srRes = await fetch(
              `/api/v1/service-requests?unitId=${u.id}&srStatus=IN_PROGRESS`,
              { headers: { Authorization: `Bearer ${user.authToken ?? ""}` } }
            );
            if (srRes.ok) {
              const srJson = (await srRes.json()) as {
                data: LinkedSR[];
              };
              srMap[u.id] = srJson.data ?? [];
            }
          } catch {
            srMap[u.id] = [];
          }
        })
      );
      setLinkedSRs(srMap);
    } finally {
      setLoadingUnits(false);
    }
  }, [user?.authToken, selectedPropId]);

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  async function handleMarkReady(unitId: string) {
    if (!user?.authToken) return;
    setActionLoading(unitId);
    try {
      const res = await fetch(`/api/v1/units/${unitId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.authToken}`,
        },
        body: JSON.stringify({ readinessStatus: "READY" }),
      });
      if (!res.ok) throw new Error("Failed");
      toast("Unit marked as ready", "success");
      await loadUnits();
    } catch {
      toast("Failed to update unit status", "error");
    } finally {
      setActionLoading(null);
    }
  }

  const selectedProp = properties.find((p) => p.id === selectedPropId);

  // Summary counts
  const countByStatus = units.reduce<Record<string, number>>(
    (acc, u) => {
      const s = u.readinessStatus ?? "READY";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Unit Readiness</h1>
          <p className="app-page-lead">
            Short-stay unit status — cleaning, inspection, and availability
          </p>
        </div>
      </div>

      {/* Property selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600">Property:</label>
        {loadingProps ? (
          <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-100" />
        ) : properties.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No short-stay properties found</p>
        ) : (
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={selectedPropId}
            onChange={(e) => setSelectedPropId(e.target.value)}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {selectedPropId && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["READY", "PENDING_CLEAN", "PENDING_INSPECTION", "BLOCKED"] as ReadinessStatus[]).map((s) => {
              const cfg = STATUS_CONFIG[s];
              const Icon = cfg.Icon;
              const count = countByStatus[s] ?? 0;
              return (
                <div
                  key={s}
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 ${cfg.cardClass}`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${cfg.iconClass}`} />
                  <div>
                    <p className={`text-xs font-semibold ${cfg.labelClass}`}>{cfg.label}</p>
                    <p className="text-xl font-bold text-slate-800">{loadingUnits ? "—" : count}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unit grid */}
          {loadingUnits ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : units.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Clock className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-700">No units found</p>
              <p className="text-sm text-slate-500">
                {selectedProp
                  ? `${selectedProp.name} has no units yet`
                  : "Select a property to view units"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {units.map((unit) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  propertyName={selectedProp?.name ?? ""}
                  linkedSRs={linkedSRs[unit.id] ?? []}
                  onMarkReady={(id) => void handleMarkReady(id)}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
