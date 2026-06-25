import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-800">
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Secure Living</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Terms of Service</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Placeholder terms for usability testing. Replace with client-approved legal terms
          before production launch.
        </p>
        <section className="mt-8 space-y-4 text-sm leading-6">
          <h2 className="text-lg font-semibold text-slate-900">Use of the Platform</h2>
          <p>
            Users must provide accurate account, organization, property, tenancy, and payment
            workflow information and must only access records they are authorized to manage.
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Operational Workflows</h2>
          <p>
            Lease, rent, support, service request, visitor, and marketplace workflows are subject
            to verification, audit logging, and role-based permissions.
          </p>
          <p>
            Need help? Visit the <Link className="text-brand-blue underline" href="/help">Help Centre</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
