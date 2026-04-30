"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  BarChart3,
  Building2,
  CalendarClock,
  FileSpreadsheet,
  FileSignature,
  SearchCheck,
  ShieldCheck,
  Star,
  Wrench,
  ArrowRight,
  Check,
  Users,
  Wallet,
  Lock,
  Zap,
  TrendingUp,
  ClipboardList,
  Clock,
  Bell,
  CreditCard,
  PieChart,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/* ─── Motion helpers ─────────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1] as const;

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated stat counter ──────────────────────────────────── */
function StatCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const dur = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ─── Feature grid data ──────────────────────────────────────── */
const features = [
  { eyebrow: "Property Analytics", title: "Real-time dashboards for every property.", body: "Track income, expenses, yield, and NOI across your portfolio — from a bedsitter to a 50-unit block.", Icon: BarChart3, gradient: "from-blue-500 to-blue-700" },
  { eyebrow: "Bookkeeping", title: "Replace spreadsheets with automation.", body: "M-Pesa, bank transfers, and cash — every transaction categorised and audit-ready, automatically.", Icon: FileSpreadsheet, gradient: "from-violet-500 to-violet-700" },
  { eyebrow: "Rent Collection", title: "Get paid on time, every time.", body: "Automated reminders, late-fee handling, and M-Pesa STK push — rent arrives in your wallet, not your WhatsApp.", Icon: CalendarClock, gradient: "from-emerald-500 to-emerald-700" },
  { eyebrow: "Tenant Screening", title: "Know exactly who you're letting in.", body: "Employment checks, ID verification, and risk scoring built into your leasing flow — before you hand over the keys.", Icon: ShieldCheck, gradient: "from-teal-500 to-teal-700" },
  { eyebrow: "Maintenance Tracking", title: "Never lose track of a repair again.", body: "Tenants submit requests with photos. You assign professionals and track progress in one place.", Icon: Wrench, gradient: "from-amber-500 to-amber-700" },
];

/* ─── Ratings ────────────────────────────────────────────────── */
const ratings = [
  { source: "Apple App Store", rating: "4.8" },
  { source: "Capterra", rating: "4.7" },
  { source: "Software Advice", rating: "4.6" },
];

const advantages = [
  "Escrow-backed tenant deposits",
  "M-Pesa & bank payment integration",
  "Legally compliant Kenyan leases",
  "Full audit trail on every transaction",
  "Role-based team access control",
  "24/7 portfolio visibility",
];

const testimonials = [
  { quote: "I used to spend weekends chasing tenants and updating spreadsheets. Now I check my dashboard on Monday morning and everything is already done.", author: "James Kariuki", meta: "12 Units · Nairobi", initials: "JK", color: "bg-blue-600" },
  { quote: "The escrow system gave me the confidence to rent to people I didn't know personally. My money is always protected.", author: "Grace Wanjiku", meta: "4 Properties · Mombasa", initials: "GW", color: "bg-emerald-600" },
  { quote: "Maintenance requests and rent collection in one place — my tenants are happier and so am I. The platform paid for itself in month one.", author: "Samuel Otieno", meta: "8 Units · Kisumu", initials: "SO", color: "bg-violet-600" },
];

/* ─── CSS Mockup: Lease Management ──────────────────────────── */
function LeaseMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto select-none">
      {/* Background card shadow */}
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-rose-100/60" />
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <FileSignature className="h-3.5 w-3.5 text-rose-500" />
            <span className="text-[11px] font-semibold text-slate-600">Residential Lease Agreement</span>
          </div>
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Active</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Parties */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Tenant", value: "James Kariuki" },
              { label: "Property", value: "Sunrise Apts — A3" },
              { label: "Term", value: "12 months" },
              { label: "Monthly Rent", value: "KES 45,000" },
            ].map((f) => (
              <div key={f.label} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">{f.label}</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Document lines */}
          <div className="space-y-1.5">
            {[90, 100, 75, 100, 60].map((w, i) => (
              <div key={i} className="h-1.5 rounded-full bg-slate-100" style={{ width: `${w}%` }} />
            ))}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4 border-t border-dashed border-slate-200 pt-4">
            {[
              { name: "J. Kariuki ✓", label: "Tenant", signed: true },
              { name: "G. Mwakaba ✓", label: "Landlord", signed: true },
            ].map((s) => (
              <div key={s.label}>
                <div className={`h-7 border-b-2 ${s.signed ? "border-blue-400" : "border-slate-300"} flex items-end pb-0.5`}>
                  <span className={`font-serif text-sm italic ${s.signed ? "text-blue-600" : "text-slate-300"}`}>{s.name}</span>
                </div>
                <p className="mt-1 text-[9px] text-slate-400">{s.label} Signature</p>
              </div>
            ))}
          </div>

          {/* Renewal alert */}
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <Bell className="h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p className="text-[10px] font-bold text-amber-800">Renewal Alert</p>
              <p className="text-[9px] text-amber-600">Lease expires in 47 days — renewal draft ready</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 ml-auto text-amber-500" />
          </div>

          {/* Status pills */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "e-Signed", color: "bg-emerald-100 text-emerald-700" },
              { label: "KRA Compliant", color: "bg-blue-100 text-blue-700" },
              { label: "Stored in cloud", color: "bg-violet-100 text-violet-700" },
            ].map((p) => (
              <span key={p.label} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${p.color}`}>{p.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── CSS Mockup: Portfolio Acquisitions ─────────────────────── */
function PortfolioMockup() {
  const bars = [
    { label: "Gross Rent", value: 85, color: "bg-blue-500", amount: "KES 180K" },
    { label: "Operating Costs", value: 40, color: "bg-rose-400", amount: "KES 85K" },
    { label: "Net Cash Flow", value: 62, color: "bg-emerald-500", amount: "KES 95K" },
  ];
  return (
    <div className="relative w-full max-w-md mx-auto select-none">
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-sky-100/60" />
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <PieChart className="h-3.5 w-3.5 text-sky-500" />
            <span className="text-[11px] font-semibold text-slate-600">Deal Underwriter</span>
          </div>
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">Parklands Block</span>
        </div>

        <div className="p-5 space-y-4">
          {/* KPI tiles */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Gross Yield", value: "8.4%", color: "text-blue-700", bg: "bg-blue-50" },
              { label: "Net Yield", value: "6.1%", color: "text-emerald-700", bg: "bg-emerald-50" },
              { label: "IRR (5yr)", value: "12.3%", color: "text-violet-700", bg: "bg-violet-50" },
            ].map((k) => (
              <div key={k.label} className={`rounded-xl ${k.bg} p-3 text-center`}>
                <p className={`text-base font-extrabold ${k.color}`}>{k.value}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Monthly Cash-Flow Breakdown</p>
            {bars.map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-[9px] text-slate-500">{b.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${b.color}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${b.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-[9px] font-bold text-slate-700">{b.amount}</span>
              </div>
            ))}
          </div>

          {/* Cap rate */}
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest">Cap Rate</p>
                <p className="text-lg font-extrabold text-slate-900">7.2%</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest">Payback Period</p>
                <p className="text-lg font-extrabold text-slate-900">13.9 yrs</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest">Asking Price</p>
                <p className="text-lg font-extrabold text-slate-900">KES 28M</p>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <p className="text-[10px] font-semibold text-emerald-800">Strong buy — exceeds 6% yield threshold</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── CSS Mockup: Landlord Banking ───────────────────────────── */
function BankingMockup() {
  const txns = [
    { label: "Rent — Unit A3", sub: "M-Pesa STK · Today, 09:14", amount: "+45,000", type: "credit" },
    { label: "Rent — Unit B1", sub: "Bank Transfer · Yesterday", amount: "+30,000", type: "credit" },
    { label: "Escrow Hold", sub: "Deposit — New tenant", amount: "-50,000", type: "hold" },
    { label: "Maintenance Fund", sub: "Unit C2 repairs", amount: "-12,500", type: "debit" },
  ];
  return (
    <div className="relative w-full max-w-md mx-auto select-none">
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-indigo-100/60" />
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Wallet header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 pt-5 pb-8 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
          <div className="absolute -right-4 top-8 h-20 w-20 rounded-full bg-white/5" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200">Property Wallet</p>
              <p className="text-[11px] text-blue-100 mt-0.5">Sunrise Apartments</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Wallet className="h-4.5 w-4.5 text-white" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-extrabold tracking-tight">KES 248,500</p>
          <p className="mt-1 text-[10px] text-blue-200">Available balance · Escrow secured</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-px bg-slate-100 -mt-2 mx-4 rounded-xl overflow-hidden shadow-md">
          {[
            { label: "This Month", value: "KES 75K", icon: TrendingUp, color: "text-emerald-600" },
            { label: "In Escrow", value: "KES 50K", icon: Lock, color: "text-amber-600" },
            { label: "Payouts", value: "2 Sent", icon: Zap, color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white px-2 py-3 text-center">
              <s.icon className={`h-3.5 w-3.5 ${s.color} mx-auto mb-1`} />
              <p className="text-[10px] font-bold text-slate-800">{s.value}</p>
              <p className="text-[8px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="p-4 space-y-2 mt-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recent Transactions</p>
          {txns.map((t) => (
            <div key={t.label} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.type === "credit" ? "bg-emerald-100" : t.type === "hold" ? "bg-amber-100" : "bg-red-100"}`}>
                {t.type === "credit" ? <ArrowRight className="h-3.5 w-3.5 -rotate-45 text-emerald-600" /> : t.type === "hold" ? <Lock className="h-3.5 w-3.5 text-amber-600" /> : <CreditCard className="h-3.5 w-3.5 text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-slate-800 truncate">{t.label}</p>
                <p className="text-[9px] text-slate-400">{t.sub}</p>
              </div>
              <span className={`text-[11px] font-bold shrink-0 ${t.type === "credit" ? "text-emerald-600" : "text-slate-500"}`}>{t.amount}</span>
            </div>
          ))}

          <button className="mt-1 w-full rounded-xl bg-blue-600 py-2.5 text-[11px] font-bold text-white transition hover:bg-blue-700 flex items-center justify-center gap-2">
            <Zap className="h-3.5 w-3.5" /> Instant Payout → M-Pesa
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export function StessaCloneSections() {
  return (
    <>
      {/* ── 1. Stats / Social proof ─────────────────────────────── */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <FadeUp className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-blue">
              Trusted across Kenya
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              The platform{" "}
              <span className="text-brand-blue">Kenyan landlords rely on</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              From single bedsitters to large apartment blocks — Secure Living handles the operations so you can focus on growth.
            </p>
          </FadeUp>

          <FadeUp delay={0.1} className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              { label: "Properties managed", value: 12400, suffix: "+" },
              { label: "Rent collected (KES)", value: 2, suffix: "B+", prefix: "" },
              { label: "Landlords onboarded", value: 8500, suffix: "+" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                  <StatCounter value={s.value} suffix={s.suffix} prefix={s.prefix} />
                </p>
                <p className="mt-2 text-sm font-medium text-slate-500">{s.label}</p>
              </div>
            ))}
          </FadeUp>

          <FadeUp delay={0.2} className="mt-12 grid gap-4 sm:grid-cols-3">
            {ratings.map((r) => (
              <div key={r.source} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center transition-shadow hover:shadow-md">
                <div className="flex justify-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900">{r.rating}</p>
                <p className="text-sm text-slate-500">{r.source}</p>
              </div>
            ))}
          </FadeUp>
        </div>
      </section>

      {/* ── 2. Core features grid ───────────────────────────────── */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <FadeUp className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-blue">Everything in one platform</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              All the tools serious landlords need
            </h2>
            <p className="mt-4 text-lg text-slate-500">Purpose-built for the Kenyan market — not adapted from a foreign platform.</p>
          </FadeUp>

          {/* 5-card bento: top row 3 wide, bottom row 2 wide */}
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FadeUp key={f.eyebrow} delay={i * 0.07} className={i === 0 ? "lg:col-span-2" : ""}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} shadow-md`}>
                    <f.Icon className="h-6 w-6 text-white" strokeWidth={1.8} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{f.eyebrow}</p>
                  <h3 className="mt-2 text-lg font-bold leading-snug text-slate-900">{f.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-500">{f.body}</p>
                  <Link href="/auth/register" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue transition-all group-hover:gap-3">
                    Get started <ArrowRight className="h-4 w-4" />
                  </Link>
                  <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r ${f.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
                </article>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Lease Management spotlight ──────────────────────── */}
      <section className="bg-white py-28 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Text */}
            <div>
              <FadeUp>
                <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">
                  <FileSignature className="h-3.5 w-3.5" /> Lease Management
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
                  Prepare, sign, and<br />store leases{" "}
                  <span className="text-rose-500">digitally.</span>
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-slate-500">
                  Legally compliant Kenyan lease templates, e-signature, automatic renewal alerts, and cloud storage — all included.
                </p>
              </FadeUp>
              <FadeUp delay={0.12} className="mt-8 space-y-3">
                {[
                  "KRA-compliant lease templates for residential & commercial",
                  "E-signature with legally binding audit trail",
                  "Automatic renewal reminders 60, 30 & 14 days out",
                  "All documents stored securely in the cloud",
                  "Share with tenants via WhatsApp or email",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100">
                      <Check className="h-3 w-3 text-rose-600" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </FadeUp>
              <FadeUp delay={0.2} className="mt-10">
                <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-rose-200 transition-all hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-lg">
                  Start managing leases <ArrowRight className="h-4 w-4" />
                </Link>
              </FadeUp>
            </div>

            {/* Mockup */}
            <FadeIn delay={0.15}>
              <LeaseMockup />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── 4. Portfolio Acquisitions spotlight ─────────────────── */}
      <section className="bg-slate-50 py-28 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Mockup first on this row */}
            <FadeIn delay={0.1} className="order-2 lg:order-1">
              <PortfolioMockup />
            </FadeIn>

            {/* Text */}
            <div className="order-1 lg:order-2">
              <FadeUp>
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-600">
                  <SearchCheck className="h-3.5 w-3.5" /> Portfolio Acquisitions
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
                  Underwrite new deals{" "}
                  <span className="text-sky-500">with confidence.</span>
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-slate-500">
                  Run yield calculations, cap-rate estimates, and cash-flow projections before committing to any acquisition — so you never overpay.
                </p>
              </FadeUp>
              <FadeUp delay={0.12} className="mt-8 space-y-3">
                {[
                  "Gross & net yield calculator with Kenya-specific cost models",
                  "Cap rate, IRR, and payback period in one click",
                  "Monthly cash-flow breakdown by income vs. expense",
                  "Compare multiple deals side by side",
                  "Export reports for lenders and partners",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100">
                      <Check className="h-3 w-3 text-sky-600" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </FadeUp>
              <FadeUp delay={0.2} className="mt-10">
                <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200 transition-all hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-lg">
                  Analyse your next deal <ArrowRight className="h-4 w-4" />
                </Link>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Landlord Banking spotlight ───────────────────────── */}
      <section className="bg-white py-28 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Text */}
            <div>
              <FadeUp>
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
                  <Wallet className="h-3.5 w-3.5" /> Landlord Banking
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
                  Dedicated property-level<br />
                  <span className="text-indigo-500">wallets & payouts.</span>
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-slate-500">
                  Escrow-backed rent holding, instant M-Pesa payouts, and a full transaction history — with zero risk of mixing funds across properties.
                </p>
              </FadeUp>
              <FadeUp delay={0.12} className="mt-8 space-y-3">
                {[
                  "Separate wallet per property — funds never commingled",
                  "Escrow-backed tenant deposits with dispute resolution",
                  "Instant payouts to M-Pesa or any Kenyan bank",
                  "Full ledger with every shilling accounted for",
                  "Freeze accounts and hold funds during disputes",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                      <Check className="h-3 w-3 text-indigo-600" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </FadeUp>
              <FadeUp delay={0.2} className="mt-10">
                <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg">
                  Open your property wallet <ArrowRight className="h-4 w-4" />
                </Link>
              </FadeUp>
            </div>

            {/* Mockup */}
            <FadeIn delay={0.15}>
              <BankingMockup />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── 6. How it works ─────────────────────────────────────── */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <FadeUp className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-blue">Up and running in minutes</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">How Secure Living works</h2>
          </FadeUp>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              { number: "01", Icon: Building2, title: "Add your properties & units", body: "Import your existing portfolio or add properties in minutes. Define units, set rents, and upload your documents." },
              { number: "02", Icon: Users, title: "Onboard tenants & sign leases", body: "Screen applicants, send digital leases for e-signature, and collect deposits into secure escrow accounts." },
              { number: "03", Icon: TrendingUp, title: "Collect rent & grow", body: "Automate rent collection via M-Pesa, track every shilling, and use real-time insights to optimise your portfolio." },
            ].map((step, i) => (
              <FadeUp key={step.number} delay={i * 0.12}>
                <div className="relative flex flex-col items-start">
                  {i < 2 && (
                    <div className="absolute left-[calc(100%+1rem)] top-7 hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-slate-300 to-transparent lg:block" />
                  )}
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-blue-700 shadow-lg shadow-blue-200">
                    <step.Icon className="h-6 w-6 text-white" strokeWidth={1.8} />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">{step.number}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.3} className="mt-12 text-center">
            <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg">
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ── 7. Why Secure Living ─────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <FadeUp>
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-blue">Why choose Secure Living</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Built for Kenya. Trusted by landlords.</h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-500">
                  Generic property software wasn&apos;t built for M-Pesa, Kenyan lease law, or diaspora portfolios. Secure Living was.
                </p>
              </FadeUp>
              <FadeUp delay={0.12} className="mt-8 grid gap-3 sm:grid-cols-2">
                {advantages.map((adv) => (
                  <div key={adv} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-3 w-3 text-emerald-600" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{adv}</span>
                  </div>
                ))}
              </FadeUp>
              <FadeUp delay={0.2} className="mt-10">
                <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md">
                  Create free account <ArrowRight className="h-4 w-4" />
                </Link>
              </FadeUp>
            </div>

            <FadeUp delay={0.1}>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { Icon: Lock, title: "Bank-grade security", body: "All data encrypted at rest and in transit. SOC 2 compliant infrastructure.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                  { Icon: Zap, title: "Instant M-Pesa payouts", body: "Collect rent and receive payouts to your M-Pesa or bank account within hours.", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                  { Icon: ClipboardList, title: "Full audit trail", body: "Every action logged — leases, payments, maintenance, team activities.", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
                  { Icon: Wallet, title: "Escrow protection", body: "Tenant deposits held in regulated escrow — never commingled with rent.", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                ].map((c) => (
                  <div key={c.title} className={`rounded-2xl border ${c.border} bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md`}>
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}>
                      <c.Icon className={`h-5 w-5 ${c.color}`} />
                    </div>
                    <p className="text-sm font-bold text-slate-900">{c.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{c.body}</p>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── 8. Testimonials ─────────────────────────────────────── */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <FadeUp className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-blue">Real landlords, real results</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">What our landlords say</h2>
          </FadeUp>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <FadeUp key={t.author} delay={i * 0.1}>
                <figure className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-xl">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
                  </div>
                  <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-600">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${t.color}`}>{t.initials}</div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.author}</p>
                      <p className="text-xs text-slate-400">{t.meta}</p>
                    </div>
                  </figcaption>
                </figure>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Final CTA ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-900 py-28">
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-600 opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-violet-600 opacity-20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <FadeUp>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">Get started today</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Manage your portfolio
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">like a professional.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">Set up your first property in under 5 minutes. No credit card required.</p>
          </FadeUp>

          <FadeUp delay={0.15} className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-slate-900 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-xl">
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/auth/login" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20">
              Landlord login
            </Link>
          </FadeUp>

          <FadeUp delay={0.25} className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-400">
            {["Free to start", "No credit card needed", "Cancel anytime", "Kenya-based support"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" /> {t}
              </span>
            ))}
          </FadeUp>
        </div>
      </section>

      {/* ── 10. Newsletter ───────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-white py-20" id="newsletter">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <FadeUp>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-blue">Stay informed</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">The Kenyan landlord&apos;s weekly briefing</h2>
              <p className="mt-3 text-slate-500">Market rents, new regulations, property management tips — delivered every Monday.</p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="your@email.com" className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm shadow-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
                <button type="submit" className="h-12 rounded-xl bg-brand-blue px-6 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md">
                  Subscribe
                </button>
              </form>
              <p className="mt-3 text-xs text-slate-400">By subscribing you agree to our Privacy Policy. Unsubscribe at any time.</p>
            </FadeUp>
          </div>
        </div>
      </section>
    </>
  );
}
