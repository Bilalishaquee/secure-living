import type { Metadata } from "next";
import { BookOpen, FileQuestion, LineChart, LifeBuoy, Receipt, HelpCircle } from "lucide-react";
import { PageShell, PageContainer } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { InfoCard, CardLinkRow, CtaPanel } from "@/components/marketing/InfoCard";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Resources — ${SITE_NAME}`,
  description: "Guides, FAQs, and market insights for landlords, agencies, and tenants using Secure Living.",
  alternates: { canonical: `${getSiteUrl()}/resources` },
};

const sections = [
  {
    id: "landlord-guides",
    icon: BookOpen,
    title: "Landlord Guides",
    description: "Practical guidance for running a property portfolio on Secure Living.",
    items: [
      { label: "Setting up your first property & units", href: "/help/landlord" },
      { label: "Creating and sending a lease offer", href: "/help/landlord" },
      { label: "Understanding deposit protection models", href: "/help/landlord" },
      { label: "Screening applicants and reviewing documents", href: "/help/landlord" },
    ],
  },
  {
    id: "tenant-faqs",
    icon: FileQuestion,
    title: "Tenant FAQs",
    description: "Answers to the questions tenants ask most.",
    items: [
      { label: "How do I apply for a listing?", href: "/help/tenant" },
      { label: "What happens after I accept a lease offer?", href: "/help/tenant" },
      { label: "How is my deposit protected?", href: "/help/tenant" },
      { label: "How do I report a maintenance issue?", href: "/help/tenant" },
    ],
  },
  {
    id: "market-insights",
    icon: LineChart,
    title: "Market Insights",
    description: "Kenyan rental market context to help you price and plan.",
    items: [
      { label: "Understanding rent trends by county", href: "/help" },
      { label: "What makes a listing get more applications", href: "/help" },
      { label: "Compliance numbers and why they matter", href: "/help" },
    ],
  },
  {
    id: "tax-centre",
    icon: Receipt,
    title: "Tax Centre",
    description: "Rental income tax basics for Kenyan landlords — general guidance, not tax advice.",
    items: [
      { label: "Rental income tax (10% Monthly Rental Income tax) explained", href: "/help/landlord" },
      { label: "Recordkeeping: rent receipts, invoices, and deposit ledgers", href: "/help/landlord" },
      { label: "Withholding tax for agency-managed properties", href: "/help/landlord" },
      { label: "Preparing your records for KRA filing season", href: "/help/landlord" },
    ],
  },
  {
    id: "help-center",
    icon: LifeBuoy,
    title: "Help Center",
    description: "Role-specific support articles.",
    items: [
      { label: "Landlord Help Center", href: "/help/landlord" },
      { label: "Tenant Help Center", href: "/help/tenant" },
      { label: "Staff & Property Manager Help Center", href: "/help/staff" },
      { label: "Service Professional Help Center", href: "/help/professional" },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Resources"
        icon={HelpCircle}
        title="Guides, FAQs, and market context"
        subtitle="Everything you need to get the most out of Secure Living — organized by who you are and what you're trying to do."
      />

      <PageContainer className="py-14 sm:py-20">
        <section aria-label="Resource categories" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-28">
              <InfoCard icon={section.icon} title={section.title} className="h-full">
                <p className="text-slate-500">{section.description}</p>
                <ul className="mt-3 space-y-0.5 border-t border-slate-100 pt-2">
                  {section.items.map((item) => (
                    <CardLinkRow key={item.label} href={item.href} label={item.label} />
                  ))}
                </ul>
              </InfoCard>
            </div>
          ))}
        </section>

        <div className="mt-12">
          <CtaPanel
            title="Still have a question?"
            subtitle="Our Help Center has role-specific answers, or you can reach out directly."
            primary={{ label: "Visit Help Center", href: "/help" }}
            secondary={{ label: "Contact Us", href: "/contact" }}
          />
        </div>
      </PageContainer>
    </PageShell>
  );
}
