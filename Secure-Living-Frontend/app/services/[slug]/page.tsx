"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2, Briefcase, Home, Scale, Palette, Sparkles, Wrench, BedDouble,
  ArrowLeft, CheckCircle2, Phone, Mail, MessageSquare, ChevronRight,
} from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { SITE_NAME } from "@/lib/site-config";

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

const EXTRA_CONTENT: Record<string, { bullets: string[]; steps?: { title: string; body: string }[] }> = {
  "due-diligence": {
    bullets: [
      "Title deed verification with Ministry of Lands",
      "Land Rate and Rent clearance checks",
      "Encumbrance and caveat searches",
      "Physical boundary verification & survey",
      "Ownership history and chain of title",
      "Fraud risk assessment report",
    ],
    steps: [
      { title: "Submit Property Details", body: "Provide the parcel number, title deed copy, and location. We handle everything from here." },
      { title: "Search & Verification", body: "Our team conducts official searches at the Lands Registry, KRA, county offices, and survey department." },
      { title: "Receive Your Report", body: "Get a comprehensive due diligence report within 5–10 working days, covering all risk areas." },
    ],
  },
  "foreigner-resettlement": {
    bullets: [
      "Pre-arrival property search & virtual tours",
      "Work permit and visa guidance (with partner lawyers)",
      "School and neighbourhood orientation",
      "Furnished apartment short-listing",
      "Airport pick-up and settling-in support",
      "Local SIM, bank account & utility setup",
    ],
    steps: [
      { title: "Discovery Call", body: "Tell us your timeline, budget, family size, and preferred areas. We create a personalised move plan." },
      { title: "Property Shortlisting", body: "Receive curated listings that match your requirements, with virtual or in-person tours arranged." },
      { title: "Move & Settle", body: "We're with you on arrival day and beyond — handling paperwork, introductions, and first-week essentials." },
    ],
  },
  "airbnb-management": {
    bullets: [
      "Professional photography and listing optimisation",
      "Dynamic pricing to maximise occupancy",
      "Guest communication and vetting",
      "Cleaning and linen changeovers",
      "Maintenance coordination and restocking",
      "Monthly performance reports & owner payouts",
    ],
    steps: [
      { title: "Onboard Your Property", body: "We photograph, furnish recommendations, and publish your listing on Airbnb, Booking.com, and more." },
      { title: "We Manage Everything", body: "From guest enquiries to check-out inspections — your property earns while you relax." },
      { title: "Get Paid Monthly", body: "Transparent monthly statements with net earnings transferred directly to your account." },
    ],
  },
};

type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
};

export default function ServiceSlugPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : Array.isArray(params.slug) ? params.slug[0] : "";

  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/service-categories`)
      .then((r) => r.ok ? r.json() : null)
      .then((j) => {
        if (j?.data) {
          const cats: ServiceCategory[] = j.data;
          setAllCategories(cats);
          const found = cats.find((c) => c.slug === slug) ?? null;
          setCategory(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleEnquire(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !form.name || !form.email || !form.message) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/service-enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: category.id,
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          message: form.message,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setForm({ name: "", email: "", phone: "", message: "" });
      }
    } finally {
      setSaving(false);
    }
  }

  const Icon = ICON_MAP[slug] ?? Building2;
  const gradient = GRADIENT_MAP[slug] ?? "from-slate-500 to-slate-700";
  const extra = EXTRA_CONTENT[slug];
  const others = allCategories.filter((c) => c.slug !== slug).slice(0, 4);

  return (
    <PublicLayout>
      <LandingNavbar />
      <main className="relative pt-[4.5rem] sm:pt-24">

        {/* Breadcrumb */}
        <div className="border-b border-slate-200 bg-white py-4">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/" className="hover:text-brand-blue">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href="/#supporting-services" className="hover:text-brand-blue">Services</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-slate-900">{loading ? "…" : (category?.name ?? "Not found")}</span>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          </div>
        ) : !category ? (
          <div className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
            <p className="text-lg font-medium text-slate-700">Service not found</p>
            <Link href="/#supporting-services" className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-blue hover:underline">
              <ArrowLeft className="h-4 w-4" /> View all services
            </Link>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_360px]">

              {/* Left: Service detail */}
              <div className="space-y-10">
                {/* Hero */}
                <div className="flex items-start gap-5">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
                    <Icon className="h-7 w-7 text-white" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{category.name}</h1>
                    {category.tagline && (
                      <p className="mt-2 text-lg text-slate-500">{category.tagline}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                {category.description && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                    <p className="leading-relaxed text-slate-700">{category.description}</p>
                  </div>
                )}

                {/* Extra bullets */}
                {extra?.bullets && (
                  <div>
                    <h2 className="mb-4 text-xl font-bold text-slate-900">What's included</h2>
                    <ul className="space-y-2.5">
                      {extra.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                          <span className="text-slate-700">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Process steps */}
                {extra?.steps && (
                  <div>
                    <h2 className="mb-6 text-xl font-bold text-slate-900">How it works</h2>
                    <ol className="space-y-6">
                      {extra.steps.map((step, i) => (
                        <li key={step.title} className="flex gap-4">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-bold text-white`}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">{step.title}</p>
                            <p className="mt-1 text-sm text-slate-500">{step.body}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Other services */}
                {others.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-xl font-bold text-slate-900">Other services</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {others.map((cat) => {
                        const OtherIcon = ICON_MAP[cat.slug] ?? Building2;
                        const otherGrad = GRADIENT_MAP[cat.slug] ?? "from-slate-500 to-slate-700";
                        return (
                          <Link
                            key={cat.id}
                            href={`/services/${cat.slug}`}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 transition-shadow hover:shadow-md"
                          >
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${otherGrad}`}>
                              <OtherIcon className="h-4 w-4 text-white" strokeWidth={1.8} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{cat.name}</p>
                              {cat.tagline && <p className="text-xs text-slate-500 line-clamp-1">{cat.tagline}</p>}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Enquiry form (sticky) */}
              <div className="lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  {submitted ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <CheckCircle2 className="mb-3 h-12 w-12 text-green-500" />
                      <p className="text-lg font-bold text-slate-900">Enquiry received!</p>
                      <p className="mt-1 text-sm text-slate-500">Our team will contact you within one business day.</p>
                      <button
                        onClick={() => setSubmitted(false)}
                        className="mt-4 text-sm font-semibold text-brand-blue hover:underline"
                      >
                        Send another enquiry
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-base font-bold text-slate-900">Get in touch</h3>
                      <p className="mt-1 mb-4 text-sm text-slate-500">
                        Fill in the form and a specialist will reach out within one business day.
                      </p>
                      <form onSubmit={handleEnquire} className="space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Full Name *</label>
                          <input
                            required
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Email Address *</label>
                          <input
                            required
                            type="email"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Phone / WhatsApp</label>
                          <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="+254 7XX XXX XXX"
                            value={form.phone}
                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Message *</label>
                          <textarea
                            required
                            rows={4}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="Tell us about your requirements…"
                            value={form.message}
                            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!form.name || !form.email || !form.message || saving}
                          className="w-full rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-blue/90 disabled:opacity-50"
                        >
                          {saving ? "Submitting…" : "Submit Enquiry"}
                        </button>
                      </form>

                      <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4">
                        <a
                          href="mailto:hello@secureliving.com"
                          className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-blue"
                        >
                          <Mail className="h-4 w-4 shrink-0" />
                          hello@secureliving.com
                        </a>
                        <a
                          href="tel:+254700000000"
                          className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-blue"
                        >
                          <Phone className="h-4 w-4 shrink-0" />
                          +254 700 000 000
                        </a>
                      </div>
                    </>
                  )}
                </div>

                {/* Trust badge */}
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <p className="text-xs text-slate-600">
                    All {SITE_NAME} service providers are vetted and covered under our satisfaction guarantee.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
      <LandingFooter />
    </PublicLayout>
  );
}
