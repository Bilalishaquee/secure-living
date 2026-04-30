"use client";

import Link from "next/link";
import { useId } from "react";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  Building2,
  Clock,
  Home,
  KeyRound,
  Shield,
  Sparkles,
  Wallet,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getConsultationMailto, getWhatsAppHref } from "@/lib/contact";
import { marketing } from "@/lib/marketing-copy";
import { cn } from "@/lib/utils";

const orbitIcons = [
  {
    rotate: -90,
    Icon: Shield,
    box: "bg-gradient-to-br from-sky-500/40 to-blue-700/35 shadow-[0_0_20px_rgb(59_130_246_/_0.25)]",
    glow: "bg-sky-500",
  },
  {
    rotate: 0,
    Icon: Wallet,
    box: "bg-gradient-to-br from-slate-600/50 to-slate-800/45 shadow-[0_0_16px_rgb(0_0_0_/_0.25)]",
    glow: "bg-slate-500",
  },
  {
    rotate: 90,
    Icon: Home,
    box: "bg-gradient-to-br from-blue-500/40 to-blue-700/35 shadow-[0_0_20px_rgb(59_130_246_/_0.25)]",
    glow: "bg-blue-500",
  },
  {
    rotate: 180,
    Icon: KeyRound,
    box: "bg-gradient-to-br from-cyan-500/35 to-blue-600/30 shadow-[0_0_18px_rgb(14_165_233_/_0.22)]",
    glow: "bg-cyan-500",
  },
] as const;

function HeroHouseIllustration({ idPrefix }: { idPrefix: string }) {
  const roof = `${idPrefix}-roof`;
  const body = `${idPrefix}-body`;
  const stroke = `${idPrefix}-stroke`;
  const window = `${idPrefix}-window`;
  return (
    <svg
      viewBox="0 0 120 100"
      className="h-[5.5rem] w-32 sm:h-32 sm:w-36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={roof} x1="12" y1="8" x2="108" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id={body} x1="12" y1="44" x2="108" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#64748b" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id={stroke} x1="0" y1="0" x2="120" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#60a5fa" />
        </linearGradient>
        <linearGradient id={window} x1="48" y1="62" x2="72" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f1f5f9" />
          <stop offset="1" stopColor="#93c5fd" />
        </linearGradient>
      </defs>
      <path
        d="M12 44h96v46H80V62H40v28H12V44z"
        fill={`url(#${body})`}
        fillOpacity={0.55}
      />
      <path d="M60 8L12 44h96L60 8z" fill={`url(#${roof})`} fillOpacity={0.85} />
      <path
        d="M60 8L12 44v46h28V62h40v28h28V44L60 8z"
        fill="none"
        stroke={`url(#${stroke})`}
        strokeWidth={2.75}
        strokeLinejoin="round"
      />
      <rect x="48" y="62" width="24" height="28" rx="2" fill={`url(#${window})`} opacity={0.92} />
    </svg>
  );
}

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "");

  const leftContainer: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.045,
        delayChildren: reduceMotion ? 0 : 0.03,
      },
    },
  };

  const leftItem: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.38,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section
      id="hero"
      className="bg-hero-marketing-link1 relative scroll-mt-24 overflow-hidden pt-24 pb-16 lg:scroll-mt-28 lg:pt-28 lg:pb-24"
    >
      <div className="pointer-events-none absolute inset-0 hero-link1-radial-accent" aria-hidden />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          <motion.div
            variants={leftContainer}
            initial="hidden"
            animate="show"
            className="text-left"
          >
            <motion.p
              variants={leftItem}
              className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55"
            >
              {marketing.hero.badge}
            </motion.p>

            <motion.div variants={leftItem} className="mt-5">
              <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
                <span className="block text-white">{marketing.hero.headline}</span>
                <span className="text-gradient-hero-link1 mt-1 block sm:mt-2">
                  {marketing.hero.headlineAccent}
                </span>
              </h1>
            </motion.div>

            <motion.p
              variants={leftItem}
              className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg"
            >
              {marketing.hero.subhead}
            </motion.p>

            <motion.div
              variants={leftItem}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            >
              <Button
                asChild
                size="lg"
                className="h-12 w-full min-w-[200px] rounded-xl border-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-blue-600 px-8 text-base font-semibold capitalize text-white shadow-md hover:brightness-105 sm:w-auto"
              >
                <a href={getConsultationMailto()}>{marketing.hero.ctaPrimary}</a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-xl border-2 border-white/90 bg-transparent px-8 text-base font-medium text-white hover:bg-white/10 sm:w-auto"
              >
                <a href={getWhatsAppHref()} target="_blank" rel="noopener noreferrer">
                  {marketing.hero.ctaSecondary}
                </a>
              </Button>
            </motion.div>

            <motion.p variants={leftItem} className="mt-6 text-sm text-white/50">
              <Link
                href="/auth/register"
                className="font-medium text-sky-200 underline decoration-sky-300/50 underline-offset-2 transition-colors hover:decoration-sky-200"
              >
                {marketing.hero.ctaTertiary}
              </Link>
              <span className="text-white/40"> · </span>
              <Link
                href="/listings"
                className="font-medium text-sky-200/90 underline decoration-sky-300/40 underline-offset-2 transition-colors hover:text-sky-100"
              >
                {marketing.hero.browseListingsLabel}
              </Link>
              <span className="text-white/40"> · </span>
              <Link
                href="#command"
                className="text-white/70 underline decoration-white/25 underline-offset-2 hover:text-white"
              >
                Preview the platform
              </Link>
            </motion.p>

            <motion.div
              variants={leftItem}
              className="mt-12 flex flex-wrap items-center gap-6 text-white/35 sm:gap-10"
            >
              <Shield className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.25} aria-hidden />
              <Clock className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.25} aria-hidden />
              <Sparkles className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.25} aria-hidden />
              <Wrench className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.25} aria-hidden />
            </motion.div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.42,
              delay: reduceMotion ? 0 : 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative z-10 mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none"
          >
            <div className="relative mx-auto w-full max-w-md lg:max-w-lg" aria-hidden>
              <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 lg:text-left">
                Portfolio · Escrow · Motion
              </p>

              <div className="relative aspect-square max-h-[min(440px,78vw)] sm:max-h-[460px]">
                <div
                  className="pointer-events-none absolute -inset-[8%] rounded-full opacity-35 blur-3xl"
                  style={{
                    background:
                      "conic-gradient(from 200deg, rgb(59 130 246 / 0.5), rgb(14 165 233 / 0.45), rgb(59 130 246 / 0.5))",
                  }}
                />
                <div className="pointer-events-none absolute -left-2 top-[12%] h-28 w-28 rounded-full bg-sky-500/25 blur-2xl" />
                <div className="pointer-events-none absolute -right-2 bottom-[14%] h-32 w-32 rounded-full bg-blue-500/22 blur-2xl" />

                <span
                  className="pointer-events-none absolute h-2 w-2 rounded-full bg-white/50 shadow-[0_0_8px_rgb(255_255_255_/_0.35)] sm:h-2.5 sm:w-2.5"
                  style={{ left: "10%", top: "20%" }}
                />
                <span
                  className="pointer-events-none absolute h-2 w-2 rounded-full bg-sky-200/60 shadow-[0_0_8px_rgb(186_230_253_/_0.4)] sm:h-2.5 sm:w-2.5"
                  style={{ left: "86%", top: "26%" }}
                />
                <span
                  className="pointer-events-none absolute h-2 w-2 rounded-full bg-blue-200/50 shadow-[0_0_8px_rgb(191_219_254_/_0.35)] sm:h-2.5 sm:w-2.5"
                  style={{ left: "14%", top: "76%" }}
                />

                <div
                  className="pointer-events-none absolute inset-[4%] rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 90deg, transparent, rgb(59 130 246 / 0.22), transparent, rgb(14 165 233 / 0.22), transparent)",
                    maskImage:
                      "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px), black 100%, transparent 100%)",
                    WebkitMaskImage:
                      "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px), black 100%, transparent 100%)",
                  }}
                />

                <div
                  className={cn(
                    "pointer-events-none absolute inset-[10%] rounded-full border border-dashed border-white/18",
                    !reduceMotion && "hero-link1-dashed-ring"
                  )}
                />

                <div className="absolute inset-0 z-0 flex items-center justify-center overflow-visible">
                  <div
                    className={cn("relative h-0 w-0", !reduceMotion && "hero-link1-orbit-track")}
                  >
                    {orbitIcons.map(({ rotate, Icon, box, glow }) => (
                      <div
                        key={rotate}
                        className="absolute left-1/2 top-1/2"
                        style={{
                          transform: `translate(-50%, -50%) rotate(${rotate}deg) translateY(calc(-1 * min(7.5rem, 28vw)))`,
                        }}
                      >
                        <div
                          className={cn(
                            "relative flex h-[3.25rem] w-[3.25rem] items-center justify-center overflow-hidden rounded-2xl border border-white/25 shadow-lg backdrop-blur-md sm:h-16 sm:w-16",
                            box
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none absolute inset-0 opacity-60 blur-xl",
                              glow
                            )}
                            aria-hidden
                          />
                          <span className="relative drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                            <Icon className="h-6 w-6 text-white sm:h-7 sm:w-7" strokeWidth={2} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                  <motion.div
                    initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.4,
                      delay: reduceMotion ? 0 : 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="relative flex flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/25 bg-gradient-to-b from-white/18 via-white/8 to-blue-950/20 px-9 py-8 shadow-[0_0_0_1px_rgb(255_255_255_/_0.06)_inset,0_20px_48px_rgb(0_0_0_/_0.3),0_0_40px_rgb(59_130_246_/_0.15)] backdrop-blur-md sm:px-11 sm:py-9"
                  >
                    <div className="pointer-events-none absolute -left-6 top-2 h-20 w-20 rounded-full bg-sky-400/15 blur-2xl" />
                    <div className="pointer-events-none absolute -right-4 bottom-2 h-24 w-24 rounded-full bg-blue-500/12 blur-2xl" />
                    <HeroHouseIllustration idPrefix={uid} />
                    <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]">
                      <Building2
                        className="hero-kenya-live-neon-icon h-4 w-4 shrink-0"
                        aria-hidden
                      />
                      <span className="hero-kenya-live-neon">Kenya · Live</span>
                    </div>
                  </motion.div>
                </div>
              </div>

              <p className="mt-5 text-center text-sm leading-relaxed text-white/75 lg:text-left">
                <span className="font-medium text-white/90">Trust layers</span>
                <span className="text-white/55">
                  {" "}
                  — escrow, verified listings, keys, and homes in one orbit.
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
