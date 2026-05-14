"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Building2, Briefcase, Home, Scale, Palette, Sparkles, Wrench, BedDouble } from "lucide-react";


const ICON_MAP: Record<string, React.ElementType> = {
  "due-diligence": Scale,
  "foreigner-resettlement": Home,
  "property-valuation": Building2,
  "legal-advisory": Briefcase,
  "interior-design": Palette,
  "cleaning": Sparkles,
  "maintenance": Wrench,
  "airbnb-management": BedDouble,
};

const GRADIENT_MAP: Record<string, string> = {
  "due-diligence": "from-blue-500 to-blue-700",
  "foreigner-resettlement": "from-emerald-500 to-emerald-700",
  "property-valuation": "from-violet-500 to-violet-700",
  "legal-advisory": "from-amber-500 to-amber-700",
  "interior-design": "from-rose-500 to-rose-700",
  "cleaning": "from-teal-500 to-teal-700",
  "maintenance": "from-orange-500 to-orange-700",
  "airbnb-management": "from-sky-500 to-sky-700",
};

type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
};

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SupportingServicesSection() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    fetch(`/api/v1/service-categories`)
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (j?.data) setCategories(j.data); })
      .catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="bg-white py-24" id="supporting-services">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeUp className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-blue">Supporting Services</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need around your property
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            From due diligence to interior design — our network of verified professionals covers the full property lifecycle.
          </p>
        </FadeUp>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat, i) => {
            const Icon = ICON_MAP[cat.slug] ?? Building2;
            const gradient = GRADIENT_MAP[cat.slug] ?? "from-slate-500 to-slate-700";
            return (
              <FadeUp key={cat.id} delay={i * 0.06}>
                <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md`}>
                    <Icon className="h-5 w-5 text-white" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{cat.name}</h3>
                  {cat.tagline && (
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{cat.tagline}</p>
                  )}
                  <Link
                    href={`/services/${cat.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue transition-all group-hover:gap-3"
                  >
                    Learn more <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              </FadeUp>
            );
          })}
        </div>

        <FadeUp delay={0.3} className="mt-12 text-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-blue hover:shadow-md"
          >
            Get started with our services <ArrowRight className="h-4 w-4" />
          </Link>
        </FadeUp>
      </div>
    </section>
  );
}
