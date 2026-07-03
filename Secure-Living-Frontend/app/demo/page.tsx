import type { Metadata } from "next";
import { Home, FileSignature, Banknote, Wrench, BadgeCheck, PlayCircle } from "lucide-react";
import { PageShell, PageContainer } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { InfoCard, CtaPanel } from "@/components/marketing/InfoCard";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Demo — ${SITE_NAME}`,
  description: "See a live walkthrough of Secure Living's property management platform.",
  alternates: { canonical: `${getSiteUrl()}/demo` },
};

const modules = [
  {
    icon: Home,
    title: "Listings & Applications",
    tag: { label: "Most Requested", variant: "info" as const },
    description:
      "Publish verified listings, set custom application requirements, and review applicants with screening reports and evidence uploads in one queue.",
  },
  {
    icon: FileSignature,
    title: "Lease Signing",
    tag: { label: "Most Requested", variant: "info" as const },
    description:
      "Send a lease offer with real terms, let the tenant review, ask questions, and accept & sign — no back-and-forth over email or WhatsApp.",
  },
  {
    icon: Banknote,
    title: "Rent Collection",
    tag: undefined,
    description:
      "Automated invoices, payment recording, arrears tracking, and deposit protection — with a clear reconciliation report at move-out.",
  },
  {
    icon: Wrench,
    title: "Maintenance & Service Requests",
    tag: undefined,
    description:
      "Tenants raise issues, requests route to the right property manager automatically, and every status change is tracked from submission to closure.",
  },
  {
    icon: BadgeCheck,
    title: "Compliance & KYC",
    tag: undefined,
    description:
      "Identity verification, compliance numbers, and audit trails give landlords, agencies, and tenants a verified, accountable platform to transact on.",
  },
];

export default function DemoPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Demo"
        icon={PlayCircle}
        title="See Secure Living in action"
        subtitle="We walk every new landlord, agency, and property manager through a live demo tailored to their portfolio — here's what it covers."
        tags={[{ label: "Live walkthrough, not a recording", variant: "info" }]}
      />

      <PageContainer className="py-14 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((mod) => (
            <InfoCard key={mod.title} icon={mod.icon} title={mod.title} tag={mod.tag}>
              {mod.description}
            </InfoCard>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <CtaPanel
            title="Book a live demo"
            subtitle="Get a 30-minute walkthrough built around your properties — no recorded video required."
            primary={{ label: "Book a Demo", href: "mailto:hello@secureliving.com?subject=Demo%20Request" }}
            secondary={{ label: "Use Contact Form", href: "/contact" }}
          />
          <InfoCard title="What to expect" tag={{ label: "30 min", variant: "neutral" }}>
            <ul className="space-y-2.5">
              <li>• A walkthrough scoped to your property type and portfolio size</li>
              <li>• Live Q&amp;A with a member of the Secure Living team</li>
              <li>• A follow-up summary with next steps to get started</li>
            </ul>
          </InfoCard>
        </div>
      </PageContainer>
    </PageShell>
  );
}
