import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin manual",
  description: "How platform admins govern Secure Living — orgs, RBAC, and audit.",
};

export default function AdminManualPage() {
  return (
    <article className="max-w-none space-y-8">
      <p className="text-sm font-medium text-brand-blue">
        <Link href="/help" className="hover:underline">
          ← All manuals
        </Link>
      </p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-navy">
        Admin manual
      </h1>
      <p className="text-[var(--text-secondary)]">
        Admins configure who can do what, and leave a trail auditors can follow.
      </p>

      <h2 className="font-display text-xl font-semibold text-brand-navy">1. Organizations</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          Open <strong className="text-brand-navy">Admin → Organizations</strong> to review
          branches, status, and contact channels.
        </li>
        <li>Align org records with commercial contracts before enabling high escrow limits.</li>
      </ol>

      <h2 className="font-display text-xl font-semibold text-brand-navy">2. RBAC</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          Use <strong className="text-brand-navy">Admin → RBAC</strong> to grant least privilege —
          landlords, staff, and professionals should not inherit unused permissions.
        </li>
        <li>Document major permission changes in your change log (outside the app if required).</li>
      </ol>

      <h2 className="font-display text-xl font-semibold text-brand-navy">3. Audit logs</h2>
      <p className="text-sm text-[var(--text-secondary)]">
        <strong className="text-brand-navy">Admin → Audit Logs</strong> is the source of truth for
        sensitive actions. Investigate anomalies and export evidence for compliance reviews.
      </p>

      <h2 className="font-display text-xl font-semibold text-brand-navy">4. Your profile</h2>
      <p className="text-sm text-[var(--text-secondary)]">
        Admins still use <strong className="text-brand-navy">Settings</strong> for identity and
        notification preferences — keep recovery contacts up to date.
      </p>
    </article>
  );
}
