"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { StessaCloneSections } from "@/components/landing/StessaCloneSections";
import { SupportingServicesSection } from "@/components/landing/SupportingServicesSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function LandingPage() {
  return (
    <PublicLayout>
      <LandingNavbar />
      <main className="relative bg-white">
        <HeroSection />
        <StessaCloneSections />
        <SupportingServicesSection />
      </main>
      <LandingFooter />
    </PublicLayout>
  );
}
