"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Building2, FileSearch, HardHat, TrendingUp } from "lucide-react";
import { marketing } from "@/lib/marketing-copy";
import { cn } from "@/lib/utils";

const icons = {
  land: FileSearch,
  build: HardHat,
  operate: Building2,
  grow: TrendingUp,
} as const;

export function ServicesSection() {
  const reduceMotion = useReducedMotion();
  const { services } = marketing;

  return (
    <section
      id="services"
      className="scroll-mt-24 border-b border-slate-200 bg-[#f4f5f7] py-16 sm:scroll-mt-28 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{services.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {services.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {services.subtitle}
          </p>
        </motion.div>

        <div className="mx-auto mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.items.map((item, index) => {
            const Icon = icons[item.id as keyof typeof icons] ?? Building2;
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{
                  duration: 0.4,
                  delay: reduceMotion ? 0 : index * 0.05,
                }}
                className={cn(
                  "flex h-full flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm",
                  "transition-shadow hover:shadow-md"
                )}
              >
                <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  {item.phase}
                </span>
                <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-white">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={item.learnMoreHref}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:text-brand-navy"
                >
                  Learn more
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400"
          >
            {services.viewAll}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
