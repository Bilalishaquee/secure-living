import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { DocLayout, DocSectionBlock } from "@/components/marketing/DocLayout";
import { CtaPanel } from "@/components/marketing/InfoCard";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description: "How Secure Living collects, uses, and protects your information.",
  alternates: { canonical: `${getSiteUrl()}/privacy` },
};

const sections = [
  {
    id: "information-we-collect",
    label: "Information We Collect",
    title: "Information We Collect",
    body: [
      "Secure Living collects the information needed to operate the platform: account details (name, email, phone), organization and property records, tenancy and lease information, payment and rent-collection history, KYC and compliance documents, support and service request records, and visitor logs where a property uses that feature.",
    ],
  },
  {
    id: "data-processing",
    label: "Data Processing",
    title: "Data Processing",
    body: [
      "Data is processed to provide property management, rent collection, lease signing, deposit protection, compliance verification, service requests, support, and marketplace workflows.",
      "Access is restricted by user role and organization scope — a tenant can only see their own lease and records, a property manager only the properties assigned to them, and so on. Every access-sensitive action is recorded in an audit trail.",
    ],
  },
  {
    id: "data-sharing",
    label: "Data Sharing",
    title: "Data Sharing",
    body: [
      "Information is shared only as needed to operate the platform: with the landlord/agency managing a tenant's property, with service providers assigned to a service request, and with payment processors to complete rent or deposit transactions. Secure Living does not sell personal data to third parties.",
    ],
  },
  {
    id: "data-retention",
    label: "Data Retention",
    title: "Data Retention",
    body: [
      "Tenancy, financial, and compliance records are retained for as long as needed to support the tenancy, audit, and legal/compliance obligations, including after a lease ends, to preserve the deposit reconciliation and dispute history.",
    ],
  },
  {
    id: "your-rights",
    label: "Your Rights",
    title: "Your Rights",
    body: [
      "You can review and update your account and profile information at any time from your dashboard settings. For access, correction, or deletion requests beyond what's self-service, contact us and we will respond within a reasonable timeframe.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        icon={ShieldCheck}
        title="Privacy Policy"
        subtitle="How Secure Living collects, uses, and protects information across the platform."
        meta="Last updated: pre-launch pilot version — subject to review before general availability."
      />

      <DocLayout sections={sections.map((s) => ({ id: s.id, label: s.label }))}>
        {sections.map((s) => (
          <DocSectionBlock key={s.id} id={s.id} title={s.title}>
            {s.body.map((p, i) => <p key={i}>{p}</p>)}
          </DocSectionBlock>
        ))}

        <CtaPanel
          title="Questions about your data?"
          subtitle="Reach out and we'll get back to you directly."
          primary={{ label: "Contact Us", href: "/contact" }}
          secondary={{ label: "View Security Practices", href: "/security" }}
        />
      </DocLayout>
    </PageShell>
  );
}
