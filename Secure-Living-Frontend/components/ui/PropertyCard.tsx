"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { MockProperty } from "@/lib/mock-data";
import { formatKes } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type PropertyCardProps = {
  property: MockProperty;
  className?: string;
};

export function PropertyCard({ property, className }: PropertyCardProps) {
  const { name, address, monthlyRent, occupied, available, arrears, verification, imageUrl, id } =
    property;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-4 rounded-xl border border-white/80 bg-white/90 p-4 font-sans shadow-[0_8px_36px_rgb(var(--rgb-ink)_/_0.08)] ring-1 ring-brand-blue/[0.05] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_16px_48px_rgb(var(--rgb-primary)_/_0.1)]",
        className
      )}
    >
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-gray">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="112px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">{name}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{address}</p>
          </div>
          <p className="text-sm font-medium tabular-nums text-brand-navy">
            {formatKes(monthlyRent)}/mo
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {occupied > 0 ? (
            <Badge variant="success">
              {occupied} Occupied <span aria-hidden>✅</span>
            </Badge>
          ) : null}
          {available > 0 ? (
            <Badge variant="info">
              {available} Available <span aria-hidden>🔵</span>
            </Badge>
          ) : null}
          {arrears > 0 ? (
            <Badge variant="error">
              {arrears} Due Arrears <span aria-hidden>🔴</span>
            </Badge>
          ) : null}
          {verification === "Verified" ? (
            <Badge variant="success">Verified ✓</Badge>
          ) : verification === "Processing" || verification === "Under Review" ? (
            <Badge variant="warning">Processing ⏳</Badge>
          ) : (
            <Badge variant="error">Critical ⚠</Badge>
          )}
        </div>
        <Link
          href={`/properties/${id}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded"
        >
          View Details <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </motion.div>
  );
}
