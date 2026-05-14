"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Clock, User, Mail, Phone, Building2,
  CheckCircle2, AlertCircle, FileText, Wrench, CreditCard,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/Card";
import { formatKes } from "@/lib/utils";

type LifecycleEvent = {
  date: string;
  type: string;
  description: string;
  unitRef?: string;
  amount?: number;
};

type TenantProfile = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
};

const EVENT_ICONS: Record<string, React.ElementType> = {
  lease_start: FileText,
  rent_payment: CreditCard,
  maintenance: Wrench,
  checklist: CheckCircle2,
  vacating_notice: AlertCircle,
  inspection: Building2,
  deposit_refund: CreditCard,
  default: Clock,
};

const EVENT_COLORS: Record<string, string> = {
  lease_start: "bg-blue-100 text-blue-600",
  rent_payment: "bg-green-100 text-green-600",
  maintenance: "bg-amber-100 text-amber-600",
  checklist: "bg-teal-100 text-teal-600",
  vacating_notice: "bg-orange-100 text-orange-600",
  inspection: "bg-violet-100 text-violet-600",
  deposit_refund: "bg-emerald-100 text-emerald-600",
  default: "bg-slate-100 text-slate-600",
};

export default function TenantDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [lifecycle, setLifecycle] = useState<LifecycleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "lifecycle">("overview");

  useEffect(() => {
    if (!user?.authToken || !id) return;
    void loadProfile();
  }, [id, user?.authToken]);

  useEffect(() => {
    if (activeTab === "lifecycle" && lifecycle.length === 0 && user?.authToken) {
      void loadLifecycle();
    }
  }, [activeTab, user?.authToken]);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/users/${id}`, {
        headers: { Authorization: `Bearer ${user?.authToken ?? ""}` },
      });
      if (res.ok) {
        const j = await res.json() as { data: TenantProfile };
        setProfile(j.data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadLifecycle() {
    setLifecycleLoading(true);
    try {
      const res = await fetch(`/api/v1/tenants/${id}/lifecycle`, {
        headers: { Authorization: `Bearer ${user?.authToken ?? ""}` },
      });
      if (res.ok) {
        const j = await res.json() as { data: LifecycleEvent[] };
        setLifecycle(j.data ?? []);
      }
    } finally {
      setLifecycleLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/tenants" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> All Tenants
      </Link>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : !profile ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-slate-500">Tenant not found.</CardContent>
        </Card>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10">
              <User className="h-7 w-7 text-brand-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{profile.fullName}</h1>
              <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {profile.email}</span>
                {profile.phoneNumber && (
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {profile.phoneNumber}</span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(["overview", "lifecycle"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab === "overview" ? <User className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 font-semibold text-slate-900">Tenant Profile</h2>
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                    <span className="text-slate-500">Full Name</span>
                    <span className="font-medium text-slate-900">{profile.fullName}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium text-slate-900">{profile.email}</span>
                  </div>
                  {profile.phoneNumber && (
                    <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                      <span className="text-slate-500">Phone</span>
                      <span className="font-medium text-slate-900">{profile.phoneNumber}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-3">
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-blue hover:text-brand-blue transition-colors"
                  >
                    <Mail className="h-4 w-4" /> Email Tenant
                  </a>
                  <button
                    onClick={() => setActiveTab("lifecycle")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-blue hover:text-brand-blue transition-colors"
                  >
                    <Clock className="h-4 w-4" /> View Lifecycle
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "lifecycle" && (
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 font-semibold text-slate-900">Tenant Lifecycle</h2>
                {lifecycleLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}
                  </div>
                ) : lifecycle.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Clock className="mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-slate-500">No lifecycle events found for this tenant.</p>
                  </div>
                ) : (
                  <ol className="relative border-l border-slate-200 pl-6 space-y-5">
                    {lifecycle.map((ev, i) => {
                      const Icon = EVENT_ICONS[ev.type] ?? EVENT_ICONS.default;
                      const colorClass = EVENT_COLORS[ev.type] ?? EVENT_COLORS.default;
                      return (
                        <li key={i} className="relative">
                          <span className={`absolute -left-[1.75rem] flex h-6 w-6 items-center justify-center rounded-full ${colorClass}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm text-slate-800">{ev.description}</p>
                              {ev.unitRef && (
                                <p className="mt-0.5 text-xs text-slate-400">Unit: {ev.unitRef}</p>
                              )}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-xs text-slate-400">
                                {new Date(ev.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                              {ev.amount != null && (
                                <p className="text-xs font-semibold text-slate-700">{formatKes(ev.amount)}</p>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
