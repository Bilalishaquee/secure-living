import type { ReactNode } from "react";
import { PageContainer } from "@/components/marketing/PageShell";

export type DocSection = { id: string; label: string };

/**
 * Two-column layout for content-heavy legal/policy pages (Terms, Privacy, Security,
 * Cookies) — a sticky section index on the left, full content on the right. This is
 * what makes a full-width legal page feel intentional instead of a single narrow
 * column of paragraphs stretching down an otherwise-empty wide viewport.
 */
export function DocLayout({ sections, children }: { sections: DocSection[]; children: ReactNode }) {
  return (
    <PageContainer className="py-14 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-28 rounded-lg border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">On this page</p>
            <ul className="mt-3 space-y-1">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block rounded-md px-2.5 py-1.5 text-sm text-slate-600 transition-colors hover:bg-white hover:text-brand-blue"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <div className="min-w-0 space-y-10">{children}</div>
      </div>
    </PageContainer>
  );
}

export function DocSectionBlock({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}
