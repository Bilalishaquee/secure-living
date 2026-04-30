"use client";

import Link from "next/link";
import { useRef } from "react";
import { LogoShield } from "@/components/brand/LogoShield";
import { motion, useInView } from "framer-motion";
import { Shield, Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";

const cols = [
  {
    title: "Product",
    links: [
      { label: "Pricing", href: "/help" },
      { label: "Demo Videos", href: "/help" },
      { label: "Security", href: "/help" },
      { label: "API Access", href: "/help" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/help" },
      { label: "Contact Us", href: "/help" },
      { label: "Careers", href: "/help" },
      { label: "Affiliate Program", href: "/help" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/help" },
      { label: "Help Centre", href: "/help" },
      { label: "Community Forum", href: "/help" },
      { label: "Newsletter", href: "#newsletter" },
      { label: "Landlord Guide", href: "/help" },
      { label: "Tax Centre", href: "/help" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/help" },
      { label: "Privacy Policy", href: "/help" },
      { label: "Data Processing", href: "/help" },
      { label: "Responsible Disclosure", href: "/help" },
      { label: "Cookie Policy", href: "/help" },
    ],
  },
];

const contact = [
  { icon: Mail, label: "hello@secureliving.com" },
  { icon: Phone, label: "+254 700 000 000" },
  { icon: MapPin, label: "Nairobi, Kenya" },
];

function FadeIn({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

export function LandingFooter() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const bottomInView = useInView(bottomRef, { once: true });

  return (
    <footer className="relative overflow-hidden bg-slate-900 text-slate-300">
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          {/* Brand column */}
          <FadeIn delay={0}>
            <div className="max-w-xs flex-shrink-0">
              <LogoShield variant="light" size="md" />
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                Secure Living helps landlords and property managers across Kenya
                take full control of their portfolio — from rent collection to
                compliance, all in one platform.
              </p>

              <div className="mt-6 space-y-2.5">
                {contact.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 text-sm text-slate-400">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Trust badge */}
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-400">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                256-bit SSL · Bank-grade security
              </div>
            </div>
          </FadeIn>

          {/* Link columns */}
          <div className="grid flex-1 grid-cols-2 gap-10 sm:grid-cols-4 sm:gap-8">
            {cols.map((col, ci) => (
              <FadeIn key={col.title} delay={0.08 + ci * 0.07}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {col.title}
                  </p>
                  <ul className="mt-4 space-y-3">
                    {col.links.map((l) => (
                      <li key={l.href + l.label}>
                        <Link
                          href={l.href}
                          className="group inline-flex items-center gap-1 text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                        >
                          {l.label}
                          <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity duration-200 group-hover:opacity-60" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <motion.div
          ref={bottomRef}
          className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row"
          initial={{ opacity: 0 }}
          animate={bottomInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Secure Living, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {["Privacy", "Terms", "Cookies"].map((item) => (
              <Link
                key={item}
                href="/help"
                className="text-xs text-slate-500 transition-colors hover:text-slate-300"
              >
                {item}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
