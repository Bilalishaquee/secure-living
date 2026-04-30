"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, UserCheck } from "lucide-react";
import type { MockListing } from "@/lib/mock-data";
import { Badge } from "@/components/ui/Badge";
import { cn, formatKes } from "@/lib/utils";

type ListingCardProps = {
  listing: MockListing;
  className?: string;
  priority?: boolean;
  showFeatured?: boolean;
};

export function ListingCard({ listing, className, priority, showFeatured }: ListingCardProps) {
  const priceLabel =
    listing.listingType === "Sale"
      ? formatKes(listing.priceKes)
      : `${formatKes(listing.priceKes)}/mo`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/90 bg-white shadow-[0_12px_48px_rgb(var(--rgb-ink)_/_0.08)] ring-1 ring-brand-blue/[0.06] transition-shadow duration-300 hover:shadow-[0_20px_56px_rgb(var(--rgb-primary)_/_0.12)]",
        className
      )}
    >
      <Link href={`/listings/${listing.id}`} className="relative block aspect-[16/10] overflow-hidden bg-surface-gray">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-transparent to-transparent opacity-90" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {showFeatured && listing.featured ? (
            <Badge variant="info" className="font-semibold shadow-sm">
              Featured
            </Badge>
          ) : null}
          <Badge variant="neutral" className="bg-white/90 text-brand-navy shadow-sm">
            {listing.listingType}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
          {listing.verifiedListing ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              Verified listing
            </span>
          ) : null}
          {listing.agentVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/95 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
              <UserCheck className="h-3 w-3" aria-hidden />
              Agent verified
            </span>
          ) : null}
          {listing.secureTransaction ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
              <Lock className="h-3 w-3" aria-hidden />
              Secure transaction
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold text-brand-navy">{listing.title}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{listing.location}</p>
          </div>
          <p className="shrink-0 text-lg font-semibold tabular-nums text-brand-blue">{priceLabel}</p>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
          {listing.summary}
        </p>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          {listing.beds} bd · {listing.baths} ba · {listing.sqm} m²
        </p>
        <p className="mt-2 text-xs font-medium text-brand-navy">{listing.agentName}</p>
        <Link
          href={`/listings/${listing.id}`}
          className="mt-4 inline-flex text-sm font-semibold text-brand-blue underline-offset-2 transition hover:underline"
        >
          View details
        </Link>
      </div>
    </motion.article>
  );
}
