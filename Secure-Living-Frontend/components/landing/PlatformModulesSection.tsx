"use client";

import Link from "next/link";
import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Cpu,
  FileClock,
  LayoutDashboard,
  Layers,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  {
    icon: LayoutDashboard,
    title: "Executive Dashboard",
    body: "Live portfolio KPIs, payment status, and team activity in one command view.",
    href: "/auth/login",
  },
  {
    icon: Building2,
    title: "Property Operations",
    body: "Manage properties, occupancy, maintenance, and inspections across locations.",
    href: "/auth/login",
  },
  {
    icon: Users,
    title: "Tenant Lifecycle",
    body: "Onboarding, verification checks, tenancy tracking, and communication history.",
    href: "/auth/login",
  },
  {
    icon: Wallet,
    title: "Escrow & Transactions",
    body: "Protected rent collection, milestone releases, and transparent money flow records.",
    href: "/auth/login",
  },
  {
    icon: BadgeCheck,
    title: "KYC & Compliance",
    body: "Identity checks, status controls, and trust-first workflows for all stakeholders.",
    href: "/auth/login",
  },
  {
    icon: Briefcase,
    title: "Services Network",
    body: "Verified professionals, assignment tracking, and quality assurance milestones.",
    href: "/auth/login",
  },
  {
    icon: ShieldCheck,
    title: "RBAC & Security",
    body: "Role-based controls, permission governance, and secure access at scale.",
    href: "/auth/login",
  },
  {
    icon: FileClock,
    title: "Audit & Governance",
    body: "Immutable activity logs, review trails, and accountability-ready reporting.",
    href: "/auth/login",
  },
];

export function PlatformModulesSection() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from(".module-card", {
        y: 40,
        opacity: 0,
        stagger: 0.07,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 72%",
          once: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      id="modules"
      className="relative overflow-hidden py-28"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="landing-mesh-layer absolute inset-0 opacity-75" />
        <div className="hero-dot-grid absolute inset-0 opacity-35" />
        <div className="absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-brand-blue/[0.1] blur-3xl" />
        <div className="absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-indigo-500/[0.08] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative mb-12 overflow-hidden rounded-2xl border border-white/80 shadow-[0_16px_48px_rgb(var(--rgb-ink)_/_0.1)]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src="/images/property/properties-banner.jpg"
            alt="Property portfolio modules and operations"
            width={1600}
            height={520}
            className="h-40 w-full object-cover sm:h-48"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1f38]/70 via-[#0f1f38]/40 to-transparent" />
          <p className="absolute bottom-4 left-4 max-w-xl text-sm font-medium text-white/90 sm:bottom-5 sm:left-5 sm:text-base">
            Full-stack property management modules for operations, tenants, and finance.
          </p>
        </motion.div>

        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">
            <Layers className="h-4 w-4 text-brand-teal" aria-hidden />
            Complete platform coverage
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-brand-navy sm:text-4xl">
            Every core module in{" "}
            <span className="bg-gradient-to-r from-brand-navy via-brand-blue to-brand-teal bg-clip-text text-transparent">
              one ecosystem
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
            Built for modern property operations: from onboarding and KYC to escrow, governance, and
            role-based security.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4 [perspective:1800px]">
          {modules.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                className={cn(
                  "module-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/80",
                  "bg-gradient-to-b from-white/95 to-sky-50/20 p-6 shadow-[0_12px_40px_rgb(var(--rgb-ink)_/_0.07)] ring-1 ring-brand-blue/[0.07] backdrop-blur-md"
                )}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.4, delay: idx * 0.03 }}
                whileHover={
                  reduceMotion
                    ? { y: -4 }
                    : {
                        rotateX: -6,
                        rotateY: idx % 2 === 0 ? 7 : -7,
                        y: -10,
                        z: 20,
                        transition: { type: "spring", stiffness: 280, damping: 22 },
                      }
                }
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-brand-blue via-sky-400 to-brand-teal opacity-40 transition-opacity duration-300 group-hover:opacity-100" />
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-blue/[0.06] blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                />
                <div
                  className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-escrow to-white shadow-inner ring-1 ring-brand-blue/20"
                  style={{ transform: "translateZ(22px)" }}
                >
                  <Icon className="h-6 w-6 text-brand-blue" aria-hidden />
                </div>
                <h3 className="font-display relative mt-4 text-xl font-semibold text-brand-navy">
                  {item.title}
                </h3>
                <p className="relative mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {item.body}
                </p>
                <Link
                  href={item.href}
                  className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue transition-all hover:gap-3 hover:text-brand-navy"
                >
                  Explore module
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </motion.article>
            );
          })}
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
          <Cpu className="h-3.5 w-3.5 text-brand-blue/60" aria-hidden />
          Verified stack · escrow · operations — built to scale with you
        </p>
      </div>
    </section>
  );
}
