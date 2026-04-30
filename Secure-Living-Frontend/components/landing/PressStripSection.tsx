"use client";

import { motion } from "framer-motion";
import { marketing } from "@/lib/marketing-copy";

export function PressStripSection() {
  const { press } = marketing;

  return (
    <section
      id="press"
      className="scroll-mt-24 border-b border-slate-200 bg-[#f4f5f7] py-14 sm:scroll-mt-28 sm:py-16"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4 }}
          className="text-center text-lg font-semibold text-slate-900 sm:text-xl"
        >
          {press.title}
        </motion.h2>
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
          {press.outlets.map((name, i) => (
            <motion.li
              key={name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="text-center"
            >
              <span className="text-sm font-semibold tracking-wide text-slate-400">{name}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
