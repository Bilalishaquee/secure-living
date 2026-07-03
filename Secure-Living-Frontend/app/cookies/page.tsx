import type { Metadata } from "next";
import { Cookie } from "lucide-react";
import { PageShell } from "@/components/marketing/PageShell";
import { PageHero } from "@/components/marketing/PageHero";
import { DocLayout, DocSectionBlock } from "@/components/marketing/DocLayout";
import { CtaPanel } from "@/components/marketing/InfoCard";
import { getSiteUrl, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Cookie Policy — ${SITE_NAME}`,
  description: "How Secure Living uses cookies and similar storage.",
  alternates: { canonical: `${getSiteUrl()}/cookies` },
};

const sections = [
  {
    id: "essential-cookies",
    label: "Essential Cookies",
    title: "Essential Cookies",
    body: "Secure Living uses essential storage and cookies to keep you signed in, protect your session, remember your active role (landlord, tenant, agency, staff, admin), and support platform security. These cannot be disabled without affecting core functionality.",
  },
  {
    id: "preference-storage",
    label: "Preference Storage",
    title: "Preference Storage",
    body: "Some display preferences (such as your last-used dashboard view) may be stored locally in your browser to make the platform more convenient to use across visits.",
  },
  {
    id: "analytics",
    label: "Analytics",
    title: "Analytics",
    body: "Secure Living may use privacy-conscious analytics to understand which features are used and where the platform can be improved. Analytics data is aggregated and is not used to sell your information to third parties.",
  },
  {
    id: "managing-cookies",
    label: "Managing Cookies",
    title: "Managing Cookies",
    body: "You can control or clear cookies through your browser settings at any time. Disabling essential cookies will prevent you from staying signed in to the platform.",
  },
];

export default function CookiesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Legal"
        icon={Cookie}
        title="Cookie Policy"
        subtitle="What we store in your browser, and why."
      />

      <DocLayout sections={sections.map((s) => ({ id: s.id, label: s.label }))}>
        {sections.map((s) => (
          <DocSectionBlock key={s.id} id={s.id} title={s.title}>
            <p>{s.body}</p>
          </DocSectionBlock>
        ))}

        <CtaPanel
          title="Want the full picture?"
          subtitle="See our Privacy Policy for how information is used across the platform."
          primary={{ label: "Read Privacy Policy", href: "/privacy" }}
        />
      </DocLayout>
    </PageShell>
  );
}
