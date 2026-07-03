import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { PageShell } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { DocLayout, DocSectionBlock } from "@/components/marketing/DocLayout";
import { CtaPanel } from "@/components/marketing/InfoCard";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Terms of Service — ${SITE_NAME}`,
  description: "The terms that govern use of the Secure Living platform.",
  alternates: { canonical: `${getSiteUrl()}/terms` },
};

const sections = [
  {
    id: "use-of-platform",
    label: "1. Use of the Platform",
    title: "1. Use of the Platform",
    body: [
      "Secure Living provides property management, listing, tenancy, and marketplace workflows for landlords, agencies, property managers, service providers, and tenants operating in Kenya.",
      "Every user must provide accurate account, organization, property, tenancy, and payment information, and must only access records they are authorized to manage. Accounts are personal to the user and role they were created for and must not be shared.",
    ],
  },
  {
    id: "roles-responsibilities",
    label: "2. Roles & Responsibilities",
    title: "2. Roles & Responsibilities",
    body: [
      "Landlords, agencies, and property managers are responsible for the accuracy of listings, lease terms, and inspection records they create. Secure Living verifies listing and compliance information where stated, but the underlying tenancy agreement is between the landlord and tenant.",
      "Tenants are responsible for the accuracy of information submitted in rental applications and for reviewing lease terms before accepting and signing an offer.",
      "Service providers are responsible for the accuracy of their verification documents and for the quality of work performed against accepted service requests.",
    ],
  },
  {
    id: "operational-workflows",
    label: "3. Operational Workflows",
    title: "3. Operational Workflows",
    body: [
      "Lease creation and signing, rent collection, deposit handling, move-in/move-out inspections, support requests, service requests, visitor logging, and marketplace transactions are subject to role-based permissions and audit logging.",
      "Every significant action taken on the platform — approvals, rejections, disputes, deductions, and financial transactions — is recorded in an audit trail for accountability.",
    ],
  },
  {
    id: "payments-deposits",
    label: "4. Payments & Deposits",
    title: "4. Payments & Deposits",
    body: [
      "Rent payments, deposits, and marketplace transactions processed through the platform follow the deposit and escrow model configured for each lease. Deposit deductions require evidence and follow the dispute and rectification process described in the Help Centre.",
    ],
  },
  {
    id: "suspension-termination",
    label: "5. Suspension & Termination",
    title: "5. Account Suspension & Termination",
    body: [
      "Secure Living may suspend or deactivate an account or organization for verified fraud, repeated policy violations, or failure to meet compliance requirements, following the review and escalation processes described in the platform's admin workflows.",
    ],
  },
  {
    id: "changes-to-terms",
    label: "6. Changes to These Terms",
    title: "6. Changes to These Terms",
    body: [
      "These terms may be updated as the platform evolves. Material changes will be reflected on this page. Continued use of the platform after an update constitutes acceptance of the revised terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        icon={FileText}
        title="Terms of Service"
        subtitle="The terms that govern how landlords, agencies, tenants, service providers, and staff use Secure Living."
        meta="Last updated: pre-launch pilot version — subject to review before general availability."
      />

      <DocLayout sections={sections.map((s) => ({ id: s.id, label: s.label }))}>
        {sections.map((s) => (
          <DocSectionBlock key={s.id} id={s.id} title={s.title}>
            {s.body.map((p, i) => <p key={i}>{p}</p>)}
          </DocSectionBlock>
        ))}

        <CtaPanel
          title="Questions about these terms?"
          subtitle="Our Help Centre has role-specific guidance, or you can contact us directly."
          primary={{ label: "Visit Help Centre", href: "/help" }}
          secondary={{ label: "Contact Us", href: "/contact" }}
        />
      </DocLayout>
    </PageShell>
  );
}
