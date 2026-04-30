"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoShield } from "@/components/brand/LogoShield";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const featureLinks = [
  { label: "Accounting", href: "#newsletter" },
  { label: "Leasing", href: "#newsletter" },
  { label: "Tenant Screening", href: "#newsletter" },
  { label: "Landlord Banking", href: "#newsletter" },
  { label: "Rent Collection", href: "#newsletter" },
  { label: "Investment Properties", href: "#newsletter" },
];

const resourceLinks = [
  { label: "Tax Center", href: "/help" },
  { label: "Blog", href: "/help" },
  { label: "Help Center", href: "/help" },
  { label: "Forums", href: "/help" },
  { label: "Newsletter", href: "#newsletter" },
  { label: "Landlord Insurance", href: "/help" },
  { label: "Preferred Services", href: "/help" },
];

const residentLinks = [
  { label: "Register / Log In", href: "/auth/login" },
  { label: "Pay Rent", href: "/auth/register" },
  { label: "Complete Screening", href: "/auth/register" },
  { label: "Find a Home", href: "/listings" },
  { label: "Get Renters Insurance", href: "/help" },
];

type DropdownKey = "features" | "resources" | "residents" | null;

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState<DropdownKey>(null);
  const closeTimerRef = useRef<number | null>(null);

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
            href="/help"
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Pricing
          </Link>
          <NavDropdown label="Resources" k="resources" items={resourceLinks} />
          <NavDropdown label="Residents" k="residents" items={residentLinks} />
        </nav>

        <div className="z-[110] hidden items-center gap-2 lg:flex">
          <Button variant="ghost" asChild>
            <Link href="/auth/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
              Landlord Log In
            </Link>
          </Button>
          <Button asChild className="rounded-md bg-brand-blue px-4 font-semibold text-white hover:bg-brand-blue/90">
            <Link href="/auth/register">Landlord Sign Up</Link>
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
              <Link
                href="/auth/register"
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
                href="/help"
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
