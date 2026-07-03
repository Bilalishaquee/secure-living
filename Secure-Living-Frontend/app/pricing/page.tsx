import type { Metadata } from "next";
import { CheckCircle2, Tags } from "lucide-react";
import { PageShell, PageContainer } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { InfoCard, CtaPanel } from "@/components/marketing/InfoCard";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Pricing — ${SITE_NAME}`,
  description: "Simple, transparent plans for landlords, agencies, and property managers in Kenya.",
  alternates: { canonical: `${getSiteUrl()}/pricing` },
};

const plans = [
  {
    name: "Free",
    price: "KES 0",
    period: "forever",
    tagline: "For individual landlords getting started.",
    points: ["Property & unit listings", "Basic tenant records", "Help Centre access", "Up to 1 property"],
    cta: "Create free account",
    tag: undefined,
  },
  {
    name: "Self-Management",
    price: "KES 1,500",
    period: "/month",
    tagline: "For landlords managing their own portfolio.",
    points: ["Everything in Free", "Rent collection & receipts", "Lease creation & e-signing", "Move-in/move-out inspections", "Service request tracking"],
    cta: "Start Self-Management",
    tag: { label: "Most Popular", variant: "info" as const },
  },
  {
    name: "Professional Management",
    price: "KES 5,000",
    period: "/month",
    tagline: "For agencies and property managers running multiple portfolios.",
    points: ["Everything in Self-Management", "Team roles & permissions", "Multi-property dashboards", "Deposit escrow & deduction workflows", "Compliance number issuance"],
    cta: "Start Professional",
    tag: undefined,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "For larger operators needing multi-organization control.",
    points: ["Everything in Professional", "Multi-organization & branch controls", "Advanced RBAC & audit trails", "Marketplace & service provider operations", "Dedicated support routing"],
    cta: "Talk to us",
    tag: { label: "Enterprise", variant: "neutral" as const },
  },
];

export default function PricingPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Pricing"
        icon={Tags}
        title="Simple, transparent pricing"
        subtitle="Whether you manage one unit or a whole portfolio, there's a plan that fits."
        tags={[{ label: "Prices may change", variant: "info" }]}
        meta="Prices are current starting rates — your organization admin can review live pricing at any time from Commercial Readiness."
      />

      <PageContainer className="py-14 sm:py-20">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <InfoCard key={plan.name} title={plan.name} tag={plan.tag} className={plan.tag?.variant === "info" ? "border-brand-blue/40 ring-1 ring-brand-blue/15" : undefined}>
              <p className="text-xs text-slate-500">{plan.tagline}</p>
              <p className="mt-3">
                <span className="text-2xl font-bold text-brand-blue">{plan.price}</span>
                {plan.period && <span className="ml-1 text-sm text-slate-500">{plan.period}</span>}
              </p>
              <ul className="mt-5 space-y-2.5">
                {plan.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {point}
                  </li>
                ))}
              </ul>
              <a
                href="/auth/register?role=landlord"
                className={`mt-6 flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                  plan.tag?.variant === "info"
                    ? "bg-brand-blue text-white hover:bg-brand-blue/90"
                    : "border border-slate-200 text-slate-700 hover:border-brand-blue/40 hover:text-brand-blue"
                }`}
              >
                {plan.cta}
              </a>
            </InfoCard>
          ))}
        </div>

        <div className="mt-12">
          <CtaPanel
            title="Not sure which plan fits your portfolio?"
            subtitle="Talk to us and we'll help you pick the right one."
            primary={{ label: "Contact Sales", href: "/contact" }}
            secondary={{ label: "Compare with Demo", href: "/demo" }}
          />
        </div>
      </PageContainer>
    </PageShell>
  );
}
