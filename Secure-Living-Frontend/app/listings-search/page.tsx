"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bath, BedDouble, Building2, Home, MapPin, Search, ShieldCheck, UserRound, Wrench } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { formatKes } from "@/lib/utils";

type PublicListing = {
  id: string;
  title: string;
  description: string | null;
  rentAmount: number;
  currency: string;
  furnished?: boolean;
  petFriendly?: boolean;
  photos?: string[];
  photo?: string | null;
  escrowBadge: boolean;
  fullyCoveredBadge: boolean;
  unitType?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  unit?: {
    unitNumber: string;
    unitType: string;
    bedrooms: number | null;
    bathrooms: number | null;
    sizeSqft: number | null;
  };
};

type PublicSearchResults = {
  listings: PublicListing[];
  properties: {
    id: string;
    name: string;
    propertyType: string;
    location: string;
    photo: string | null;
    totalUnits: number | null;
  }[];
  locations: { id: string; name: string; propertyCount: number; listingCount: number }[];
  agents: {
    id: string;
    name: string;
    specializations: string[];
    coverageAreas: string[];
    verificationLevel: string;
    trustScore: number;
  }[];
  services: { id: string; slug: string; name: string; tagline: string | null }[];
};

const EMPTY_RESULTS: PublicSearchResults = {
  listings: [],
  properties: [],
  locations: [],
  agents: [],
  services: [],
};

function getInitialQuery() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

function resultCount(results: PublicSearchResults) {
  return results.listings.length + results.properties.length + results.locations.length + results.agents.length + results.services.length;
}

function listingMatches(listing: PublicListing, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    listing.title,
    listing.description ?? "",
    listing.unit?.unitType ?? listing.unitType ?? "",
  ].some((value) => value.toLowerCase().includes(q));
}

// Public, unauthenticated visitor search page. Browsing/searching is public;
// applying for a listing still routes through the tenant application flow.
export default function PublicListingsSearchPage() {
  const [browseListings, setBrowseListings] = useState<PublicListing[]>([]);
  const [results, setResults] = useState<PublicSearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(getInitialQuery());
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/listings?public=true");
        if (res.ok) {
          const json = (await res.json()) as { data: PublicListing[] };
          setBrowseListings(json.data ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setResults(EMPTY_RESULTS);
      setSearchLoading(false);
      return;
    }

    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      setSearchLoading(true);
      fetch(`/api/v1/public/search?q=${encodeURIComponent(q)}&limit=12`, { signal: ctrl.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((json: { data?: PublicSearchResults } | null) => {
          setResults(json?.data ?? EMPTY_RESULTS);
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setResults(EMPTY_RESULTS);
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setSearchLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [search]);

  const filteredBrowseListings = useMemo(
    () => browseListings.filter((listing) => listingMatches(listing, search)),
    [browseListings, search],
  );

  const isSearching = search.trim().length >= 2;
  const hasResults = resultCount(results) > 0;

  return (
    <PublicLayout>
      <LandingNavbar />
      <main className="relative bg-white pt-[4.5rem] sm:pt-24">
        <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Search Secure Living
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-600">
              Find properties, locations, agents, and services without creating an account.
            </p>
            <div className="relative mt-6 max-w-2xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search properties, locations, agents, or services"
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                aria-label="Search properties, locations, agents, and services"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {isSearching ? (
            searchLoading && !hasResults ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : !hasResults ? (
              <EmptyState title="No public matches found" body="Try a different property, location, agent, or service keyword." />
            ) : (
              <div className="space-y-10">
                {results.listings.length > 0 && (
                  <ResultSection icon={Home} title="Available Homes">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {results.listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
                    </div>
                  </ResultSection>
                )}

                {results.properties.length > 0 && (
                  <ResultSection icon={Building2} title="Properties">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {results.properties.map((property) => (
                        <PublicResultCard
                          key={property.id}
                          title={property.name}
                          subtitle={property.location}
                          body={[property.propertyType, property.totalUnits ? `${property.totalUnits} units` : ""].filter(Boolean).join(" · ")}
                          href={`/listings-search?q=${encodeURIComponent(property.name)}`}
                        />
                      ))}
                    </div>
                  </ResultSection>
                )}

                {results.locations.length > 0 && (
                  <ResultSection icon={MapPin} title="Locations">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {results.locations.map((location) => (
                        <PublicResultCard
                          key={location.id}
                          title={location.name}
                          subtitle={`${location.propertyCount} properties`}
                          body={location.listingCount > 0 ? `${location.listingCount} public listings available` : "Browse properties in this area"}
                          href={`/listings-search?q=${encodeURIComponent(location.name)}`}
                        />
                      ))}
                    </div>
                  </ResultSection>
                )}

                {results.agents.length > 0 && (
                  <ResultSection icon={UserRound} title="Agents & Providers">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {results.agents.map((agent) => (
                        <PublicResultCard
                          key={agent.id}
                          title={agent.name}
                          subtitle={agent.verificationLevel}
                          body={[
                            agent.specializations.slice(0, 3).join(", "),
                            agent.coverageAreas.length ? `Covers ${agent.coverageAreas.slice(0, 2).join(", ")}` : "",
                          ].filter(Boolean).join(" · ")}
                          href={`/listings-search?q=${encodeURIComponent(agent.name)}`}
                        />
                      ))}
                    </div>
                  </ResultSection>
                )}

                {results.services.length > 0 && (
                  <ResultSection icon={Wrench} title="Services">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {results.services.map((service) => (
                        <PublicResultCard
                          key={service.id}
                          title={service.name}
                          subtitle="Service"
                          body={service.tagline ?? "View service details"}
                          href={`/services/${service.slug}`}
                        />
                      ))}
                    </div>
                  </ResultSection>
                )}
              </div>
            )
          ) : loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : filteredBrowseListings.length === 0 ? (
            <EmptyState title="No listings available right now" body="Check back soon. New listings are added regularly." />
          ) : (
            <ResultSection icon={Home} title="Available Homes">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBrowseListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            </ResultSection>
          )}
        </div>
      </main>
      <LandingFooter />
    </PublicLayout>
  );
}

function ResultSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Home;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-brand-blue">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ListingCard({ listing }: { listing: PublicListing }) {
  const photo = listing.photo ?? listing.photos?.[0] ?? null;
  const unitType = listing.unit?.unitType ?? listing.unitType ?? "Rental";
  const bedrooms = listing.unit?.bedrooms ?? listing.bedrooms;
  const bathrooms = listing.unit?.bathrooms ?? listing.bathrooms;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-40 w-full bg-slate-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Home className="h-10 w-10" />
          </div>
        )}
        {(listing.escrowBadge || listing.fullyCoveredBadge) && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <ShieldCheck className="h-3 w-3" />
            {listing.escrowBadge ? "Escrow Protected" : "Fully Covered"}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900">{listing.title}</h3>
        <p className="mt-1 text-lg font-bold text-brand-blue">
          {formatKes(listing.rentAmount)}
          <span className="text-xs font-normal text-slate-400">/month</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {bedrooms != null && (
            <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {bedrooms} bd</span>
          )}
          {bathrooms != null && (
            <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {bathrooms} ba</span>
          )}
          <span>{unitType}</span>
        </div>
        <Link
          href={`/tenant/apply/${listing.id}`}
          className="mt-4 block rounded-lg bg-brand-blue py-2 text-center text-sm font-semibold text-white hover:bg-brand-blue/90"
        >
          Apply Now
        </Link>
      </div>
    </div>
  );
}

function PublicResultCard({
  title,
  subtitle,
  body,
  href,
}: {
  title: string;
  subtitle: string;
  body: string;
  href: string;
}) {
  return (
    <Link href={href} className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-blue/40 hover:shadow-md">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand-blue">{subtitle}</p>
      {body ? <p className="mt-2 line-clamp-2 text-sm text-slate-600">{body}</p> : null}
    </Link>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-24 text-center">
      <Home className="mx-auto mb-4 h-12 w-12 text-slate-300" />
      <p className="text-lg font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}
