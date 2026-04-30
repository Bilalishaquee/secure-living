import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Professional manual",
  description: "How verified professionals use Secure Living — jobs, milestones, and reputation.",
};

export default function ProfessionalManualPage() {
  return (
    <article className="max-w-none space-y-8">
      <p className="text-sm font-medium text-brand-blue">
        <Link href="/help" className="hover:underline">
          ← All manuals
        </Link>
      </p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-navy">
        Professional manual
      </h1>
      <p className="text-[var(--text-secondary)]">
        Contractors and specialists stay trustworthy by logging work clearly and on time.
      </p>

      <h2 className="font-display text-xl font-semibold text-brand-navy">1. Verification</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          Finish <strong className="text-brand-navy">KYC</strong> and any trade credentials so
          landlords can assign high-trust jobs.
        </li>
        <li>
          Keep <strong className="text-brand-navy">Settings → Profile</strong> accurate: service
          area, phone, WhatsApp, and short bio help matching.
        </li>
      </ol>

      <h2 className="font-display text-xl font-semibold text-brand-navy">2. Jobs &amp; milestones</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          Watch <strong className="text-brand-navy">Services</strong> and property threads for new
          assignments from landlords you are linked to.
        </li>
        <li>
          Record milestones (photos, dates, materials) so escrow releases can proceed without
          disputes.
        </li>
      </ol>

      <h2 className="font-display text-xl font-semibold text-brand-navy">3. Payments</h2>
      <p className="text-sm text-[var(--text-secondary)]">
        Payouts typically follow landlord approval. Check Transactions when your role includes
        payment visibility, and keep tax PIN details updated for reporting.
      </p>
    </article>
  );
}
