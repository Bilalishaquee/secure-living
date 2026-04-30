"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useReducedMotion } from "framer-motion";
import { Building2, Cpu, FileSearch, HardHat, LineChart, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: FileSearch,
    title: "Land & due diligence",
    body: "Acquire land with structured title checks, encumbrance review, and risk disclosure before you commit.",
  },
  {
    icon: HardHat,
    title: "Construction oversight",
    body: "Milestone-based site visibility, contractor coordination, and quality gates from breaking ground to handover.",
  },
  {
    icon: Building2,
    title: "Property management",
    body: "Tenant lifecycle, maintenance, rent, and reporting once the asset is income-producing or occupied.",
  },
  {
    icon: LineChart,
    title: "Growth & returns",
    body: "Track performance, refinancing and exit options, and reinvestment — asset growth with clear numbers.",
  },
];

export function PlatformJourneySection() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from(".journey-step", {
        x: -32,
        opacity: 0,
        duration: 0.65,
        stagger: 0.09,
        ease: "power2.out",
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
      id="lifecycle"
      className="relative overflow-hidden bg-gradient-to-b from-[var(--sidebar-deep)] via-brand-navy to-[var(--sidebar-bg)] py-28 text-white"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 15% 0%, rgb(var(--rgb-primary) / 0.35), transparent 50%), radial-gradient(ellipse 60% 45% at 90% 100%, rgb(var(--rgb-accent) / 0.2), transparent 50%)",
          }}
        />
        <div className="landing-dark-grid absolute inset-0 opacity-50" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative mb-12 overflow-hidden rounded-2xl border border-white/20 shadow-[0_16px_48px_rgba(0,0,0,0.28)]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src="/images/property/auth-estate.jpg"
            alt="Land diligence through construction, management, and portfolio returns"
            width={1600}
            height={520}
            className="h-40 w-full object-cover sm:h-48"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#081426]/75 via-[#081426]/45 to-transparent" />
          <p className="absolute bottom-4 left-4 max-w-xl text-sm font-medium text-white/90 sm:bottom-5 sm:left-5 sm:text-base">
            Land → construction → management → returns: the full asset cycle on one platform.
          </p>
        </motion.div>

        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/90">
            <Cpu className="h-4 w-4 text-sky-300" aria-hidden />
            Platform cycle
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            From{" "}
            <span className="bg-gradient-to-r from-sky-200 via-white to-brand-blue-light bg-clip-text text-transparent">
              land to lasting returns
            </span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
            The journey our clients described: due diligence at acquisition, disciplined build
            oversight, steady operations, then measurable asset growth.
          </p>
        </motion.div>

        <div className="relative mt-16">
          <div className="landing-journey-frame pointer-events-none absolute bottom-10 left-4 right-4 top-10 hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-[2px] lg:block" />
          <div
            className="pointer-events-none absolute bottom-12 left-[10%] right-[10%] top-12 hidden rounded-3xl lg:block"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgb(var(--rgb-primary-light) / 0.08) 50%, transparent 100%)",
            }}
            aria-hidden
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.article
                  key={step.title}
                  className="journey-step group relative rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.25)] backdrop-blur-md"
                  style={{ transformStyle: "preserve-3d" }}
                  whileHover={
                    reduceMotion
                      ? { y: -4 }
                      : {
                          rotateX: -5,
                          rotateY: idx % 2 === 0 ? 5 : -5,
                          y: -8,
                          z: 18,
                          transition: { type: "spring", stiffness: 280, damping: 20 },
                        }
                  }
                >
                  <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background:
                          "linear-gradient(135deg, rgb(var(--rgb-primary-light) / 0.12) 0%, transparent 55%)",
                      }}
                    />
                  </div>
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-white/15 to-white/5 shadow-inner ring-1 ring-white/10">
                    <Icon className="h-5 w-5 text-sky-300" aria-hidden />
                  </div>
                  <p className="relative mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200/70">
                    Step {idx + 1}
                  </p>
                  <h3 className="relative mt-1 font-display text-lg font-semibold sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-white/75">{step.body}</p>
                </motion.article>
              );
            })}
          </div>
        </div>

        <p className="mt-12 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] font-medium uppercase tracking-widest text-white/40">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Due diligence · construction milestones · escrow-ready operations
        </p>
      </div>
    </section>
  );
}
