"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/** Canonical brand mark — file lives in `/public/l1.png` (synced from `app/l1.png` when updated). */
const LOGO_SRC = "/l1.png";
const LOGO_WIDTH = 435;
const LOGO_HEIGHT = 433;

type LogoShieldProps = {
  className?: string;
  /** @deprecated Image logo uses its own colors; kept for API compatibility */
  variant?: "light" | "dark";
  /** When true, appends wordmark next to the mark (use if logo is icon-only). */
  showWordmark?: boolean;
  /** sm = compact (sidebar), md = nav bars, lg = auth hero, xl = footer / marketing */
  size?: "sm" | "md" | "lg" | "xl";
  priority?: boolean;
};

const heightClass = {
  /** Sidebar / mobile drawer — fits h-16 header row */
  sm: "h-11 max-h-11 min-h-[2.75rem]",
  /** Main marketing navbar */
  md: "h-[3.25rem] max-h-[3.25rem] min-h-[3.25rem] sm:h-14 sm:max-h-14 sm:min-h-[3.5rem]",
  /** Auth panel / large placements */
  lg: "h-16 max-h-16 min-h-[4rem] sm:h-[4.25rem] sm:max-h-[4.25rem] sm:min-h-[4.25rem]",
  /** Footer & hero emphasis */
  xl: "h-[4.25rem] max-h-[4.25rem] min-h-[4.25rem] sm:h-[4.75rem] sm:max-h-[4.75rem] sm:min-h-[4.75rem] md:h-20 md:max-h-20 md:min-h-[5rem]",
};

/** Square mark — match max-width to height tier so the mark stays proportional */
const widthCap = {
  sm: "max-w-[2.75rem]",
  md: "max-w-[3.25rem] sm:max-w-[3.5rem]",
  lg: "max-w-[4rem] sm:max-w-[4.25rem]",
  xl: "max-w-[4.25rem] sm:max-w-[4.75rem] md:max-w-[5rem]",
};

export function LogoShield({
  className,
  variant: _variant = "dark",
  showWordmark = false,
  size = "md",
  priority = false,
}: LogoShieldProps) {
  void _variant;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src={LOGO_SRC}
        alt="Secure Living"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={priority}
        sizes="(max-width: 640px) 56px, (max-width: 1024px) 64px, 80px"
        className={cn(
          "w-auto shrink-0 object-contain object-left",
          heightClass[size],
          widthCap[size]
        )}
      />
      {showWordmark ? (
        <span
          className={cn(
            "font-display font-bold tracking-tight text-brand-navy",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            (size === "lg" || size === "xl") && "text-lg"
          )}
        >
          SECURE LIVING
        </span>
      ) : null}
    </div>
  );
}
