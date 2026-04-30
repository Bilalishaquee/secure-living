import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ListingCard } from "@/components/ui/ListingCard";
import { mockListings } from "@/lib/mock-data";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Verified property listings",
  description: `${SITE_NAME} marketplace: ${SITE_DESCRIPTION}`,
};

export default function ListingsPage() {
  return (
    <PublicLayout>
      <LandingNavbar />
      <main className="relative pt-[4.5rem] sm:pt-24">
        <div className="border-b border-[var(--surface-border)] bg-gradient-to-b from-[#eff6ff]/60 to-white py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="text-sm text-[var(--text-secondary)]">
              <Link href="/" className="font-medium text-brand-blue hover:underline">
                Home
              </Link>
              <span className="mx-2 text-[var(--text-muted)]" aria-hidden>
                /
              </span>
              <span className="text-brand-navy">Listings</span>
            </nav>
            <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-brand-navy sm:text-4xl">
              Verified listings in Kenya
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
              Every property below shows verified listing, agent verified, and secure transaction
              indicators where checks are complete. Avoid fake listings — we verify before you pay.
            </p>
            <Link
              href="#grid"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
            >
              Browse inventory
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <div id="grid" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {mockListings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} priority={i < 3} showFeatured />
            ))}
          </div>
        </div>
      </main>
      <LandingFooter />
    </PublicLayout>
  );
}
