import type { Metadata } from "next";
import { Mail, Phone, MapPin, LifeBuoy, Briefcase, Megaphone, MessageCircle } from "lucide-react";
import { PageShell, PageContainer } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { InfoCard } from "@/components/marketing/InfoCard";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: `Contact Us — ${SITE_NAME}`,
  description: "Reach the Secure Living team — sales, support, or partnerships.",
  alternates: { canonical: `${getSiteUrl()}/contact` },
};

const teams = [
  {
    icon: Megaphone,
    title: "Sales & Partnerships",
    body: "Agencies, larger portfolios, or partnership enquiries.",
  },
  {
    icon: LifeBuoy,
    title: "Support",
    body: "Existing landlord or tenant account issues — check the Help Center first for instant answers.",
  },
  {
    icon: Briefcase,
    title: "Press & Media",
    body: "Media enquiries and interview requests.",
  },
];

export default function ContactPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Contact Us"
        icon={MessageCircle}
        title="We'd like to hear from you"
        subtitle="Whether you're a landlord, tenant, agency, or service provider — send us a message and the right team will get back to you."
        meta="Typical response time: within one business day."
      />

      <PageContainer className="py-14 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <ContactForm />
          </article>

          <aside className="space-y-6">
            <InfoCard title="Reach us directly">
              <div className="space-y-3 text-sm text-slate-700">
                <a href="mailto:hello@secureliving.com" className="flex items-center gap-2.5 hover:text-brand-blue">
                  <Mail className="h-4 w-4 shrink-0 text-brand-blue" /> hello@secureliving.com
                </a>
                <a href="tel:+254700000000" className="flex items-center gap-2.5 hover:text-brand-blue">
                  <Phone className="h-4 w-4 shrink-0 text-brand-blue" /> +254 700 000 000
                </a>
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 shrink-0 text-brand-blue" /> Nairobi, Kenya
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Which team should I contact?">
              <ul className="space-y-4">
                {teams.map((t) => (
                  <li key={t.title} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                      <t.icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </InfoCard>
          </aside>
        </div>
      </PageContainer>
    </PageShell>
  );
}
