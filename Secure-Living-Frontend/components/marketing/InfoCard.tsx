import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { HeroTag } from "@/components/marketing/PageHero";

/**
 * The standard content card for footer pages — icon chip, title, optional corner
 * tag (Required/Beta/etc.), body copy, and an optional link list or CTA footer.
 * Used instead of ad-hoc <div className="rounded-2xl border p-6"> blocks scattered
 * per-page, so every card on every page shares the same anatomy.
 */
export function InfoCard({
  icon: Icon,
  title,
  tag,
  className,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  tag?: HeroTag;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border border-slate-200 bg-white/95 p-6 shadow-sm shadow-slate-200/60 transition-colors hover:border-brand-blue/30 hover:bg-white",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-brand-blue ring-1 ring-sky-100">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
          )}
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>
        {tag && <Badge variant={tag.variant ?? "neutral"} className="shrink-0">{tag.label}</Badge>}
      </div>
      <div className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{children}</div>
    </article>
  );
}

/** A single row entry inside an InfoCard's link list (used for guide/help/resource cards). */
export function CardLinkRow({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-blue"
      >
        <span>{label}</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    </li>
  );
}

/** Closing call-to-action panel — the standard end-of-page CTA block. */
export function CtaPanel({
  title,
  subtitle,
  primary,
  secondary,
}: {
  title: string;
  subtitle: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <div className="rounded-lg border border-brand-blue/20 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-8 text-center shadow-sm sm:p-10">
      <p className="text-xl font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={primary.href}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue/90"
        >
          {primary.label} <ArrowRight className="h-4 w-4" />
        </Link>
        {secondary && (
          <Link
            href={secondary.href}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-blue/40 hover:text-brand-blue"
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
