"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { PlatformModulesSection } from "@/components/landing/PlatformModulesSection";
import { StessaCloneSections } from "@/components/landing/StessaCloneSections";
import { SupportingServicesSection } from "@/components/landing/SupportingServicesSection";
import { NewsletterSection } from "@/components/landing/NewsletterSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function LandingPage() {
  return (
    <PublicLayout>
      <LandingNavbar />
      <main className="relative bg-white">
        <HeroSection />
        <PlatformModulesSection />
        <StessaCloneSections />
        <SupportingServicesSection />
        <NewsletterSection />
      </main>
      <LandingFooter />
    </PublicLayout>
  );
}
