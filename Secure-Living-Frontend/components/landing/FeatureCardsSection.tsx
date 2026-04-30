"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Cpu, Eye, Lock, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Lock,
    title: "Escrow-backed security",
    body: "Funds held until milestones are verified. Clear fees for buyers, sellers, landlords, and tenants across Kenya.",
    accent: "from-brand-blue/20 via-sky-500/10 to-transparent",
  },
  {
    icon: Eye,
    title: "Portfolio visibility",
    body: "Track occupancy, rent, and maintenance so you can decide early — without being on the ground.",
    accent: "from-sky-500/15 via-brand-blue/10 to-transparent",
  },
  {
    icon: Users,
    title: "Everyone in one place",
    body: "Staff, contractors, and verified professionals with role-appropriate access and audit trails.",
    accent: "from-indigo-500/12 via-brand-teal/10 to-transparent",
  },
  {
    icon: Sparkles,
    title: "Clear reporting",
    body: "Structured updates and records so you avoid fake listings and know what was verified before you pay.",
    accent: "from-[var(--brand-gold)]/15 via-brand-blue/10 to-transparent",
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 },
};

export function FeatureCardsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative overflow-hidden py-28"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="landing-mesh-layer absolute inset-0 opacity-80" />
        <div className="hero-cyber-grid absolute inset-0 opacity-[0.28]" />
        <div className="absolute left-1/2 top-0 h-[min(500px,70vw)] w-[min(500px,70vw)] -translate-x-1/2 rounded-full bg-brand-blue/[0.07] blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2, margin: "0px 0px 120px 0px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">
            <Cpu className="h-3.5 w-3.5 text-brand-teal" aria-hidden />
            Platform capabilities
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-brand-navy sm:text-4xl">
            Escrow-backed protection &amp;{" "}
            <span className="bg-gradient-to-r from-brand-blue via-sky-500 to-[var(--brand-gold)] bg-clip-text text-transparent">
              calm operations
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
            Practical controls for verified listings and secure transactions — inspections, rent, verification,
            and field work in one system.
          </p>
        </motion.div>

        <div
          className="mx-auto mt-16 [perspective:2000px]"
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.08, margin: "0px 0px 140px 0px" }}
          >
            {features.map((f) => (
              <motion.article
                key={f.title}
                variants={cardVariants}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={
                  reduceMotion
                    ? { y: -4 }
                    : {
                        rotateX: -8,
                        rotateY: 8,
                        y: -12,
                        z: 24,
                        transition: { type: "spring", stiffness: 360, damping: 26 },
                      }
                }
                style={{ transformStyle: "preserve-3d" }}
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/90 bg-gradient-to-b from-white/95 to-slate-50/40 p-6",
                  "shadow-[0_8px_40px_rgb(var(--rgb-ink)_/_0.08)] ring-1 ring-brand-blue/[0.06] backdrop-blur-md",
                  "transition-shadow duration-300 hover:shadow-[0_24px_64px_rgb(var(--rgb-primary)_/_0.14)]"
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t opacity-60 transition-opacity duration-500 group-hover:opacity-100",
                    f.accent
                  )}
                  aria-hidden
                />
                <div
                  className="absolute left-0 top-0 h-full w-1 origin-top scale-y-0 bg-gradient-to-b from-brand-blue via-sky-400 to-brand-teal transition-transform duration-300 group-hover:scale-y-100"
                  aria-hidden
                />
                <div
                  className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-white to-sky-50 shadow-inner ring-1 ring-brand-blue/15"
                  style={{ transform: "translateZ(28px)" }}
                >
                  <f.icon className="h-6 w-6 text-brand-blue drop-shadow-sm" aria-hidden />
                </div>
                <h3 className="relative font-display text-lg font-semibold text-brand-navy">
                  {f.title}
                </h3>
                <p className="relative mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {f.body}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
