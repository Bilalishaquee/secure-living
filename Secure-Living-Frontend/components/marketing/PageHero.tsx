import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { PageContainer } from "@/components/marketing/PageShell";

export type HeroTag = { label: string; variant?: "success" | "warning" | "error" | "info" | "neutral" };

/**
 * Standard full-width hero used at the top of every footer page — eyebrow label,
 * headline, subhead, optional status tags (Updated / Beta / v1.2 style), and an
 * optional icon chip. Keeps hero structure identical across all 19 pages.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  tags,
  meta,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  tags?: HeroTag[];
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-sky-50 to-emerald-50 py-14 sm:py-20">
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 hidden w-1/2 bg-cover bg-center opacity-20 blur-[2px] saturate-75 lg:block"
        style={{
          backgroundImage: "url('/images/property/properties-banner.jpg')",
          maskImage: "linear-gradient(to left, black 35%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to left, black 35%, transparent 100%)",
        }}
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent" />
      <PageContainer className="relative">
        <div className="flex flex-wrap items-center gap-3">
          {Icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/80 bg-white/80 text-brand-blue shadow-sm backdrop-blur">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </span>
          )}
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">{eyebrow}</p>
          {tags?.map((tag) => (
            <Badge key={tag.label} variant={tag.variant ?? "neutral"}>
              {tag.label}
            </Badge>
          ))}
        </div>
        <h1 className="mt-4 max-w-4xl text-3xl font-bold text-slate-950 sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">{subtitle}</p>
        {meta && <p className="mt-3 text-xs font-medium text-slate-400">{meta}</p>}
        {children && <div className="mt-8">{children}</div>}
      </PageContainer>
    </div>
  );
}
