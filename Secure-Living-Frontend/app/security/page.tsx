import type { Metadata } from "next";
import { ShieldCheck, KeyRound, ScrollText, BadgeCheck, Mail } from "lucide-react";
import { PageShell, PageContainer } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { InfoCard, CtaPanel } from "@/components/marketing/InfoCard";
import { DocSectionBlock } from "@/components/marketing/DocLayout";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Security — ${SITE_NAME}`,
  description: "How Secure Living protects accounts, data, and transactions across the platform.",
  alternates: { canonical: `${getSiteUrl()}/security` },
};

const pillars = [
  {
    icon: KeyRound,
    title: "Authentication & Access Control",
    description:
      "Every account is protected by role-based access control. Permissions are assigned per role — landlord, agency, property manager, tenant, staff, or admin — and every API request is checked against the caller's exact permission set and organization/branch scope before any data is returned or changed. No user can see records outside what their role and assignments allow.",
  },
  {
    icon: ShieldCheck,
    title: "Data Protection",
    description:
      "Passwords are never stored in plain text — they're hashed with scrypt and a unique random salt per account, and verified using constant-time comparison to resist timing attacks. All traffic between your browser and Secure Living is encrypted in transit (256-bit SSL/TLS).",
  },
  {
    icon: ScrollText,
    title: "Audit & Accountability",
    description:
      "Sensitive actions — lease changes, deposit deductions, KYC decisions, dispute resolutions, organization approvals, and more — are written to an immutable audit trail with who did what and when. This trail backs both internal reviews and the activity feeds admins see in their dashboards.",
  },
  {
    icon: BadgeCheck,
    title: "Compliance & Verification",
    description:
      "Properties, agents, and tenants can carry a unique Secure Living compliance number, and identity/KYC documents go through a structured review queue before an account is marked verified. This gives everyone on the platform a way to check who they're really dealing with.",
  },
];

export default function SecurityPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Security"
        icon={ShieldCheck}
        title="Built to protect rent, deposits, and personal documents"
        subtitle="Secure Living handles sensitive financial and identity data for landlords and tenants across Kenya — here is how we protect that trust."
        tags={[{ label: "256-bit SSL/TLS", variant: "success" }]}
      />

      <PageContainer className="py-14 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <InfoCard key={pillar.title} icon={pillar.icon} title={pillar.title}>
              {pillar.description}
            </InfoCard>
          ))}
        </div>

        <div className="mt-10">
          <DocSectionBlock id="responsible-disclosure" title="Responsible Disclosure">
            <p>
              If you believe you&apos;ve found a security vulnerability in Secure Living, we want to hear from
              you. Please report it privately and give us a reasonable opportunity to investigate and address
              it before any public disclosure.
            </p>
            <ul className="space-y-2 pl-1">
              <li>• Email us at the address below with a clear description and steps to reproduce.</li>
              <li>• Avoid accessing, modifying, or deleting data that isn&apos;t yours in the course of testing.</li>
              <li>• Give us a reasonable window to respond and remediate before sharing details publicly.</li>
            </ul>
            <p>
              We aim to acknowledge reports within a few business days, and we won&apos;t pursue legal action
              against good-faith researchers who follow these guidelines.
            </p>
            <a
              href="mailto:hello@secureliving.com?subject=Security%20Disclosure"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:underline"
            >
              <Mail className="h-4 w-4" /> hello@secureliving.com
            </a>
          </DocSectionBlock>
        </div>

        <div className="mt-10">
          <CtaPanel
            title="Have a security question?"
            subtitle="Our team can walk you through how your data is handled."
            primary={{ label: "Contact Us", href: "/contact" }}
            secondary={{ label: "Read Privacy Policy", href: "/privacy" }}
          />
        </div>
      </PageContainer>
    </PageShell>
  );
}
