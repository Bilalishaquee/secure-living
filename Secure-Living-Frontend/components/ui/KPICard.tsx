"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Accent = "green" | "blue" | "amber" | "red";

const accentBorder: Record<Accent, string> = {
  green: "border-l-brand-green",
  blue: "border-l-brand-blue",
  amber: "border-l-brand-gold",
  red: "border-l-brand-red",
};

function useCountUp(end: number, durationMs: number, enabled: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setV(Math.round(end * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, durationMs, enabled]);
  return v;
}

type KPICardProps = {
  label: string;
  value: string;
  sublabel?: string;
  icon: ReactNode;
  accent: Accent;
  trend?: ReactNode;
  action?: ReactNode;
  /** If set, animates this number and formats with KES prefix */
  countUpAmount?: number;
};

export function KPICard({
  label,
  value,
  sublabel,
  icon,
  accent,
  trend,
  action,
  countUpAmount,
}: KPICardProps) {
  const animated = useCountUp(countUpAmount ?? 0, 2000, countUpAmount != null);
  const display =
    countUpAmount != null
      ? `KES ${animated.toLocaleString("en-KE")}`
      : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex h-full w-full min-h-[11.5rem] flex-col rounded-xl border border-slate-200 border-l-4 bg-white p-5 font-sans shadow-[0_2px_12px_rgb(var(--rgb-ink)_/_0.05)] sm:min-h-[12rem] sm:p-6",
        accentBorder[accent]
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand-blue ring-1 ring-blue-100">
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[var(--text-secondary)]">{label}</p>
              <p className="font-display text-xl font-semibold italic tracking-tight tabular-nums text-[var(--text-primary)] sm:text-2xl">
                {display}
              </p>
              {sublabel ? (
                <p className="mt-1 text-xs leading-snug text-[var(--text-muted)]">{sublabel}</p>
              ) : null}
            </div>
          </div>
          {trend ? <div className="shrink-0 pt-0.5">{trend}</div> : null}
        </div>
        {/* Reserve one button row so all cards share the same height */}
        <div className="flex min-h-[2.25rem] shrink-0 items-end">
          {action ?? <span className="block w-full" aria-hidden />}
        </div>
      </div>
    </motion.div>
  );
}
