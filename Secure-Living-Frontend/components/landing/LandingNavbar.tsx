"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoShield } from "@/components/brand/LogoShield";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const featureLinks = [
  { label: "Accounting", href: "/auth/register?role=landlord&next=/accounting" },
  { label: "Leasing", href: "/auth/register?role=landlord&next=/leasing" },
  { label: "Tenant Screening", href: "/auth/register?role=landlord&next=/screening" },
  { label: "Landlord Banking", href: "/auth/register?role=landlord&next=/banking" },
  { label: "Rent Collection", href: "/auth/register?role=landlord&next=/rent-collection" },
  { label: "Investment Properties", href: "/auth/register?role=landlord&next=/investments" },
];

const resourceLinks = [
  { label: "Tax Center", href: "/resources#market-insights" },
  { label: "Blog", href: "/resources#market-insights" },
  { label: "Help Center", href: "/help" },
  { label: "Forums", href: "/resources#help-center" },
  { label: "Newsletter", href: "#newsletter" },
  { label: "Landlord Insurance", href: "/help/landlord" },
  { label: "Preferred Services", href: "/#supporting-services" },
];

const residentLinks = [
  { label: "Register / Log In", href: "/auth/login" },
  { label: "Pay Rent", href: "/auth/register?role=tenant&next=/tenant/lease/payments" },
  { label: "Complete Screening", href: "/auth/register?role=tenant&next=/screening" },
  { label: "Find a Home", href: "/listings-search" },
  { label: "Get Renters Insurance", href: "/help/tenant" },
];

type PublicSearchResults = {
  listings: { id: string; title: string; rentAmount: number; currency: string }[];
  properties: { id: string; name: string; location: string; propertyType?: string }[];
  locations: { id: string; name: string; propertyCount: number; listingCount: number }[];
  agents: { id: string; name: string; specializations: string[]; coverageAreas: string[]; verificationLevel?: string }[];
  services: { id: string; slug: string; name: string; tagline: string | null }[];
};

type DropdownKey = "features" | "resources" | "residents" | null;

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState<DropdownKey>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PublicSearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const searchDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openDropdown = (key: Exclude<DropdownKey, null>) => {
    clearCloseTimer();
    setDd(key);
  };

  const scheduleCloseDropdown = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setDd(null), 140);
  };

  const NavDropdown = ({
    label,
    k,
    items,
  }: {
    label: string;
    k: Exclude<DropdownKey, null>;
    items: { label: string; href: string }[];
  }) => (
    <div
      className="relative"
      onMouseEnter={() => openDropdown(k)}
      onMouseLeave={scheduleCloseDropdown}
    >
      <button
        type="button"
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
        aria-expanded={dd === k}
        aria-haspopup="true"
        onClick={() => setDd((prev) => (prev === k ? null : k))}
        onFocus={() => openDropdown(k)}
      >
        {label}
        <ChevronDown
          className={cn("h-4 w-4 text-slate-500 transition-transform", dd === k && "rotate-180")}
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {dd === k ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-full z-[110] mt-1 min-w-[220px] overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg"
            role="menu"
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleCloseDropdown}
          >
            {items.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="block px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                role="menuitem"
                onClick={() => setDd(null)}
                onFocus={clearCloseTimer}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  useEffect(() => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    const q = search.trim();
    if (q.length < 2) {
      setResults(null);
      setShowResults(false);
      return;
    }
    searchDebounceRef.current = window.setTimeout(() => {
      setSearching(true);
      fetch(`/api/v1/public/search?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => { if (json?.data) { setResults(json.data); setShowResults(true); } })
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 250);
    return () => { if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current); };
  }, [search]);

  const hasResults = !!results && (
    results.listings.length + results.properties.length + results.locations.length + results.agents.length + results.services.length > 0
  );

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (q.length >= 2) window.location.href = `/listings-search?q=${encodeURIComponent(q)}`;
  };

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed left-0 right-0 top-0 z-[100] w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm transition-shadow",
        scrolled || open ? "shadow-sm" : "shadow-none"
      )}
    >
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between px-4 sm:min-h-[3.75rem] sm:px-6 lg:px-8">
        <Link
          href="/"
          className="z-[110] flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
        >
          <LogoShield variant="dark" size="md" priority />
        </Link>

        <nav className="z-[110] hidden items-center gap-1 lg:flex" aria-label="Primary">
          <NavDropdown label="Features" k="features" items={featureLinks} />
          <Link
            href="/pricing"
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Pricing
          </Link>
          <NavDropdown label="Resources" k="resources" items={resourceLinks} />
          <NavDropdown label="Residents" k="residents" items={residentLinks} />
        </nav>

        <div className="z-[110] hidden items-center gap-2 lg:flex">
          <form onSubmit={onSearchSubmit} className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => { if (hasResults) setShowResults(true); }}
              onBlur={() => window.setTimeout(() => setShowResults(false), 150)}
              placeholder="Search properties, agents, services…"
              className="h-9 w-44 rounded-md border border-slate-200 bg-white pl-8 pr-2 text-sm text-slate-700 outline-none transition focus:w-72 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              aria-label="Search properties, locations, agents, and services"
            />
            <AnimatePresence>
              {showResults && search.trim().length >= 2 ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-[120] mt-1 max-h-96 w-80 overflow-y-auto rounded-md border border-slate-200 bg-white py-2 shadow-lg"
                >
                  {searching ? (
                    <p className="px-4 py-3 text-sm text-slate-400">Searching…</p>
                  ) : !hasResults ? (
                    <p className="px-4 py-3 text-sm text-slate-400">No matches for &quot;{search.trim()}&quot;</p>
                  ) : (
                    <>
                      {results!.listings.length > 0 && (
                        <SearchGroup title="Listings">
                          {results!.listings.map((l) => (
                            <Link key={l.id} href={`/listings-search?q=${encodeURIComponent(search.trim())}`} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              {l.title} <span className="text-slate-400">— {l.currency} {l.rentAmount.toLocaleString()}/mo</span>
                            </Link>
                          ))}
                        </SearchGroup>
                      )}
                      {results!.properties.length > 0 && (
                        <SearchGroup title="Properties">
                          {results!.properties.map((p) => (
                            <Link key={p.id} href={`/listings-search?q=${encodeURIComponent(p.name)}`} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              {p.name} <span className="text-slate-400">— {p.location}</span>
                            </Link>
                          ))}
                        </SearchGroup>
                      )}
                      {results!.locations.length > 0 && (
                        <SearchGroup title="Locations">
                          {results!.locations.map((location) => (
                            <Link key={location.id} href={`/listings-search?q=${encodeURIComponent(location.name)}`} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              {location.name} <span className="text-slate-400">— {location.propertyCount} properties</span>
                            </Link>
                          ))}
                        </SearchGroup>
                      )}
                      {results!.agents.length > 0 && (
                        <SearchGroup title="Agents & Providers">
                          {results!.agents.map((a) => (
                            <Link key={a.id} href={`/listings-search?q=${encodeURIComponent(a.name)}`} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              {a.name} <span className="text-slate-400">— {a.specializations.join(", ")}</span>
                            </Link>
                          ))}
                        </SearchGroup>
                      )}
                      {results!.services.length > 0 && (
                        <SearchGroup title="Services">
                          {results!.services.map((s) => (
                            <Link key={s.id} href={`/services/${s.slug}`} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              {s.name}
                            </Link>
                          ))}
                        </SearchGroup>
                      )}
                    </>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </form>
          <Button variant="ghost" asChild>
            <Link href="/auth/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
              Log In
            </Link>
          </Button>
          <Button asChild className="rounded-md bg-brand-blue px-4 font-semibold text-white hover:bg-brand-blue/90">
            <Link href="/auth/register?role=landlord">Sign Up</Link>
          </Button>
        </div>

        <button
          type="button"
          className="z-[110] rounded-md border border-slate-200 bg-white p-2 text-slate-800 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-slate-200 bg-white lg:hidden"
          >
            <div className="flex flex-col gap-0.5 px-4 py-4">
              <form onSubmit={onSearchSubmit} className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search properties, locations, agents, services"
                  className="w-full rounded-md border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  aria-label="Search properties, locations, agents, and services"
                />
              </form>
              <Link
                href="/auth/register?role=landlord"
                className="mb-2 rounded-md bg-brand-blue py-3 text-center text-sm font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                Sign up
              </Link>
              <Link
                href="/auth/login"
                className="rounded-md py-2.5 text-center text-sm font-semibold text-slate-700"
                onClick={() => setOpen(false)}
              >
                Log in
              </Link>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Features
              </p>
              {featureLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md py-2 pl-1 text-sm text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/pricing"
                className="rounded-md py-2 pl-1 text-sm text-slate-700"
                onClick={() => setOpen(false)}
              >
                Pricing
              </Link>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Resources
              </p>
              {resourceLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md py-2 pl-1 text-sm text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Residents
              </p>
              {residentLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md py-2 pl-1 text-sm text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}

function SearchGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-1 last:border-b-0">
      <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      {children}
    </div>
  );
}
