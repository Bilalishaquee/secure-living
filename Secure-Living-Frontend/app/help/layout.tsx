import Link from "next/link";
import type { ReactNode } from "react";
import { LogoShield } from "@/components/brand/LogoShield";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <PublicLayout>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-3.5">
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
      <main className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-gradient-to-br from-white via-sky-50 to-emerald-50">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 hidden w-1/2 bg-cover bg-center opacity-15 blur-[2px] saturate-75 lg:block"
          style={{
            backgroundImage: "url('/images/property/properties-banner.jpg')",
            maskImage: "linear-gradient(to left, black 35%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to left, black 35%, transparent 100%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">{children}</div>
      </main>
    </PublicLayout>
  );
}
