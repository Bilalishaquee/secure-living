import Link from "next/link";
import type { ReactNode } from "react";
import { LogoShield } from "@/components/brand/LogoShield";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <PublicLayout>
      <header className="sticky top-0 z-50 border-b border-[var(--surface-border)] bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-3.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 min-h-[3.25rem] sm:min-h-14">
          <Link
            href="/"
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
            aria-label="Secure Living home"
          >
            <LogoShield size="md" />
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm font-semibold">
            <Link href="/help" className="text-brand-navy hover:text-brand-blue">
              Manuals
            </Link>
            <Link href="/auth/login" className="text-brand-blue hover:underline">
              Log in
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">{children}</div>
    </PublicLayout>
  );
}
