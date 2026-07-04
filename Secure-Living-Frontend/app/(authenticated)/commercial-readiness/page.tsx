"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Gift, Link2, Mail, MessageCircle, Plus, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { formatKes } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type Plan = {
  id: string;
  name: string;
  tier: string;
  listingSlots: number;
  hasServiceRequests: boolean;
  serviceRequestMonthlyLimit: number | null;
  monthlyPriceKes: string | number;
  isListingOnly: boolean;
  isActive: boolean;
};

type Subscription = {
  id: string;
  userId: string;
  organizationId: string | null;
  status: string;
  billingCycle: string;
  nextBillingAt: string | null;
  trialEndsAt: string | null;
  acquisitionSource: string;
  package: Plan;
  billingHistory?: { id: string; invoiceNumber: string; amountKes: string | number; status: string; issuedAt: string }[];
};

type ReferralCode = {
  id: string;
  code: string;
  referrerRole: string;
  rewardType: string;
  rewardValue: string;
  isActive: boolean;
  referrals: Referral[];
};

type Referral = {
  id: string;
  referredName: string | null;
  referredEmail: string | null;
  status: string;
  rewardEligible: boolean;
  rewardApprovedAt: string | null;
  rewardIssuedAt: string | null;
  referralCode?: { code: string; referrerRole: string };
};

type Metrics = {
  subscriptionPlanAdoption: { planId: string; planName: string; tier: string; count: number }[];
  trialToPaidConversionRate: number;
  subscriptionRenewalRate: number;
  referralConversionRate: number;
  successfulReferrals: number;
  acquisitionSources: Record<string, number>;
  averageRevenuePerOrganization: number;
  totals: { subscriptions: number; trial: number; active: number; cancelled: number; expired: number; referrals: number; revenueKes: number };
};

const statusClass: Record<string, string> = {
  trial: "bg-blue-50 text-blue-700",
  active: "bg-emerald-50 text-emerald-700",
  suspended: "bg-amber-50 text-amber-700",
  cancelled: "bg-slate-100 text-slate-600",
  expired: "bg-red-50 text-red-700",
  invited: "bg-blue-50 text-blue-700",
  registered: "bg-indigo-50 text-indigo-700",
  verified: "bg-violet-50 text-violet-700",
  qualified: "bg-emerald-50 text-emerald-700",
  rewarded: "bg-teal-50 text-teal-700",
};

function statusBadge(status: string) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass[status] ?? "bg-slate-100 text-slate-600"}`}>{status.replace(/_/g, " ")}</span>;
}

export default function CommercialReadinessPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingCode, setCreatingCode] = useState(false);
  const [newReferral, setNewReferral] = useState({ code: "", name: "", email: "" });
  const [siteOrigin, setSiteOrigin] = useState("");
  const [copiedValue, setCopiedValue] = useState("");

  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: "", tier: "CUSTOM", listingSlots: "5", monthlyPriceKes: "" });
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");

  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.authToken ?? ""}`,
  }), [user?.authToken]);

  useEffect(() => {
    if (typeof window !== "undefined") setSiteOrigin(window.location.origin);
  }, []);

  function referralLink(code: string) {
    const origin = siteOrigin || "https://secure-living-ldt8.vercel.app";
    return `${origin}/auth/register?role=landlord&ref=${encodeURIComponent(code)}`;
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      toast(`${label} copied`, "success");
      window.setTimeout(() => setCopiedValue((current) => (current === value ? "" : current)), 1800);
    } catch {
      toast(`Copy failed. Select and copy the ${label.toLowerCase()} manually.`, "error");
    }
  }

  async function load() {
    if (!user?.authToken) return;
    setLoading(true);
    try {
      const [planRes, subRes, codeRes, refRes, metricRes] = await Promise.all([
        fetch("/api/v1/commercial/subscription-plans", { headers }),
        fetch(`/api/v1/commercial/subscriptions${isAdmin ? "" : "?current=true"}`, { headers }),
        fetch(`/api/v1/commercial/referral-codes${isAdmin ? "" : "?mine=true"}`, { headers }),
        fetch("/api/v1/commercial/referrals", { headers }),
        fetch("/api/v1/commercial/metrics", { headers }),
      ]);
      if (planRes.ok) setPlans(((await planRes.json()) as { data: Plan[] }).data ?? []);
      if (subRes.ok) {
        const data = ((await subRes.json()) as { data: Subscription[] | Subscription | null }).data;
        setSubscriptions(Array.isArray(data) ? data : data ? [data] : []);
      }
      if (codeRes.ok) setCodes(((await codeRes.json()) as { data: ReferralCode[] }).data ?? []);
      if (refRes.ok) setReferrals(((await refRes.json()) as { data: Referral[] }).data ?? []);
      if (metricRes.ok) setMetrics(((await metricRes.json()) as { data: Metrics }).data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [user?.authToken, isAdmin]);

  async function createPlan() {
    if (!newPlan.name.trim() || !newPlan.monthlyPriceKes) {
      toast("Plan name and monthly price are required", "error");
      return;
    }
    const res = await fetch("/api/v1/commercial/subscription-plans", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: newPlan.name.trim(),
        tier: newPlan.tier,
        listingSlots: Number(newPlan.listingSlots) || 0,
        monthlyPriceKes: Number(newPlan.monthlyPriceKes),
      }),
    });
    if (res.ok) {
      toast("Plan created", "success");
      setShowAddPlan(false);
      setNewPlan({ name: "", tier: "CUSTOM", listingSlots: "5", monthlyPriceKes: "" });
      await load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast((j as { error?: string }).error ?? "Failed to create plan", "error");
    }
  }

  async function savePlanPrice(planId: string) {
    if (!priceDraft) return;
    const res = await fetch(`/api/v1/commercial/subscription-plans/${planId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ monthlyPriceKes: Number(priceDraft) }),
    });
    if (res.ok) {
      toast("Price updated", "success");
      setEditingPriceId(null);
      await load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast((j as { error?: string }).error ?? "Failed to update price", "error");
    }
  }

  async function createReferralCode() {
    setCreatingCode(true);
    try {
      const res = await fetch("/api/v1/commercial/referral-codes", {
        method: "POST",
        headers,
        body: JSON.stringify({ rewardType: "free_subscription_period", rewardValue: "1_month" }),
      });
      if (res.ok) {
        toast("Referral code created", "success");
        await load();
      } else {
        const j = await res.json();
        toast((j as { error?: string }).error ?? "Failed to create referral code", "error");
      }
    } finally {
      setCreatingCode(false);
    }
  }

  async function createReferral() {
    if (!newReferral.code || !newReferral.email) {
      toast("Referral code and email are required", "error");
      return;
    }
    const res = await fetch("/api/v1/commercial/referrals", {
      method: "POST",
      headers,
      body: JSON.stringify({
        referralCode: newReferral.code,
        referredName: newReferral.name || undefined,
        referredEmail: newReferral.email,
        status: "invited",
      }),
    });
    if (res.ok) {
      toast("Referral invitation tracked", "success");
      setNewReferral({ code: "", name: "", email: "" });
      await load();
    } else {
      const j = await res.json();
      toast((j as { error?: string }).error ?? "Failed to track referral", "error");
    }
  }

  async function updateReferral(id: string, action: "qualified" | "approveReward" | "issueReward") {
    const body = action === "qualified"
      ? { status: "qualified", rewardEligible: true, note: "Referral qualified during pilot review" }
      : action === "approveReward"
        ? { approveReward: true, note: "Reward approved" }
        : { status: "rewarded", issueReward: true, note: "Reward issued" };
    const res = await fetch(`/api/v1/commercial/referrals/${id}`, { method: "PUT", headers, body: JSON.stringify(body) });
    if (res.ok) {
      toast("Referral updated", "success");
      await load();
    }
  }

  async function updateSubscription(id: string, status: string) {
    const res = await fetch(`/api/v1/commercial/subscriptions/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status, note: `Pilot subscription moved to ${status}` }),
    });
    if (res.ok) {
      toast("Subscription updated", "success");
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Commercial Readiness</h1>
          <p className="app-page-lead">Pilot subscription management, referral tracking, rewards, and commercial validation metrics.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {metrics && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Subscriptions</p><p className="mt-1 text-2xl font-bold text-slate-900">{metrics.totals.subscriptions}</p><p className="text-xs text-slate-500">{metrics.totals.trial} trial, {metrics.totals.active} active</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Trial to Paid</p><p className="mt-1 text-2xl font-bold text-slate-900">{metrics.trialToPaidConversionRate}%</p><p className="text-xs text-slate-500">Pilot conversion rate</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Referral Conversion</p><p className="mt-1 text-2xl font-bold text-slate-900">{metrics.referralConversionRate}%</p><p className="text-xs text-slate-500">{metrics.successfulReferrals} successful referrals</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Avg Revenue / Org</p><p className="mt-1 text-2xl font-bold text-slate-900">{formatKes(metrics.averageRevenuePerOrganization)}</p><p className="text-xs text-slate-500">Paid billing records</p></CardContent></Card>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subscription Plans</CardTitle>
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => setShowAddPlan((s) => !s)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Plan
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAdmin && showAddPlan && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
                <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Plan name"
                  value={newPlan.name} onChange={(e) => setNewPlan((p) => ({ ...p, name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={newPlan.tier}
                    onChange={(e) => setNewPlan((p) => ({ ...p, tier: e.target.value }))}>
                    {["FREE", "LISTING_ONLY", "STARTER", "PROFESSIONAL", "BUSINESS", "ENTERPRISE", "CUSTOM"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="number" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Listing slots"
                    value={newPlan.listingSlots} onChange={(e) => setNewPlan((p) => ({ ...p, listingSlots: e.target.value }))} />
                </div>
                <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Monthly price (KES)"
                  value={newPlan.monthlyPriceKes} onChange={(e) => setNewPlan((p) => ({ ...p, monthlyPriceKes: e.target.value }))} />
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowAddPlan(false)} className="flex-1">Cancel</Button>
                  <Button size="sm" onClick={() => void createPlan()} className="flex-1">Create</Button>
                </div>
              </div>
            )}
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{plan.name}</p>
                    <p className="text-xs text-slate-500">{plan.tier} · {plan.listingSlots} listing slots · {plan.hasServiceRequests ? "Service requests enabled" : "No service requests"}</p>
                  </div>
                  {isAdmin && editingPriceId === plan.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" autoFocus className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        value={priceDraft} onChange={(e) => setPriceDraft(e.target.value)} />
                      <Button size="sm" onClick={() => void savePlanPrice(plan.id)}>Save</Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={!isAdmin}
                      title={isAdmin ? "Click to edit price — no price is permanent" : undefined}
                      onClick={() => { if (isAdmin) { setEditingPriceId(plan.id); setPriceDraft(String(plan.monthlyPriceKes)); } }}
                      className={`font-semibold text-blue-700 ${isAdmin ? "hover:underline" : ""}`}
                    >
                      {formatKes(Number(plan.monthlyPriceKes))}/mo
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!plans.length && <p className="text-sm text-slate-500">No plans configured yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Organisation Subscriptions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{sub.package?.name ?? "Subscription"}</p>
                    <p className="text-xs text-slate-500">{sub.billingCycle} · source: {sub.acquisitionSource} · next billing {sub.nextBillingAt ? new Date(sub.nextBillingAt).toLocaleDateString() : "not set"}</p>
                  </div>
                  {statusBadge(sub.status)}
                </div>
                {isAdmin && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["active", "suspended", "cancelled", "expired"].map((s) => (
                      <Button key={s} size="sm" variant="outline" onClick={() => void updateSubscription(sub.id, s)}>{s}</Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!subscriptions.length && <p className="text-sm text-slate-500">No subscription records found.</p>}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <Link2 className="h-5 w-5 text-blue-600" />
                Referral Links
              </span>
              <Button size="sm" onClick={createReferralCode} disabled={creatingCode}>
                <Gift className="mr-2 h-4 w-4" /> Generate Link
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">1. Generate</p>
                <p className="mt-1 text-sm text-blue-950">Create a unique referral code tied to the current user or organization.</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">2. Share Link</p>
                <p className="mt-1 text-sm text-emerald-950">Copy the registration link and send it by email, WhatsApp, or direct message.</p>
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">3. Track Reward</p>
                <p className="mt-1 text-sm text-violet-950">When the invitee registers, the referral moves to registered automatically.</p>
              </div>
            </div>

            {codes.map((code) => {
              const link = referralLink(code.code);
              const mailHref = `mailto:?subject=${encodeURIComponent("Join Secure Living")}&body=${encodeURIComponent(`Use my Secure Living referral link to create your account: ${link}`)}`;
              const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`Join Secure Living using my referral link: ${link}`)}`;
              return (
                <div key={code.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Referral code</p>
                      <p className="mt-1 font-mono text-xl font-bold text-slate-950">{code.code}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {code.rewardType.replace(/_/g, " ")} - {code.rewardValue} - {code.referrals?.length ?? 0} recent referrals
                      </p>
                    </div>
                    {code.isActive ? statusBadge("active") : statusBadge("cancelled")}
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shareable registration link</label>
                    <div className="mt-2 flex flex-col gap-2 lg:flex-row">
                      <input
                        readOnly
                        value={link}
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        onFocus={(event) => event.currentTarget.select()}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => void copyText(code.code, "Referral code")}>
                          <Copy className="mr-1.5 h-3.5 w-3.5" /> {copiedValue === code.code ? "Copied" : "Code"}
                        </Button>
                        <Button size="sm" onClick={() => void copyText(link, "Referral link")}>
                          <Copy className="mr-1.5 h-3.5 w-3.5" /> {copiedValue === link ? "Copied" : "Link"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.open(link, "_blank", "noopener,noreferrer")}>
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100" href={mailHref}>
                        <Mail className="h-3.5 w-3.5" /> Email
                      </a>
                      <a className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100" href={whatsappHref} target="_blank" rel="noreferrer">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                        onClick={() => setNewReferral((f) => ({ ...f, code: code.code }))}
                      >
                        <Plus className="h-3.5 w-3.5" /> Use in tracker
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {!codes.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <Gift className="mx-auto h-8 w-8 text-blue-600" />
                <p className="mt-3 font-semibold text-slate-900">No referral links yet</p>
                <p className="mt-1 text-sm text-slate-500">Generate a link to invite landlords, agencies, or service providers and track their signup progress.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Track Referral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-950">
              Add a referral manually when the invite was sent outside the generated link. Link signups are tracked automatically at registration.
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Referral code</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm uppercase" placeholder="Referral code" value={newReferral.code} onChange={(e) => setNewReferral((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Referred name</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Referred name" value={newReferral.name} onChange={(e) => setNewReferral((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Referred email</label>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Referred email" value={newReferral.email} onChange={(e) => setNewReferral((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <Button onClick={createReferral} className="w-full"><Plus className="mr-2 h-4 w-4" /> Add Manual Referral</Button>
          </CardContent>
        </Card>
      </section>

      <section className="hidden" aria-hidden="true">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Referral Codes</span>
              <Button size="sm" onClick={createReferralCode} disabled={creatingCode}>
                <Gift className="mr-2 h-4 w-4" /> Generate
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {codes.map((code) => (
              <div key={code.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg font-bold text-slate-900">{code.code}</p>
                    <p className="text-xs text-slate-500">{code.rewardType.replace(/_/g, " ")} · {code.rewardValue} · {code.referrals?.length ?? 0} recent referrals</p>
                  </div>
                  {code.isActive ? statusBadge("active") : statusBadge("cancelled")}
                </div>
              </div>
            ))}
            {!codes.length && <p className="text-sm text-slate-500">No referral codes yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Track Referral</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Referral code" value={newReferral.code} onChange={(e) => setNewReferral((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Referred name" value={newReferral.name} onChange={(e) => setNewReferral((f) => ({ ...f, name: e.target.value }))} />
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Referred email" value={newReferral.email} onChange={(e) => setNewReferral((f) => ({ ...f, email: e.target.value }))} />
            <Button onClick={createReferral} className="w-full"><Plus className="mr-2 h-4 w-4" /> Add Referral</Button>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Referral Activity</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Referral</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Reward</th>
                {isAdmin && <th className="px-4 py-3 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referrals.map((ref) => (
                <tr key={ref.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{ref.referredName ?? "Unnamed referral"}</p>
                    <p className="text-xs text-slate-500">{ref.referredEmail ?? "No email"}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{ref.referralCode?.code ?? "-"}</td>
                  <td className="px-4 py-3">{statusBadge(ref.status)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{ref.rewardIssuedAt ? "Issued" : ref.rewardApprovedAt ? "Approved" : ref.rewardEligible ? "Eligible" : "Not eligible"}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => void updateReferral(ref.id, "qualified")}>Qualify</Button>
                        <Button size="sm" variant="outline" onClick={() => void updateReferral(ref.id, "approveReward")}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => void updateReferral(ref.id, "issueReward")}>Issue</Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!referrals.length && <p className="p-4 text-sm text-slate-500">No referral activity yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
