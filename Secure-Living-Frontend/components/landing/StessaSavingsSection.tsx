"use client";

import { motion } from "framer-motion";
import { marketing } from "@/lib/marketing-copy";

export function StessaSavingsSection() {
  const { savingsHighlight } = marketing;

  return (
    <section
      id="savings"
      className="scroll-mt-24 border-y border-slate-200 bg-white py-14 sm:scroll-mt-28 sm:py-16"
    >
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.45 }}
          className="text-2xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-[1.65rem] sm:leading-snug"
        >
          {savingsHighlight.lead}{" "}
          <strong className="font-semibold text-brand-blue">{savingsHighlight.amount}</strong>{" "}
          {savingsHighlight.middle}{" "}
          <strong className="font-semibold text-brand-blue">{savingsHighlight.time}</strong>{" "}
          {savingsHighlight.trail}
        </motion.h2>
        <p className="mx-auto mt-4 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
          {savingsHighlight.footnote}
        </p>
      </div>
    </section>
  );
}
