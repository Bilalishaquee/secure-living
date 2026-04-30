"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { marketing } from "@/lib/marketing-copy";
import { cn } from "@/lib/utils";

export function StessaFeatureBandsSection() {
  const { featureBands } = marketing;

  return (
    <div className="bg-white">
      {featureBands.map((band, index) => {
        const reverse = index % 2 === 1;
        const htmlId =
          "scrollAnchor" in band && band.scrollAnchor === "command"
            ? "command"
            : band.id;

        return (
          <section
            key={band.id}
            id={htmlId}
            className={cn(
              "scroll-mt-24 border-b border-slate-200 py-16 sm:scroll-mt-28 sm:py-20 lg:py-24",
              index === 0 ? "border-t border-slate-200" : ""
            )}
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={cn(reverse && "lg:order-2")}>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.4 }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {band.eyebrow}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                      {band.title}
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-slate-600">{band.body}</p>
                    <Link
                      href={band.learnMoreHref}
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue transition-colors hover:text-brand-navy"
                    >
                      {band.learnMoreLabel}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: 0.05 }}
                  className={cn(reverse && "lg:order-1")}
                >
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
                    <Image
                      src={band.imageSrc}
                      alt={band.imageAlt}
                      width={1200}
                      height={720}
                      className="aspect-[5/3] w-full object-cover"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
