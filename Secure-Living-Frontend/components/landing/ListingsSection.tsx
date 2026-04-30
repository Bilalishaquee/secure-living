"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ListingCard } from "@/components/ui/ListingCard";
import { marketing } from "@/lib/marketing-copy";
import { mockListings } from "@/lib/mock-data";

export function ListingsSection() {
  const { listings } = marketing;
  const featured = mockListings.filter((l) => l.featured);
  const recent = mockListings.filter((l) => !l.featured).slice(0, 3);

  return (
    <section
      id="listings"
      className="scroll-mt-24 border-b border-slate-200 bg-white py-16 sm:scroll-mt-28 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{listings.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {listings.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {listings.subtitle}
          </p>
        </motion.div>

        <div className="mt-12">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            {listings.featuredLabel}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((l, i) => (
              <ListingCard key={l.id} listing={l} priority={i === 0} showFeatured />
            ))}
          </div>
        </div>

        <div className="mt-14">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            Recently added
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((l) => (
              <ListingCard key={l.id} listing={l} showFeatured />
            ))}
          </div>
        </div>

        <motion.div
          className="mt-12 flex justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 rounded-md bg-brand-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue/90"
          >
            {listings.viewAll}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
