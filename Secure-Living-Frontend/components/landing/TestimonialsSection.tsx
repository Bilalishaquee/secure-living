"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { marketing } from "@/lib/marketing-copy";

export function TestimonialsSection() {
  const { testimonials } = marketing;

  return (
    <section
      id="testimonials"
      className="scroll-mt-24 border-b border-slate-200 bg-white py-16 sm:scroll-mt-28 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {testimonials.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {testimonials.title}
          </h2>
          <p className="mx-auto mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            {testimonials.subtitle}
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
          {testimonials.items.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex h-full flex-col rounded-lg border border-slate-200 bg-[#fafafa] p-6 shadow-sm"
            >
              <div className="flex gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-6 border-t border-slate-200 pt-4">
                <cite className="not-italic">
                  <span className="block text-sm font-semibold text-slate-900">{t.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{t.location}</span>
                </cite>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
