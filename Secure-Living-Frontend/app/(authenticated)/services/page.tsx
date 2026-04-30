"use client";

import { Calendar, Headphones, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

type Professional = {
  id: string;
  profession: string;
  skillsCsv: string;
  verificationStatus: string;
  rating: number;
};

const iconMap = {
  blue: Headphones,
  teal: Wrench,
  gold: Calendar,
} as const;

export default function ServicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Professional[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const res = await fetch("/api/v1/professionals", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (!res.ok) {
        setError("Unable to load professionals.");
        setRows([]);
        return;
      }
      const json = (await res.json()) as { data: Professional[] };
      setRows(json.data);
      setError(null);
    })();
  }, [user]);

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Services</h1>
          <p className="app-page-lead">
            Coordinate verified professionals and service execution assignments.
          </p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {rows.map((pro) => {
          const tone = pro.verificationStatus === "verified" ? "teal" : pro.verificationStatus === "pending" ? "blue" : "gold";
          const Icon = iconMap[tone];
          return (
            <Card
              key={pro.id}
              className={cn(
                "group overflow-hidden border-2 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgb(var(--rgb-primary)_/_0.12)]",
                tone === "blue" && "border-brand-blue/20 bg-gradient-to-b from-white to-escrow/50",
                tone === "teal" && "border-brand-teal/25 bg-gradient-to-b from-white to-teal-50/40",
                tone === "gold" && "border-amber-200/80 bg-gradient-to-b from-white to-amber-50/50"
              )}
            >
              <CardContent className="p-6">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner",
                    tone === "blue" && "bg-brand-blue/10 text-brand-blue",
                    tone === "teal" && "bg-brand-teal/10 text-brand-teal",
                    tone === "gold" && "bg-amber-100 text-amber-800"
                  )}
                >
                  <Icon className="h-7 w-7" aria-hidden />
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold text-brand-navy">
                  {pro.profession}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  Skills: {pro.skillsCsv} | Rating: {pro.rating.toFixed(1)}
                </p>
                <Button
                  type="button"
                  className="mt-5 w-full"
                  variant={pro.verificationStatus === "verified" ? "secondary" : "outline"}
                  onClick={() => toast(`Professional ${pro.id} selected for assignment`, "success")}
                >
                  Select Professional
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {rows.length === 0 ? (
          <Card className="md:col-span-3">
            <CardContent className="p-6 text-sm text-[var(--text-secondary)]">
              {error ?? "No professionals available."}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
