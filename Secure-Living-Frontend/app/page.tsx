import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  alternates: { canonical: getSiteUrl() },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: getSiteUrl(),
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <LandingPage />
    </>
  );
}
