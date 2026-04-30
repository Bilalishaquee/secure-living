import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, ShieldCheck, UserCheck } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { getConsultationMailto, getWhatsAppHref } from "@/lib/contact";
import { getMockListingById, mockListings } from "@/lib/mock-data";
import { SITE_NAME } from "@/lib/site-config";
import { formatKes } from "@/lib/utils";

type Props = { params: { id: string } };

export function generateStaticParams(): { id: string }[] {
  return mockListings.map((l) => ({ id: l.id }));
}

export function generateMetadata({ params }: Props): Metadata {
  const listing = getMockListingById(params.id);
  if (!listing) return { title: "Listing" };
  return {
    title: listing.title,
    description: `${listing.summary} ${listing.location} · ${SITE_NAME}`,
  };
}

export default function ListingDetailPage({ params }: Props) {
  const listing = getMockListingById(params.id);
  if (!listing) notFound();

  const priceLabel =
    listing.listingType === "Sale"
      ? formatKes(listing.priceKes)
      : `${formatKes(listing.priceKes)}/month`;

  return (
    <PublicLayout>
      <LandingNavbar />
      <main className="relative pt-[4.5rem] sm:pt-24">
        <div className="border-b border-[var(--surface-border)] bg-white py-8">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <nav className="text-sm text-[var(--text-secondary)]">
              <Link href="/" className="font-medium text-brand-blue hover:underline">
                Home
              </Link>
              <span className="mx-2 text-[var(--text-muted)]">/</span>
              <Link href="/listings" className="font-medium text-brand-blue hover:underline">
                Listings
              </Link>
              <span className="mx-2 text-[var(--text-muted)]">/</span>
              <span className="text-brand-navy">{listing.title}</span>
            </nav>
          </div>
        </div>

        <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-surface-gray shadow-card">
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(min-width: 896px) 896px, 100vw"
              priority
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {listing.verifiedListing ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Verified listing
              </span>
            ) : null}
            {listing.agentVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">
                <UserCheck className="h-3.5 w-3.5" aria-hidden />
                Agent verified
              </span>
            ) : null}
            {listing.secureTransaction ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-900">
                <Lock className="h-3.5 w-3.5" aria-hidden />
                Secure transaction
              </span>
            ) : null}
            <span className="rounded-full border border-[var(--surface-border)] bg-white px-3 py-1 text-xs font-semibold text-brand-navy">
              {listing.listingType}
            </span>
          </div>

          <h1 className="font-display mt-6 text-3xl font-semibold tracking-tight text-brand-navy sm:text-4xl">
            {listing.title}
          </h1>
          <p className="mt-2 text-lg text-[var(--text-secondary)]">{listing.location}</p>
          <p className="mt-4 text-3xl font-semibold tabular-nums text-brand-blue">{priceLabel}</p>
          <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
            {listing.summary}
          </p>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            {listing.beds} bedrooms · {listing.baths} bathrooms · {listing.sqm} m²
          </p>
          <p className="mt-2 text-sm font-medium text-brand-navy">Listed by {listing.agentName}</p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={getConsultationMailto()}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-navy to-brand-blue px-6 py-3.5 text-center text-sm font-semibold text-white shadow-[0_8px_28px_rgb(var(--rgb-primary)_/_0.35)] ring-1 ring-white/20 transition hover:shadow-[0_12px_36px_rgb(var(--rgb-primary)_/_0.42)]"
            >
              Enquire about this property
            </a>
            <a
              href={getWhatsAppHref(
                `Hello ${SITE_NAME} — I'm interested in: ${listing.title} (${listing.location}).`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl border-2 border-[var(--brand-gold)]/45 bg-white px-6 py-3.5 text-center text-sm font-semibold text-brand-navy shadow-sm transition hover:border-[var(--brand-gold)]"
            >
              WhatsApp about this listing
            </a>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white/90 px-6 py-3.5 text-center text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-blue/35"
            >
              Create account
            </Link>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-[var(--text-muted)]">
            Demo listing for illustration. Availability, pricing, and verification status will reflect
            live data at launch. Secure your next home with confidence — always confirm milestones in
            platform before you pay.
          </p>
        </article>
      </main>
      <LandingFooter />
    </PublicLayout>
  );
}
