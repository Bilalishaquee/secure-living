import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tenant manual",
  description: "How tenants use Secure Living — payments, KYC, and account settings.",
};

export default function TenantManualPage() {
  return (
    <article className="max-w-none space-y-8">
      <p className="text-sm font-medium text-brand-blue">
        <Link href="/help" className="hover:underline">
          ← All manuals
        </Link>
      </p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-navy">
        Tenant manual
      </h1>
      <p className="text-[var(--text-secondary)]">
        Pay rent safely, stay verified, and know where you stand with your landlord&apos;s
        portfolio rules.
      </p>

      <h2 className="font-display text-xl font-semibold text-brand-navy">1. Account &amp; profile</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          After login, open <strong className="text-brand-navy">Settings</strong> and confirm phone,
          WhatsApp, mailing address, and emergency contact — landlords often need these for notices.
        </li>
        <li>Set preferred language and currency if available so statements read clearly.</li>
      </ol>

      <h2 className="font-display text-xl font-semibold text-brand-navy">2. KYC</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          Complete <strong className="text-brand-navy">KYC</strong> early. Upload requested IDs and
          proofs; watch status until it shows verified.
        </li>
        <li>Renew documents when they expire to avoid payment or access interruptions.</li>
      </ol>

      <h2 className="font-display text-xl font-semibold text-brand-navy">3. Rent &amp; payments</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          Use <strong className="text-brand-navy">Dashboard</strong> and{" "}
          <strong className="text-brand-navy">Transactions</strong> (if visible to your role) to
          track amounts due, receipts, and escrow-backed flows.
        </li>
        <li>
          Enable rent email alerts in Settings so you get confirmations and failure notices
          immediately.
        </li>
      </ol>

      <h2 className="font-display text-xl font-semibold text-brand-navy">4. Maintenance</h2>
      <p className="text-sm text-[var(--text-secondary)]">
        Log service needs through your landlord&apos;s preferred channel (in-app Services or
        contact). Keep photos and descriptions specific to speed approval.
      </p>
    </article>
  );
}
