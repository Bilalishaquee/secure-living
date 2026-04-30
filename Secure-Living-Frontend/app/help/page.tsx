import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Building2, Shield, UserCog, Users } from "lucide-react";
import { SITE_NAME } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Help & user manuals",
  description: `How to use ${SITE_NAME} — guides for landlords, tenants, professionals, staff, and admins.`,
};

const manuals = [
  {
    href: "/help/landlord",
    title: "Landlord manual",
    description:
      "Portfolio setup, properties, escrow releases, tenants, transactions, and services — your primary client workflow.",
    icon: Building2,
  },
  {
    href: "/help/tenant",
    title: "Tenant manual",
    description: "Rent payments, KYC, profile settings, and how to read your tenancy status.",
    icon: Users,
  },
  {
    href: "/help/professional",
    title: "Professional manual",
    description: "Verification, getting matched to jobs, and logging milestones for landlords.",
    icon: UserCog,
  },
  {
    href: "/help/staff",
    title: "Staff manual",
    description: "Working inside branch permissions, supporting tenants, and field workflows.",
    icon: Users,
  },
  {
    href: "/help/admin",
    title: "Admin manual",
    description: "Organizations, RBAC, audit logs, and governance for platform operators.",
    icon: Shield,
  },
];

export default function HelpIndexPage() {
  return (
    <div>
      <div className="mb-10 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-escrow text-brand-blue">
          <BookOpen className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-navy">
            Help &amp; user manuals
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            Choose your role for a concise walkthrough of the demo app. In production, the same
            flows connect to live data, messaging, and payouts.
          </p>
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-1">
        {manuals.map((m) => {
          const Icon = m.icon;
          return (
            <li key={m.href}>
              <Link
                href={m.href}
                className="group flex gap-4 rounded-2xl border border-[var(--surface-border)] bg-surface-gray/20 p-5 transition hover:border-brand-blue/25 hover:bg-white hover:shadow-[var(--card-shadow)]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-navy/10 to-brand-blue/10 text-brand-navy">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-semibold text-brand-navy group-hover:text-brand-blue">
                    {m.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {m.description}
                  </p>
                </div>
                <ArrowRight
                  className="mt-1 h-5 w-5 shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-brand-blue"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 text-center text-xs text-[var(--text-muted)]">
        <Link href="/" className="font-medium text-brand-blue hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
