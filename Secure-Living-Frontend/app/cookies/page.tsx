export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-800">
      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">Secure Living</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Cookie Policy</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Placeholder cookie policy for usability testing. Replace with final cookie disclosure
          before production launch.
        </p>
        <section className="mt-8 space-y-4 text-sm leading-6">
          <h2 className="text-lg font-semibold text-slate-900">Essential Cookies</h2>
          <p>
            Secure Living may use essential storage and cookies to keep users signed in, protect
            sessions, remember role context, and support platform security.
          </p>
          <h2 className="text-lg font-semibold text-slate-900">Analytics and Preferences</h2>
          <p>
            Optional analytics or preference tools should be documented here before production use.
          </p>
        </section>
      </div>
    </main>
  );
}
