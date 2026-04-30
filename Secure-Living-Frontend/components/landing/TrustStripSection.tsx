"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { marketing } from "@/lib/marketing-copy";

export function TrustStripSection() {
  const { trustStrip, socialProof } = marketing;

  return (
    <section
      id="trust"
      className="scroll-mt-24 border-b border-slate-200 bg-[#f4f5f7] py-14 sm:scroll-mt-28 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {trustStrip.eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-[2rem]">
            {trustStrip.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {trustStrip.subtitle}
          </p>
        </motion.div>

        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-6 sm:gap-10">
          {socialProof.ratings.map((r, i) => (
            <motion.div
              key={r.source}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="flex min-w-[140px] flex-col items-center rounded-lg border border-slate-200 bg-white px-5 py-4 text-center shadow-sm"
            >
              <div className="flex gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-brand-blue text-brand-blue sm:h-[18px] sm:w-[18px]"
                  />
                ))}
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{r.score}</p>
              <p className="text-xs font-semibold text-slate-800">{r.source}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{r.detail}</p>
            </motion.div>
          ))}
        </div>

        <motion.ul
          className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3 sm:gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {trustStrip.items.map((item) => (
            <li
              key={item.title}
              className="rounded-lg border border-slate-200 bg-white px-4 py-4 text-left shadow-sm sm:px-5"
            >
              <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{item.body}</p>
            </li>
          ))}
        </motion.ul>

        <p className="mx-auto mt-10 max-w-2xl text-center text-[11px] leading-relaxed text-slate-500 sm:text-xs">
          {socialProof.footnote}
        </p>
      </div>
    </section>
  );
}
