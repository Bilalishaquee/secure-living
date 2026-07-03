import type { Metadata } from "next";
import { Database, Webhook, ShieldCheck, Plug } from "lucide-react";
import { PageShell, PageContainer } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { InfoCard, CtaPanel } from "@/components/marketing/InfoCard";
import { DocSectionBlock } from "@/components/marketing/DocLayout";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `API Access — ${SITE_NAME}`,
  description: "Integration and API access for approved Secure Living partners.",
  alternates: { canonical: `${getSiteUrl()}/api-access` },
};

const capabilities = [
  {
    icon: Database,
    title: "Data Sync",
    description:
      "Approved integration partners can sync property, unit, lease, and tenant records with their own systems — accounting software, CRMs, or internal reporting tools.",
  },
  {
    icon: Webhook,
    title: "Event Notifications",
    description:
      "Key events on the platform — a service request being raised, a lease being signed, a payment being recorded — can be delivered to your systems as they happen, so your integration stays up to date without polling.",
  },
  {
    icon: ShieldCheck,
    title: "Scoped, Permissioned Access",
    description:
      "Every integration is scoped to a specific organization and permission set — the same role-based access control that protects the rest of the platform applies to API access too. Nothing is exposed beyond what you're approved for.",
  },
];

export default function ApiAccessPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="API Access"
        icon={Plug}
        title="Integrate with Secure Living"
        subtitle="API access for approved integration partners and enterprise organizations — a managed integration program, not a self-serve public API today."
        tags={[{ label: "Partner Access", variant: "info" }]}
      />

      <PageContainer className="py-14 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {capabilities.map((cap) => (
            <InfoCard key={cap.title} icon={cap.icon} title={cap.title}>
              {cap.description}
            </InfoCard>
          ))}
        </div>

        <div className="mt-10">
          <DocSectionBlock id="how-access-works" title="How access works">
            <ol className="space-y-3">
              <li>
                <span className="font-semibold text-slate-800">1. Request access</span> — tell us about your
                organization and what you&apos;d like to integrate.
              </li>
              <li>
                <span className="font-semibold text-slate-800">2. Scope review</span> — our team agrees the
                exact data and permissions your integration needs.
              </li>
              <li>
                <span className="font-semibold text-slate-800">3. Credentials issued</span> — you receive
                scoped access tied to your organization, ready to integrate.
              </li>
            </ol>
          </DocSectionBlock>
        </div>

        <div className="mt-10">
          <CtaPanel
            title="Want to integrate with Secure Living?"
            subtitle="Tell us about your use case and our team will follow up on access."
            primary={{ label: "Request API Access", href: "/contact" }}
          />
        </div>
      </PageContainer>
    </PageShell>
  );
}
