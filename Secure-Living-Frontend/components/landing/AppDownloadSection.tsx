"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { marketing } from "@/lib/marketing-copy";

export function AppDownloadSection() {
  const { appDownload } = marketing;

  return (
    <section className="border-b border-slate-200 bg-[#f4f5f7] py-14 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {appDownload.title}
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">{appDownload.subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400"
            >
              {appDownload.appleLabel}
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400"
            >
              {appDownload.googleLabel}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
