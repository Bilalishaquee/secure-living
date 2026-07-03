import type { ReactNode } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { cn } from "@/lib/utils";

/**
 * Shared shell for every footer-linked marketing/legal/support page. Enforces the
 * full-width standard (max-w-7xl) instead of each page inventing its own narrower
 * container — this is what keeps 19+ independently-built pages visually consistent.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <PublicLayout>
      <LandingNavbar />
      <main className="relative bg-slate-50 pt-[4.5rem] sm:pt-24">{children}</main>
      <LandingFooter />
    </PublicLayout>
  );
}

/** Full-width content container — max-w-7xl, not the cramped max-w-3xl pattern. */
export function PageContainer({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}
