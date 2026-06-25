import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const plans = [
  { name: "Starter", price: "Free", points: ["Listings", "Basic tenant records", "Help centre access"] },
  { name: "Professional", price: "Custom", points: ["Rent collection", "Leasing", "Service requests", "Financial reports"] },
  { name: "Enterprise", price: "Custom", points: ["Multi-organization controls", "RBAC", "Support routing", "Marketplace operations"] },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-800">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold text-slate-950">Pricing</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Placeholder pricing for usability testing. Final prices remain editable through
          subscription management and should not be treated as permanent.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">{plan.name}</h2>
              <p className="mt-2 text-2xl font-bold text-brand-blue">{plan.price}</p>
              <ul className="mt-5 space-y-3 text-sm text-slate-600">
                {plan.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <Link
          href="/auth/register?role=landlord"
          className="mt-8 inline-flex rounded-md bg-brand-blue px-5 py-3 text-sm font-semibold text-white"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
