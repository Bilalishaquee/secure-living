import type { Metadata } from "next";
import { TrendingUp, BookOpen, Users, Megaphone, Mail } from "lucide-react";
import { PageShell, PageContainer } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { InfoCard, CtaPanel } from "@/components/marketing/InfoCard";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Blog — ${SITE_NAME}`,
  description: "Kenyan rental market insights, landlord and tenant guides, and product updates from Secure Living — launching soon.",
  alternates: { canonical: `${getSiteUrl()}/blog` },
};

const topics = [
  {
    icon: TrendingUp,
    title: "Market Trends",
    description: "Rent trends by county, demand signals, and what's shaping the Kenyan rental market county by county.",
  },
  {
    icon: BookOpen,
    title: "Landlord Playbooks",
    description: "Practical, step-by-step guidance on screening, pricing, deposit protection, and running a portfolio well.",
  },
  {
    icon: Users,
    title: "Tenant Rights & Tips",
    description: "Plain-language explainers on deposits, lease terms, dispute resolution, and what to expect when renting in Kenya.",
  },
  {
    icon: Megaphone,
    title: "Product Updates",
    description: "What's new on Secure Living — feature releases, workflow improvements, and platform announcements.",
  },
];

export default function BlogPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Blog"
        icon={Mail}
        title="Insight for landlords, agencies, and tenants"
        subtitle="We're building a home for Kenyan rental market insights, practical guides, and Secure Living product news. Here's what to expect when it launches."
        tags={[{ label: "Coming Soon", variant: "info" }]}
      />

      <PageContainer className="py-14 sm:py-20">
        <section aria-label="Planned topics" className="grid gap-6 sm:grid-cols-2">
          {topics.map((topic) => (
            <InfoCard key={topic.title} icon={topic.icon} title={topic.title}>
              {topic.description}
            </InfoCard>
          ))}
        </section>

        <aside className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">In the meantime</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Our guides and FAQs are already live in the Resources center — practical, real answers for landlords
            and tenants today, not waiting on the blog.
          </p>
        </aside>

        <div className="mt-8">
          <CtaPanel
            title="Be first to know when we publish"
            subtitle="Join the newsletter and we'll let you know the moment the blog goes live."
            primary={{ label: "Join the Newsletter", href: "/#newsletter" }}
            secondary={{ label: "Visit Resources", href: "/resources" }}
          />
        </div>
      </PageContainer>
    </PageShell>
  );
}
