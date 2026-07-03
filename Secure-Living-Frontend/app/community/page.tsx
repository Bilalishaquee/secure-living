import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare, Building2, Users, UserCog, ShieldCheck, ArrowRight } from "lucide-react";
import { PageShell, PageContainer } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { InfoCard, CtaPanel } from "@/components/marketing/InfoCard";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Community — ${SITE_NAME}`,
  description: "A place for landlords, agencies, and tenants to ask questions, share local market knowledge, and shape the Secure Living roadmap — launching soon.",
  alternates: { canonical: `${getSiteUrl()}/community` },
};

const helpCenters = [
  { href: "/help/landlord", label: "Landlord Help Center", icon: Building2 },
  { href: "/help/tenant", label: "Tenant Help Center", icon: Users },
  { href: "/help/professional", label: "Service Professional Help Center", icon: UserCog },
  { href: "/help/staff", label: "Staff & Property Manager Help Center", icon: ShieldCheck },
];

const offerings = [
  "A place to ask other landlords and agencies how they handle screening, pricing, or maintenance.",
  "Tenant-to-tenant advice on renting well and understanding your rights.",
  "A direct channel for product feedback that actually reaches our team.",
  "Local market knowledge sharing across Nairobi, Mombasa, and beyond.",
];

export default function CommunityPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Community"
        icon={MessagesSquare}
        title="Community Forum"
        subtitle="We're building a space where landlords, agencies, and tenants can ask questions, trade local market knowledge, and directly shape what we build next."
        tags={[{ label: "Coming Soon", variant: "info" }]}
      />

      <PageContainer className="py-14 sm:py-20">
        <InfoCard icon={MessagesSquare} title="What the community will offer">
          <ul className="space-y-2.5">
            {offerings.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </InfoCard>

        <aside className="mt-10" aria-label="Available help centers in the meantime">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">In the meantime</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            The community forum isn&apos;t live yet, but our role-specific Help Centers are — with real answers
            to the questions people ask most.
          </p>
          <nav aria-label="Help centers" className="mt-5 grid gap-4 sm:grid-cols-2">
            {helpCenters.map((h) => (
              <Link
                key={h.href}
                href={h.href}
                className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-blue/40"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-brand-blue/10 group-hover:text-brand-blue">
                  <h.icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                </span>
                <span className="text-sm font-medium text-slate-800">{h.label}</span>
                <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </nav>
        </aside>

        <div className="mt-10">
          <CtaPanel
            title="Want a question answered directly?"
            subtitle="Reach our team, or join the newsletter to hear when the community forum opens."
            primary={{ label: "Contact Us", href: "/contact" }}
            secondary={{ label: "Join the Newsletter", href: "/#newsletter" }}
          />
        </div>
      </PageContainer>
    </PageShell>
  );
}
