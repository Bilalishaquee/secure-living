import type { Metadata } from "next";
import Image from "next/image";
import { Fragment } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Check,
  Home,
  Info,
  MapPin,
  Megaphone,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { getSiteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Pricing - Secure Living Systems",
  description: "Complete plan comparison for Secure Living Systems landlords, agencies, property managers, and enterprise organisations.",
  alternates: { canonical: `${getSiteUrl()}/pricing` },
};

const planCards = [
  {
    name: "Community",
    subtitle: "For individuals getting started",
    price: "KES 0",
    suffix: "/month",
    badge: "FREE FOREVER",
    tone: "green",
    icon: Users,
    capacity: "15 Property Capacity (slots)",
    capacitySub: "Use for managed units, listings, or both.",
    units: "Up to 15",
    listings: "Up to 5",
    features: ["Secure Living Verified ID (Trust Credential)", "Help Centre Access"],
    cta: "Get Started Free",
    ctaHref: "/auth/register?role=landlord&plan=community",
    footnote: "No credit card required",
  },
  {
    name: "Growth",
    subtitle: "For growing landlords",
    price: "KES 1,500",
    suffix: "/month",
    billing: "Billed monthly",
    annual: "KES 14,400 /year",
    savings: "Save KES 3,600 (20%)",
    tag: "MOST POPULAR",
    tone: "blue",
    icon: Megaphone,
    capacity: "50 Property Capacity (slots)",
    capacitySub: "Use for managed units, listings, or both.",
    units: "Up to 50",
    listings: "Up to 50",
    features: ["Secure Living Verified ID (Trust Credential)", "14-day free trial", "Cancel anytime"],
    cta: "Start Free Trial",
    ctaHref: "/auth/register?role=landlord&plan=growth",
  },
  {
    name: "Professional",
    subtitle: "For agencies & property managers",
    price: "KES 3,500",
    suffix: "/month",
    billing: "Billed monthly",
    annual: "KES 33,600 /year",
    savings: "Save KES 8,400 (20%)",
    tone: "purple",
    icon: BriefcaseBusiness,
    capacity: "250 Property Capacity (slots)",
    capacitySub: "Use for managed units, listings, or both.",
    units: "Up to 250",
    listings: "Up to 250",
    features: ["Secure Living Verified ID (Trust Credential)", "14-day free trial", "Cancel anytime"],
    cta: "Start Free Trial",
    ctaHref: "/auth/register?role=manager&plan=professional",
  },
  {
    name: "Enterprise",
    subtitle: "For large organisations and institutions",
    price: "Custom Pricing",
    suffix: "",
    badge: "CUSTOM QUOTE",
    tone: "orange",
    icon: Building2,
    capacity: "Unlimited Property Capacity",
    capacitySub: "Use for managed units, listings, or both.",
    units: "Unlimited",
    listings: "Unlimited",
    features: ["Secure Living Verified ID (Trust Credential)", "14-day free trial", "Tailored onboarding"],
    cta: "Request a Demo",
    ctaHref: "/demo",
    footnote: "We'll build the right solution for you.",
  },
];

const planColumns = [
  { key: "community", label: "COMMUNITY", sub: "(Free)", color: "bg-emerald-700" },
  { key: "growth", label: "GROWTH", sub: "(KES 1,500/mo)", color: "bg-blue-700" },
  { key: "professional", label: "PROFESSIONAL", sub: "(KES 3,500/mo)", color: "bg-violet-700" },
  { key: "enterprise", label: "ENTERPRISE", sub: "(Custom)", color: "bg-orange-600" },
] as const;

type PlanKey = (typeof planColumns)[number]["key"];
type FeatureValue = string | boolean;

const tableSections: Array<{
  title?: string;
  icon?: typeof Home;
  accent?: string;
  rows: Array<{ feature: string; values: Record<PlanKey, FeatureValue> }>;
}> = [
  {
    rows: [
      { feature: "Monthly Price", values: { community: "KES 0", growth: "KES 1,500", professional: "KES 3,500", enterprise: "Custom Quote" } },
      {
        feature: "Annual Billing (Save 20%)",
        values: {
          community: "-",
          growth: "KES 14,400/year\nSave KES 3,600",
          professional: "KES 33,600/year\nSave KES 8,400",
          enterprise: "Custom",
        },
      },
      { feature: "Free Trial", values: { community: "-", growth: "14 days", professional: "14 days", enterprise: "14 days" } },
      { feature: "Property Capacity (Slots)", values: { community: "15", growth: "50", professional: "250", enterprise: "Unlimited" } },
      { feature: "Managed Units", values: { community: "Up to 15", growth: "Up to 50", professional: "Up to 250", enterprise: "Unlimited" } },
      { feature: "Active Listings", values: { community: "Up to 5", growth: "Up to 50", professional: "Up to 250", enterprise: "Unlimited" } },
    ],
  },
  {
    title: "CORE PROPERTY MANAGEMENT",
    icon: Home,
    accent: "text-blue-700",
    rows: [
      { feature: "Property & Unit Records", values: { community: true, growth: true, professional: true, enterprise: true } },
      { feature: "Tenant & Lease Records", values: { community: true, growth: true, professional: true, enterprise: true } },
      { feature: "Rent Tracking & Reminders", values: { community: true, growth: true, professional: true, enterprise: true } },
      { feature: "Maintenance Requests", values: { community: true, growth: true, professional: true, enterprise: true } },
      { feature: "QR Property Verification", values: { community: true, growth: true, professional: true, enterprise: true } },
      { feature: "Basic Reports", values: { community: true, growth: true, professional: true, enterprise: true } },
      { feature: "Help Centre Access", values: { community: true, growth: true, professional: true, enterprise: true } },
    ],
  },
  {
    title: "COMMUNICATION & AUTOMATION",
    icon: Smartphone,
    accent: "text-blue-700",
    rows: [
      { feature: "Digital Lease Creation & E-signing", values: { community: false, growth: true, professional: true, enterprise: true } },
      { feature: "WhatsApp & SMS Notifications", values: { community: false, growth: true, professional: true, enterprise: true } },
      { feature: "Digital Document Storage (5GB)", values: { community: false, growth: true, professional: true, enterprise: true } },
      { feature: "Advanced Reports & Analytics", values: { community: false, growth: true, professional: true, enterprise: true } },
      { feature: "Priority Email Support", values: { community: false, growth: true, professional: true, enterprise: true } },
    ],
  },
  {
    title: "BUSINESS OPERATIONS",
    icon: Users,
    accent: "text-violet-700",
    rows: [
      { feature: "Additional Users", values: { community: "1 User", growth: "Up to 5 Users", professional: "Unlimited Users", enterprise: "Unlimited Users" } },
      { feature: "Roles & Permissions", values: { community: "Basic", growth: "Basic", professional: "Advanced", enterprise: "Enterprise RBAC" } },
      { feature: "Multi-Branch / Office Management", values: { community: false, growth: false, professional: true, enterprise: true } },
      { feature: "Deposit Escrow Management", values: { community: "Basic", growth: "Basic", professional: "Advanced", enterprise: "Enterprise" } },
      { feature: "Secure Living Verified ID (Trust Credential)", values: { community: true, growth: true, professional: true, enterprise: true } },
      { feature: "Analytics & Dashboards", values: { community: "Basic", growth: "Standard", professional: "Advanced", enterprise: "Business Intelligence" } },
      { feature: "Support", values: { community: "Help Centre", growth: "Email & WhatsApp", professional: "Priority Phone & WhatsApp", enterprise: "Dedicated Success Manager" } },
    ],
  },
  {
    title: "ENTERPRISE & INTEGRATIONS",
    icon: Building2,
    accent: "text-orange-600",
    rows: [
      { feature: "Multi-Organisation Management", values: { community: false, growth: false, professional: false, enterprise: true } },
      { feature: "Advanced RBAC & Audit Logs", values: { community: false, growth: false, professional: false, enterprise: true } },
      { feature: "API Access & Integrations", values: { community: false, growth: false, professional: false, enterprise: true } },
      { feature: "Compliance & Regulatory Tools", values: { community: true, growth: true, professional: true, enterprise: true } },
      { feature: "Dedicated Account Manager", values: { community: false, growth: false, professional: false, enterprise: true } },
      { feature: "SLA-backed Premium Support", values: { community: false, growth: false, professional: false, enterprise: true } },
      { feature: "Custom Reporting & BI", values: { community: false, growth: false, professional: false, enterprise: true } },
      { feature: "White-label Options", values: { community: false, growth: false, professional: false, enterprise: true } },
    ],
  },
];

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Secure & Compliant",
    text: "Your data is protected with enterprise-grade security and compliance.",
  },
  {
    icon: Smartphone,
    title: "Access Anywhere",
    text: "Manage your properties on the web or mobile, anytime, anywhere.",
  },
  {
    icon: Users,
    title: "Trusted by Thousands",
    text: "Thousands of landlords and property managers trust us across Africa.",
  },
  {
    icon: MapPin,
    title: "Built for Africa",
    text: "Local support, payments and compliance built for Africa.",
  },
];

const toneClasses: Record<string, { card: string; text: string; soft: string; button: string; outline: string }> = {
  green: {
    card: "border-emerald-100 bg-emerald-50/20",
    text: "text-emerald-700",
    soft: "bg-emerald-50 text-emerald-700",
    button: "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
    outline: "border-emerald-200",
  },
  blue: {
    card: "border-blue-300 bg-blue-50/20 shadow-blue-100",
    text: "text-blue-700",
    soft: "bg-blue-50 text-blue-700",
    button: "bg-blue-700 text-white hover:bg-blue-800",
    outline: "border-blue-400",
  },
  purple: {
    card: "border-violet-100 bg-violet-50/20",
    text: "text-violet-700",
    soft: "bg-violet-50 text-violet-700",
    button: "bg-violet-700 text-white hover:bg-violet-800",
    outline: "border-violet-200",
  },
  orange: {
    card: "border-orange-100 bg-orange-50/30",
    text: "text-orange-600",
    soft: "bg-orange-50 text-orange-600",
    button: "border-orange-300 text-orange-600 hover:bg-orange-50",
    outline: "border-orange-200",
  },
};

function FeatureMark({ value }: { value: FeatureValue }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 stroke-[3] text-emerald-700" aria-label="Included" />;
  }
  if (value === false) {
    return <X className="mx-auto h-4 w-4 stroke-[3] text-red-600" aria-label="Not included" />;
  }

  return (
    <span className="whitespace-pre-line text-center text-[10px] font-extrabold leading-tight text-[#071b62]">
      {value}
    </span>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f5f8ff] p-2 text-[#071b62] sm:p-4">
      <div className="mx-auto grid max-w-[1900px] gap-3 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-md border border-blue-100 bg-white px-5 py-5 shadow-sm sm:px-8">
          <header className="flex items-center gap-4">
            <Image src="/l1.png" alt="Secure Living Systems" width={72} height={72} className="h-16 w-16 object-contain" priority />
            <div>
              <p className="text-3xl font-black leading-none text-[#071b62]">Secure Living Systems</p>
              <p className="mt-1 text-lg font-extrabold text-blue-700">Africa's Trusted Property Ecosystem</p>
            </div>
          </header>

          <div className="mx-auto mt-2 max-w-4xl text-center">
            <h1 className="text-4xl font-black leading-tight text-[#071b62] sm:text-5xl">
              Plans that fit every landlord,
              <br />
              grow with every portfolio.
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg font-semibold leading-snug text-blue-700/70">
              Manage properties. List what's vacant. Build trust.
              <br />
              Grow your real estate business - all in one platform.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {planCards.map((plan) => {
              const Icon = plan.icon;
              const tone = toneClasses[plan.tone];
              return (
                <article key={plan.name} className={`relative rounded-xl border bg-white p-4 shadow-sm ${tone.card} ${plan.tag ? "ring-2 ring-blue-500/60" : ""}`}>
                  {plan.tag ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md bg-blue-700 px-5 py-1 text-[11px] font-black text-white shadow-sm">
                      {plan.tag}
                    </div>
                  ) : null}
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${tone.soft}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="mt-3 text-center">
                    <h2 className={`text-2xl font-black ${tone.text}`}>{plan.name}</h2>
                    <p className="mx-auto mt-1 min-h-[36px] max-w-[150px] text-xs font-bold leading-tight text-[#071b62]">{plan.subtitle}</p>
                    <p className={`mt-4 text-3xl font-black ${tone.text}`}>
                      {plan.price}
                      {plan.suffix ? <span className="text-xs font-extrabold text-[#071b62]"> {plan.suffix}</span> : null}
                    </p>
                    {plan.billing ? <p className="mt-1 text-xs font-bold text-[#071b62]">{plan.billing}</p> : null}
                    {plan.annual ? (
                      <div className={`mx-auto mt-4 rounded-lg px-3 py-2 text-xs font-black ${tone.soft}`}>
                        <p>{plan.annual}</p>
                        <p>{plan.savings}</p>
                      </div>
                    ) : (
                      <div className={`mx-auto mt-4 inline-flex rounded-md px-4 py-1 text-xs font-black ${tone.soft}`}>{plan.badge}</div>
                    )}
                  </div>

                  <div className={`mt-5 rounded-lg border ${tone.outline} bg-white/70 p-3 text-xs font-bold leading-tight`}>
                    <p className={tone.text}>{plan.capacity}</p>
                    <p className="mt-1 text-[#071b62]">{plan.capacitySub}</p>
                    <div className="mt-4 space-y-3">
                      <p className="flex items-start gap-2">
                        <Building2 className={`h-5 w-5 ${tone.text}`} />
                        <span>
                          <strong>{plan.units}</strong>
                          <br />
                          Managed Units
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Megaphone className={`h-5 w-5 ${tone.text}`} />
                        <span>
                          <strong>{plan.listings}</strong>
                          <br />
                          Active Listings
                        </span>
                      </p>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2 text-xs font-bold leading-snug">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 rounded-full ${tone.text}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a href={plan.ctaHref} className={`mt-5 flex h-12 items-center justify-center rounded-lg border px-3 text-sm font-black transition ${tone.button}`}>
                    {plan.cta}
                  </a>
                  {plan.footnote ? <p className="mt-2 text-center text-[11px] font-bold text-blue-700/70">{plan.footnote}</p> : null}
                </article>
              );
            })}
          </div>

          <div className="mt-7 grid rounded-xl border border-blue-100 bg-white shadow-sm sm:grid-cols-4">
            {trustItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={`flex gap-3 p-4 ${index ? "border-t border-blue-100 sm:border-l sm:border-t-0" : ""}`}>
                  <Icon className="mt-1 h-7 w-7 shrink-0 text-blue-700" />
                  <div>
                    <p className="text-sm font-black text-[#071b62]">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-snug text-blue-700/70">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <CapacityNote />
        </section>

        <section className="rounded-md border border-blue-100 bg-white px-4 py-5 shadow-sm sm:px-5">
          <h2 className="text-center text-3xl font-black text-[#071b62]">Secure Living Systems - Complete Plan Comparison</h2>

          <div className="mt-5 overflow-hidden rounded-lg border border-blue-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th className="w-[215px] bg-[#06135b] px-4 py-4 text-left text-sm font-black text-white">FEATURES</th>
                    {planColumns.map((plan) => (
                      <th key={plan.key} className={`${plan.color} px-3 py-3 text-center text-sm font-black leading-tight text-white`}>
                        {plan.label}
                        <br />
                        <span className="text-xs">{plan.sub}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableSections.map((section, sectionIndex) => (
                    <Fragment key={section.title ?? "pricing-summary"}>
                      {section.title ? (
                        <tr key={`${section.title}-head`}>
                          <td colSpan={5} className="border-y border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-[#071b62]">
                            <span className="flex items-center gap-2">
                              {section.icon ? <section.icon className={`h-5 w-5 ${section.accent}`} /> : null}
                              {section.title}
                            </span>
                          </td>
                        </tr>
                      ) : null}
                      {section.rows.map((row) => (
                        <tr key={`${sectionIndex}-${row.feature}`} className="odd:bg-white even:bg-slate-50/40">
                          <td className="border border-blue-100 px-3 py-2 font-extrabold text-[#071b62]">{row.feature}</td>
                          {planColumns.map((plan) => (
                            <td key={plan.key} className="border border-blue-100 px-2 py-2 text-center align-middle">
                              <FeatureMark value={row.values[plan.key]} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <CapacityNote />
        </section>
      </div>
    </main>
  );
}

function CapacityNote() {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-800">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
        <Info className="h-5 w-5" />
      </span>
      <p>
        <strong>Property Capacity (Slots):</strong> Use your slots for managed units, active listings, or any combination.
        <br />
        Example: 10 managed units + 5 listings = 15 slots used.
      </p>
    </div>
  );
}
