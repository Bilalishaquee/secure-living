import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-800">
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Secure Living</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Privacy Policy</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Placeholder privacy copy for pre-launch usability testing. Replace this page with
          client-approved legal text before production launch.
        </p>
        <section className="mt-8 space-y-4 text-sm leading-6">
          <h2 className="text-lg font-semibold text-slate-900">Information We Collect</h2>
          <p>
            Secure Living may collect account, property, tenancy, payment workflow, support,
            and verification information needed to operate the platform.
          </p>
          <h2 id="data-processing" className="text-lg font-semibold text-slate-900">Data Processing</h2>
          <p>
            Data is processed to provide property management, rent collection, compliance,
            service request, support, and marketplace workflows. Access is restricted by user
            role and organization scope.
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <p>
            Questions about privacy can be sent through the <Link className="text-brand-blue underline" href="/help">Help Centre</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
