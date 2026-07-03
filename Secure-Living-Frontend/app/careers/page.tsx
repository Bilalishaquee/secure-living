import type { Metadata } from "next";
import { Heart, Compass, Users2, Zap, Briefcase } from "lucide-react";
import { PageShell, PageContainer } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { InfoCard, CtaPanel } from "@/components/marketing/InfoCard";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Careers — ${SITE_NAME}`,
  description: "Join the team building a verification-first property management platform for Kenya.",
  alternates: { canonical: `${getSiteUrl()}/careers` },
};

const traits = [
  {
    icon: Heart,
    title: "Care about trust",
    body: "You take it personally when a system lets someone get scammed or shortchanged, and you want to build the fix.",
  },
  {
    icon: Compass,
    title: "Comfortable with ambiguity",
    body: "We're early stage — priorities shift as we learn from real landlords, tenants, and agencies using the platform.",
  },
  {
    icon: Users2,
    title: "Grounded in Kenya",
    body: "You understand (or want to deeply understand) how renting, property management, and payments actually work here.",
  },
  {
    icon: Zap,
    title: "Bias toward shipping",
    body: "You'd rather ship something real and improve it with feedback than polish something no one has used yet.",
  },
];

export default function CareersPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Careers"
        icon={Briefcase}
        title="Help fix how Kenya rents and manages property"
        subtitle="We're a small, early-stage team. We don't have a public job board yet — but we're always glad to hear from people who want to build this with us."
        tags={[{ label: "No Open Roles Yet", variant: "neutral" }]}
      />

      <PageContainer className="py-14 sm:py-20">
        <div className="space-y-14">
          <section aria-labelledby="why-work-here" className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
            <h2 id="why-work-here" className="text-2xl font-bold text-slate-900">Why work on this</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
              Rental scams, unscreened agents, and opaque property management are a daily,
              expensive problem for millions of people in Kenya. Secure Living tackles that
              problem head-on — verification, escrow-backed payments, and transparent workflows
              for landlords, tenants, agencies, and service professionals. It&apos;s early, it&apos;s
              real, and the work you ship reaches people directly.
            </p>
          </section>

          <section aria-labelledby="what-we-look-for">
            <h2 id="what-we-look-for" className="text-2xl font-bold text-slate-900">What we look for</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {traits.map((t) => (
                <InfoCard key={t.title} icon={t.icon} title={t.title}>
                  {t.body}
                </InfoCard>
              ))}
            </div>
          </section>

          <CtaPanel
            title="No open roles listed right now"
            subtitle="If you think you'd be a strong fit — in engineering, operations, property/compliance, or partnerships — we'd rather hear from you early than not at all."
            primary={{ label: "Send a speculative application", href: "mailto:hello@secureliving.com?subject=Speculative%20Application" }}
            secondary={{ label: "Ask a question first", href: "/contact" }}
          />
        </div>
      </PageContainer>
    </PageShell>
  );
}
