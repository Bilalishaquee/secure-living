"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

type TabsProps = {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
};

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-label="Dashboard preview tabs"
        className="flex flex-wrap gap-2 border-b border-surface-border pb-2"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue",
                isActive
                  ? "text-brand-blue"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {tab.label}
              {isActive ? (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-x-2 -bottom-2 h-0.5 rounded-full bg-brand-blue"
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="mt-6 min-h-[280px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.id}
            id={`panel-${current?.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${current?.id}`}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
          >
            {current?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
