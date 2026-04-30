"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, Building2, Cpu, LayoutDashboard, Sparkles, Users, Wallet } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { Card, CardContent } from "@/components/ui/Card";
import { cn, formatKes } from "@/lib/utils";

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="group overflow-hidden border-white/80 bg-gradient-to-b from-white/98 to-sky-50/20 shadow-[0_12px_48px_rgb(var(--rgb-ink)_/_0.08)] ring-1 ring-brand-blue/[0.08] backdrop-blur-md transition-shadow duration-500 hover:shadow-[0_20px_64px_rgb(var(--rgb-primary)_/_0.12)]">
      <div className="relative border-b border-slate-200/60 bg-gradient-to-r from-slate-50/90 via-white to-sky-50/40 px-4 py-3">
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-blue/10 text-brand-blue">
            <Activity className="h-3.5 w-3.5" aria-hidden />
          </span>
          {title}
        </p>
      </div>
      <CardContent className="relative p-4">{children}</CardContent>
    </Card>
  );
}

export function CommandCenterSection() {
  const [tab, setTab] = useState("dashboard");
  const reduceMotion = useReducedMotion();

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      content: (
        <Panel title="Executive summary">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-sky-200/50 bg-gradient-to-br from-sky-50/90 to-white p-3 shadow-inner ring-1 ring-white/80">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Wallet
              </p>
              <p className="font-display text-lg italic text-brand-navy">{formatKes(1250450)}</p>
            </div>
            <div className="rounded-xl border border-red-100/80 bg-gradient-to-br from-red-50/50 to-white p-3 shadow-inner ring-1 ring-white/80">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Arrears
              </p>
              <p className="font-display text-lg italic text-brand-red">{formatKes(17000)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            Karen & Mombasa portfolios synced. Next disbursement scheduled Tuesday.
          </p>
        </Panel>
      ),
    },
    {
      id: "properties",
      label: "Properties",
      content: (
        <Panel title="Active assets">
          <ul className="space-y-2.5 text-sm">
            <li className="flex justify-between rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-slate-200/80 hover:bg-white/80">
              <span className="font-medium">Redwood Ridge Villas</span>
              <span className="font-semibold text-emerald-600">2 occupied</span>
            </li>
            <li className="flex justify-between rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-slate-200/80 hover:bg-white/80">
              <span className="font-medium">Palm Heights</span>
              <span className="font-semibold text-sky-600">1 available</span>
            </li>
            <li className="flex justify-between rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-slate-200/80 hover:bg-white/80">
              <span className="font-medium">Sunset View Estate</span>
              <span className="font-semibold text-red-600">Arrears</span>
            </li>
          </ul>
        </Panel>
      ),
    },
    {
      id: "tenants",
      label: "Tenants",
      content: (
        <Panel title="Tenant health">
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            12,000+ verified tenants on platform. Sarah K. and Kevin O. paid on time this cycle at
            Karen properties.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 px-3 py-1 text-xs font-bold text-emerald-900 ring-1 ring-emerald-300/40">
              Verified ✓
            </span>
            <span className="rounded-full bg-gradient-to-r from-amber-100 to-orange-50 px-3 py-1 text-xs font-bold text-amber-950 ring-1 ring-amber-300/40">
              Processing ⏳
            </span>
          </div>
        </Panel>
      ),
    },
    {
      id: "transactions",
      label: "Transactions",
      content: (
        <Panel title="Recent flows">
          <ul className="space-y-3 font-mono-data text-xs text-[var(--text-primary)]">
            <li className="flex justify-between border-b border-slate-200/80 pb-2">
              <span>Escrow release</span>
              <span className="font-semibold">{formatKes(150000)}</span>
            </li>
            <li className="flex justify-between border-b border-slate-200/80 pb-2">
              <span>Rent collection</span>
              <span className="font-semibold">{formatKes(80000)}</span>
            </li>
            <li className="flex justify-between">
              <span>Service fee</span>
              <span className="text-[var(--text-muted)]">KES 0</span>
            </li>
          </ul>
        </Panel>
      ),
    },
  ];

  return (
    <section
      id="command"
      className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/30 to-white py-28"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="landing-mesh-layer absolute inset-0 opacity-90" />
        <div className="hero-cyber-grid absolute inset-0 opacity-[0.35]" />
        <div className="hero-dot-grid absolute inset-0 opacity-40" />
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-blue/[0.1] blur-3xl" />
        <div className="absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-brand-teal/[0.09] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent" />
        <div
          className="hero-scan-sweep absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-brand-blue/[0.05] to-transparent opacity-60"
          style={{ animationDuration: "14s" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          className="relative mx-auto mb-10 overflow-hidden rounded-2xl border border-white/80 shadow-[0_16px_48px_rgb(var(--rgb-ink)_/_0.1)]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src="/images/property/transactions-banner.jpg"
            alt="Property operations command center"
            width={1600}
            height={520}
            className="h-40 w-full object-cover sm:h-48"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1f38]/70 via-[#0f1f38]/42 to-transparent" />
          <p className="absolute bottom-4 left-4 max-w-xl text-left text-sm font-medium text-white/90 sm:bottom-5 sm:left-5 sm:text-base">
            One command center for inspections, occupancy, escrow, and portfolio activity.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2, margin: "0px 0px 120px 0px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">
            <Sparkles className="h-3.5 w-3.5 text-brand-teal" aria-hidden />
            Command center
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-brand-navy sm:text-4xl">
            Your Secure Command Center — managed{" "}
            <em className="bg-gradient-to-r from-brand-blue to-brand-teal bg-clip-text font-semibold italic text-transparent">
              smartly
            </em>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-[var(--text-secondary)]">
            Switch between views to see how landlords, finance teams, and field staff stay aligned on
            one live timeline.
          </p>
        </motion.div>

        <motion.div
          className="mt-10 flex justify-center gap-6 text-brand-blue sm:gap-8"
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "0px 0px 120px 0px" }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ perspective: 800 }}
        >
          {[
            { Icon: LayoutDashboard, cls: "landing-icon-orbit" },
            { Icon: Building2, cls: "landing-icon-orbit landing-icon-orbit-d1" },
            { Icon: Users, cls: "landing-icon-orbit landing-icon-orbit-d2" },
            { Icon: Wallet, cls: "landing-icon-orbit landing-icon-orbit-d3" },
          ].map(({ Icon, cls }, i) => (
            <span
              key={i}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-blue/15 bg-white/90 shadow-[0_8px_32px_rgb(var(--rgb-primary)_/_0.1)] ring-1 ring-white/80 backdrop-blur-sm",
                cls
              )}
            >
              <Icon className="h-7 w-7 text-brand-blue drop-shadow-sm" aria-hidden />
            </span>
          ))}
        </motion.div>
      </div>

      <motion.div
        className="relative z-10 mx-auto mt-10 max-w-4xl px-4 sm:px-6 lg:px-8 [perspective:1600px]"
        initial={{ opacity: 0, rotateX: 14, y: 32 }}
        whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
        viewport={{ once: true, amount: 0.12, margin: "0px 0px 160px 0px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="landing-glass-shell relative overflow-hidden rounded-[1.35rem] p-1.5">
          <div
            className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
              animation: reduceMotion ? "none" : "hero-shimmer-border 5s linear infinite",
            }}
            aria-hidden
          />
          <div className="relative rounded-[1.15rem] bg-white/70 p-0.5 backdrop-blur-sm">
            <Tabs
              className="px-4 pb-6 pt-5 sm:px-6"
              tabs={tabs}
              active={tab}
              onChange={setTab}
            />
          </div>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          <Cpu className="h-3.5 w-3.5 text-brand-blue/70" aria-hidden />
          Live preview · demo data
        </p>
      </motion.div>
    </section>
  );
}
