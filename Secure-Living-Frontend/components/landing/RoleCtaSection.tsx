"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Home, KeyRound, Wrench } from "lucide-react";

const cards = [
  {
    id: "landlords",
    icon: Home,
    title: "For landlords",
    body: "Portfolio tools, escrow releases, and staff access — built for owners in Kenya and abroad.",
    cta: "Get started",
    href: "/auth/register",
  },
  {
    id: "tenants",
    icon: KeyRound,
    title: "For tenants",
    body: "Protected rent rails, KYC, and tenancy status without off-platform payment pressure.",
    cta: "Create account",
    href: "/auth/register",
  },
  {
    id: "professionals",
    icon: Wrench,
    title: "For professionals",
    body: "Join the verified network — matched work, milestones, and reputation you can prove.",
    cta: "Apply",
    href: "/auth/register",
  },
];

export function RoleCtaSection() {
  return (
    <section className="border-b border-slate-200 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Who Secure Living is for
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Verified listings and screened agents for buyers and sellers — then escrow-backed rent,
            maintenance, and field work for everyone on the deed or lease.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {cards.map((c, index) => {
            const Icon = c.icon;
            return (
              <motion.article
                key={c.id}
                id={c.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="flex flex-col rounded-lg border border-slate-200 bg-[#fafafa] p-6 shadow-sm sm:p-7"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{c.body}</p>
                <Link
                  href={c.href}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue/90"
                >
                  {c.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          className="mx-auto mt-14 max-w-3xl rounded-lg border border-brand-blue/20 bg-sky-50/70 px-6 py-8 text-center sm:px-10"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Start managing your portfolio with less effort
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
            Set up a property workflow in minutes — verification, listings, and escrow in one place.
          </p>
          <Link
            href="/auth/register"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-brand-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue/90"
          >
            Get started free
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
