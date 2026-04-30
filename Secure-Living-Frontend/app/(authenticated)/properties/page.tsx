"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";

type PropertyRow = {
  id: string;
  name: string;
  propertyType: string;
  addressLine1: string;
  city: string | null;
  county: string | null;
  status: string;
  totalUnits: number | null;
};

export default function PropertiesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PropertyRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const res = await fetch("/api/v1/properties", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (!res.ok) {
        setError("Failed to load properties.");
        return;
      }
      const json = (await res.json()) as { data: PropertyRow[] };
      setRows(json.data);
    })();
  }, [user?.id, user?.authToken]);

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Properties</h1>
          <p className="app-page-lead">Portfolio across Nairobi and Mombasa</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/properties/new">+ Add Property</Link>
        </Button>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-white/80 shadow-[0_16px_48px_rgb(var(--rgb-ink)_/_0.1)]">
        <Image
          src="/images/property/properties-banner.jpg"
          alt="Apartment portfolio overview"
          width={1600}
          height={560}
          priority
          className="h-40 w-full object-cover sm:h-48"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1f38]/75 via-[#0f1f38]/45 to-transparent" />
        <p className="absolute bottom-4 left-4 max-w-xl text-sm font-medium text-white/90 sm:bottom-5 sm:left-5 sm:text-base">
          Track occupancy, inspections, and rent status across your managed property portfolio.
        </p>
      </div>
      <div className="space-y-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {rows.map((p) => (
          <Link
            key={p.id}
            href={`/properties/${p.id}`}
            className="block rounded-2xl border border-surface-border bg-white p-4 shadow-sm hover:border-brand-blue/40"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">{p.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {p.propertyType} · {p.city ?? p.county ?? "Kenya"}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{p.addressLine1}</p>
              </div>
              <div className="text-right">
                <p className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize">{p.status}</p>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Units: {p.totalUnits ?? "—"}
                </p>
              </div>
            </div>
          </Link>
        ))}
        {!rows.length && !error ? (
          <p className="text-sm text-[var(--text-secondary)]">No properties yet.</p>
        ) : null}
      </div>
    </div>
  );
}
