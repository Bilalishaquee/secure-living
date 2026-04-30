"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { marketing } from "@/lib/marketing-copy";

export function NewsletterSection() {
  const { newsletter } = marketing;
  const [done, setDone] = useState(false);

  return (
    <section
      id="newsletter"
      className="scroll-mt-24 border-t border-slate-200 bg-white py-14 sm:scroll-mt-28 sm:py-16"
    >
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {newsletter.title}
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">{newsletter.subtitle}</p>
        </motion.div>

        <form
          className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:items-stretch"
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={newsletter.placeholder}
            className="min-h-11 flex-1 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
          <button
            type="submit"
            disabled={done}
            className="min-h-11 rounded-md bg-brand-blue px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue/90 disabled:cursor-default disabled:opacity-70"
          >
            {done ? "Thanks!" : newsletter.button}
          </button>
        </form>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">{newsletter.disclaimer}</p>
      </div>
    </section>
  );
}
