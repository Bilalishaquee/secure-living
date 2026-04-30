import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Staff manual",
  description: "How branch staff use Secure Living within assigned permissions.",
};

export default function StaffManualPage() {
  return (
    <article className="max-w-none space-y-8">
      <p className="text-sm font-medium text-brand-blue">
        <Link href="/help" className="hover:underline">
          ← All manuals
        </Link>
      </p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-navy">
        Staff manual
      </h1>
      <p className="text-[var(--text-secondary)]">
        Staff operate inside branch boundaries — you see only what your administrator allows.
      </p>

      <h2 className="font-display text-xl font-semibold text-brand-navy">1. Day-to-day</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          Start from <strong className="text-brand-navy">Dashboard</strong> for assignments and
          alerts scoped to your branch.
        </li>
        <li>
          Use <strong className="text-brand-navy">Properties</strong> and{" "}
          <strong className="text-brand-navy">Tenants</strong> to support visits, calls, and
          documentation — never export data outside policy.
        </li>
      </ol>

      <h2 className="font-display text-xl font-semibold text-brand-navy">2. Escrow awareness</h2>
      <p className="text-sm text-[var(--text-secondary)]">
        You may see escrow states as read-only. Do not promise releases; escalate to the landlord or
        admin with evidence attached.
      </p>

      <h2 className="font-display text-xl font-semibold text-brand-navy">3. Profile</h2>
      <p className="text-sm text-[var(--text-secondary)]">
        Keep contact details and emergency information current in Settings so operations can reach
        you during site issues.
      </p>
    </article>
  );
}
