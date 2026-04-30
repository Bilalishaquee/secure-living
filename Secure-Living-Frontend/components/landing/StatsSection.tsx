"use client";

import { motion } from "framer-motion";
import { marketing } from "@/lib/marketing-copy";

const stats = [
  { value: "500+", label: "Homes under management (roadmap)" },
  { value: "120+", label: "Diaspora & local clients (pilot)" },
  { value: "98%", label: "Payment success rate (target)" },
  { value: "340+", label: "Verified professionals (network)" },
] as const;

export function StatsSection() {
  return (
    <section
      id="stats"
      className="scroll-mt-24 border-b border-slate-200 bg-[#f4f5f7] py-14 sm:scroll-mt-28 sm:py-16"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            At a glance
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Milestones we are building toward as verification and escrow scale in-market.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="rounded-lg border border-slate-200 bg-white px-5 py-6 text-center shadow-sm"
            >
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-2 text-xs font-medium leading-snug text-slate-600 sm:text-sm">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
          {marketing.statsFootnote}
        </p>
      </div>
    </section>
  );
}
