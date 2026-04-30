"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Building2, Home, MapPinHouse } from "lucide-react";
import { LogoShield } from "@/components/brand/LogoShield";
import { formatKes } from "@/lib/utils";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <motion.aside
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative hidden overflow-hidden bg-gradient-to-b from-[#0f2038] via-[#16365c] to-[#0f2d4a] lg:flex lg:w-[42%] lg:flex-col lg:justify-between lg:p-12"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <Image
            src="/images/property/auth-estate.jpg"
            alt=""
            fill
            className="object-cover opacity-25"
            sizes="42vw"
            priority
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_0%_0%,rgb(59_130_246_/_0.35),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_100%,rgb(14_165_233_/_0.22),transparent_50%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f2038]/65 via-[#16365c]/70 to-[#0f2d4a]/85" />
          <div className="landing-dark-grid absolute inset-0 opacity-40" />
          <div className="gradient-orb-1 absolute -left-20 top-20 h-64 w-64 rounded-full bg-blue-500/35 blur-3xl" />
          <div className="gradient-orb-2 absolute bottom-10 right-0 h-72 w-72 rounded-full bg-sky-400/25 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />
        </div>
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex w-fit rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
            aria-label="Secure Living — home"
          >
            <LogoShield variant="light" size="lg" priority />
          </Link>
          <h1 className="font-display mt-10 max-w-md text-3xl font-semibold text-white">
            From land diligence to rent, returns, and growth.
          </h1>
          <p className="mt-4 text-sm text-white/70">
            One platform for partner agencies and owners: due diligence, construction oversight,
            property management, and portfolio visibility — built for Kenyan real estate.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-3">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-xl border border-white/15 bg-white/10 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.2)] backdrop-blur-md ring-1 ring-white/10"
          >
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-blue-100" />
              <p className="text-xs text-white/70">Homes under management</p>
            </div>
            <p className="mt-1 font-display text-xl font-semibold text-white">128</p>
          </motion.div>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
            className="rounded-xl border border-white/15 bg-white/10 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.2)] backdrop-blur-md ring-1 ring-white/10"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-100" />
              <p className="text-xs text-white/70">Monthly rent collected</p>
            </div>
            <p className="mt-1 font-display text-xl font-semibold text-white">{formatKes(1250450)}</p>
          </motion.div>
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.7, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
            className="rounded-xl border border-white/15 bg-white/10 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.2)] backdrop-blur-md ring-1 ring-white/10"
          >
            <div className="flex items-center gap-2">
              <MapPinHouse className="h-4 w-4 text-sky-100" />
              <p className="text-xs text-white/70">Occupancy rate</p>
            </div>
            <p className="mt-1 font-display text-xl font-semibold text-white">96%</p>
          </motion.div>
        </div>
      </motion.aside>
      <main className="relative flex flex-1 flex-col justify-center overflow-hidden px-4 py-10 pb-[max(2.5rem,var(--safe-bottom))] pt-[max(2.5rem,var(--safe-top))] font-sans sm:px-8 lg:px-16">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="landing-mesh-layer absolute inset-0 opacity-55" />
          <div className="hero-dot-grid absolute inset-0 opacity-35" />
          <motion.div
            className="absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-brand-blue/[0.1] blur-3xl"
            animate={{ y: [0, -16, 0], x: [0, -10, 0] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-brand-teal/[0.09] blur-3xl"
            animate={{ y: [0, 12, 0], x: [0, 12, 0] }}
            transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />
          <motion.div
            className="absolute left-[8%] top-[14%] h-32 w-32 rounded-full border border-brand-blue/20 bg-white/35 backdrop-blur-sm"
            animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[10%] bottom-[18%] h-24 w-24 rounded-full border border-brand-teal/20 bg-white/30 backdrop-blur-sm"
            animate={{ y: [0, 10, 0], rotate: [0, -8, 0] }}
            transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />
          <div className="absolute inset-y-0 right-[14%] w-px bg-gradient-to-b from-transparent via-brand-blue/20 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/35 to-transparent" />
        </div>
        <div className="relative z-10">
          <div className="mb-8 lg:hidden">
            <Link
              href="/"
              className="inline-flex w-fit rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2"
              aria-label="Secure Living — home"
            >
              <LogoShield variant="dark" size="md" />
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
