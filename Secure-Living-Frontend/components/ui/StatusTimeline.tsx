"use client";

import { Check, Circle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TimelineStep = {
  id: string;
  label: string;
  status: "complete" | "current" | "upcoming";
  timestamp?: string;
};

type StatusTimelineProps = {
  steps: TimelineStep[];
  className?: string;
};

export function StatusTimeline({ steps, className }: StatusTimelineProps) {
  return (
    <ol className={cn("relative space-y-0", className)} aria-label="Verification progress">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast ? (
              <div
                className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-0.5 bg-surface-border"
                aria-hidden
              />
            ) : null}
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-surface-border bg-surface-white">
              {step.status === "complete" ? (
                <Check className="h-4 w-4 text-brand-green" aria-hidden />
              ) : step.status === "current" ? (
                <Loader2
                  className="h-4 w-4 animate-spin text-brand-blue"
                  aria-hidden
                />
              ) : (
                <Circle className="h-3 w-3 text-[var(--text-muted)]" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <motion.p
                initial={false}
                animate={{ opacity: 1 }}
                className={cn(
                  "font-medium",
                  step.status === "upcoming"
                    ? "text-[var(--text-muted)]"
                    : "text-[var(--text-primary)]"
                )}
              >
                {step.label}
              </motion.p>
              {step.timestamp ? (
                <p className="font-mono-data mt-1 text-xs text-[var(--text-secondary)]">
                  {step.timestamp}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
