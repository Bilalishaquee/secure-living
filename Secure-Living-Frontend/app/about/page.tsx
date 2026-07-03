import type { Metadata } from "next";
import { ShieldCheck, Eye, MapPin, Scale, Compass, Users } from "lucide-react";
import { PageShell, PageContainer } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { InfoCard, CtaPanel } from "@/components/marketing/InfoCard";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `About Us — ${SITE_NAME}`,
  description:
    "Secure Living exists to solve Kenya's rental trust problem — verified listings, screened professionals, and escrow-backed transactions from consult to sale.",
  alternates: { canonical: `${getSiteUrl()}/about` },
};

const approach = [
  {
    icon: ShieldCheck,
    title: "Verify first",
    body: "Property details, ownership documentation, and professional credentials are checked before anything goes live on the platform.",
  },
  {
    icon: Eye,
    title: "Protect the money",
    body: "Deposits and milestone payments run through escrow-backed workflows with a visible audit trail, not a handshake and a bank transfer.",
  },
  {
    icon: Compass,
    title: "Keep it on-platform",
    body: "Applications, lease offers, disputes, and service requests all stay documented in one place — so nothing depends on a lost WhatsApp thread.",
  },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Trust & Verification",
    body: "Every listing and every professional on the platform goes through a verification step before it reaches you. We would rather show fewer listings than show unverified ones.",
  },
  {
    icon: Eye,
    title: "Transparency",
    body: "Deposits, milestones, and communication stay on-platform and visible to everyone involved — no side deals, no hidden fees, no surprise charges after the fact.",
  },
  {
    icon: MapPin,
    title: "Local Expertise",
    body: "Built around how renting and property management actually work in Kenya today — from M-Pesa statements and letters of good conduct to county-specific compliance.",
  },
  {
    icon: Scale,
    title: "Fairness, Both Ways",
    body: "Landlords keep control of their lease terms and pricing; tenants get a clear, documented process to review, question, and respond. Neither side is left guessing.",
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About Us"
        icon={ShieldCheck}
        title="Solving Kenya's rental trust problem"
        subtitle="Secure Living is a verification-first property management and marketplace platform, built for Nairobi, Mombasa, and the diaspora — so buyers, tenants, landlords, and agencies can transact with confidence instead of guesswork."
        tags={[{ label: "Est. Kenya", variant: "info" }, { label: "Early Stage", variant: "neutral" }]}
      />

      <PageContainer className="py-14 sm:py-20">
        <div className="space-y-14">
          <section aria-labelledby="why-we-exist" className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
            <h2 id="why-we-exist" className="text-2xl font-bold text-slate-900">Why we exist</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
              Fake listings, unscreened agents, and opaque property management cost renters and
              landlords time, money, and trust every day in Kenya&apos;s rental market. We built
              Secure Living to close that gap: every listing is checked before it appears, every
              professional on the platform is screened, and every deposit or payment is tracked
              through an auditable, escrow-backed workflow — from the first enquiry all the way
              through to move-out.
            </p>
          </section>

          <section aria-labelledby="how-we-work">
            <h2 id="how-we-work" className="text-2xl font-bold text-slate-900">How we work</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {approach.map((a) => (
                <InfoCard key={a.title} icon={a.icon} title={a.title}>
                  {a.body}
                </InfoCard>
              ))}
            </div>
          </section>

          <section aria-labelledby="what-we-stand-for">
            <h2 id="what-we-stand-for" className="text-2xl font-bold text-slate-900">What we stand for</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {values.map((v) => (
                <InfoCard key={v.title} icon={v.icon} title={v.title}>
                  {v.body}
                </InfoCard>
              ))}
            </div>
          </section>

          <section aria-labelledby="who-we-are" className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <Users className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h2 id="who-we-are" className="text-2xl font-bold text-slate-900">Who we are</h2>
            </div>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
              We&apos;re a small, focused team building for the Kenyan market first — property
              managers, landlords, and renters who were tired of the status quo. We&apos;re early
              stage and growing deliberately, prioritizing getting verification, escrow, and
              compliance right over moving fast and breaking things.
            </p>
          </section>

          <CtaPanel
            title="Want to see it in action?"
            subtitle="Explore the platform's modules or create a free account to get started."
            primary={{ label: "Create account", href: "/auth/register" }}
            secondary={{ label: "Explore the platform", href: "/#platform" }}
          />
        </div>
      </PageContainer>
    </PageShell>
  );
}
