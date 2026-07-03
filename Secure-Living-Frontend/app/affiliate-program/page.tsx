import type { Metadata } from "next";
import { Gift, Link2, BadgeCheck, Wallet } from "lucide-react";
import { PageShell, PageContainer } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { InfoCard, CtaPanel } from "@/components/marketing/InfoCard";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Affiliate Program — ${SITE_NAME}`,
  description: "Refer landlords, agencies, and tenants to Secure Living and earn rewards through our early-access referral program.",
  alternates: { canonical: `${getSiteUrl()}/affiliate-program` },
};

const steps = [
  {
    icon: Link2,
    title: "Get your referral code",
    description: "Landlords, agencies, and service professionals can request a unique referral code tied to their account.",
  },
  {
    icon: BadgeCheck,
    title: "Referrals get tracked",
    description: "Every person you refer moves through clear stages — invited, registered, verified, and qualified — so you always know where things stand.",
  },
  {
    icon: Gift,
    title: "Earn a reward",
    description: "Once a referral qualifies, you become eligible for a reward — a free subscription period, account credit, or similar benefit set for the program.",
  },
];

export default function AffiliateProgramPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Affiliate Program"
        icon={Gift}
        title="Refer a landlord, agency, or provider — earn a reward"
        subtitle="Know a landlord, agency, or service provider who'd benefit from Secure Living? Our referral program rewards you for bringing them onto the platform."
        tags={[{ label: "Early Access", variant: "warning" }]}
      />

      <PageContainer className="py-14 sm:py-20">
        <div className="space-y-10">
          <section aria-label="How it works" className="grid gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <InfoCard key={step.title} icon={step.icon} title={step.title}>
                {step.description}
              </InfoCard>
            ))}
          </section>

          <InfoCard icon={Wallet} title="Who can join">
            The program is open to landlords, property managers, agencies, tenants, and service professionals
            already using Secure Living. It&apos;s currently in early access as we roll it out to our pilot
            organizations — reach out and we&apos;ll get you set up with a referral code.
          </InfoCard>

          <CtaPanel
            title="Want in on early access?"
            subtitle="Contact our team or create an account and we'll help you get started."
            primary={{ label: "Contact Us", href: "/contact" }}
            secondary={{ label: "Create Account", href: "/auth/register" }}
          />
        </div>
      </PageContainer>
    </PageShell>
  );
}
