import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Landlord manual",
  description: "How landlords use Secure Living — properties, escrow, tenants, and services.",
};

export default function LandlordManualPage() {
  return (
    <article className="max-w-none space-y-8">
      <p className="text-sm font-medium text-brand-blue">
        <Link href="/help" className="hover:underline">
          ← All manuals
        </Link>
      </p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-navy">
        Landlord manual
      </h1>
      <p className="text-[var(--text-secondary)]">
        Landlords are the primary client segment. Use this flow to onboard, operate remotely, and
        stay audit-ready.
      </p>

      <h2 className="font-display text-xl font-semibold text-brand-navy">1. Sign in &amp; profile</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          Log in from the auth screen. Complete your{" "}
          <strong className="text-brand-navy">Settings → Profile</strong> with phone, WhatsApp,
          portfolio name, tax PIN (masked), mailing address, and emergency contacts.
        </li>
        <li>
          Upload or refresh KYC from <strong className="text-brand-navy">KYC</strong> when prompted
          for verification or escrow limits.
        </li>
      </ol>

      <h2 className="font-display text-xl font-semibold text-brand-navy">2. Properties</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          Open <strong className="text-brand-navy">Properties</strong> to view branches and units.
          Add a property from <em>New property</em> when expanding the portfolio.
        </li>
        <li>
          Open a property record for status, documents, and linked tenants. Keep data aligned with
          field inspections.
        </li>
      </ol>

      <h2 className="font-display text-xl font-semibold text-brand-navy">3. Tenants &amp; rent</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          Use <strong className="text-brand-navy">Tenants</strong> to see who occupies which unit
          and their verification state.
        </li>
        <li>
          Rent and arrears visibility roll up to the dashboard; nudge tenants to pay through escrow
          rails for traceability.
        </li>
      </ol>

      <h2 className="font-display text-xl font-semibold text-brand-navy">4. Escrow &amp; transactions</h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>
          <strong className="text-brand-navy">Transactions</strong> shows protected balances,
          releases, and milestones. Release funds only after your rules (e.g. inspection, tenant
          confirmation) are met.
        </li>
        <li>
          Turn on escrow and rent alerts in <strong className="text-brand-navy">Settings</strong>{" "}
          so you are notified of every material movement.
        </li>
      </ol>

      <h2 className="font-display text-xl font-semibold text-brand-navy">5. Services &amp; workforce</h2>
      <p className="text-sm text-[var(--text-secondary)]">
        Request repairs, maintenance, or construction oversight from{" "}
        <strong className="text-brand-navy">Services</strong>. Verified professionals complete work
        and log evidence for your release workflow.
      </p>

      <h2 className="font-display text-xl font-semibold text-brand-navy">6. Diaspora tips</h2>
      <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
        <li>Keep WhatsApp and email in profile current for urgent field updates.</li>
        <li>Use timezone and currency preferences so reports match how you read them abroad.</li>
        <li>Review the landing page &quot;services&quot; and &quot;testimonials&quot; with your own
          stakeholders — they mirror how you pitch landlords like you.</li>
      </ul>
    </article>
  );
}
