"use client";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  id?: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export function Switch({
  checked,
  onCheckedChange,
  id,
  label,
  description,
  disabled,
}: SwitchProps) {
  const sid = id ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-surface-border bg-surface-gray/40 px-4 py-3">
      <div className="min-w-0">
        <label htmlFor={sid} className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>
        ) : null}
      </div>
      <button
        id={sid}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-brand-blue" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-6 w-6 translate-x-0.5 rounded-full bg-white shadow ring-1 ring-black/5 transition",
            checked && "translate-x-[1.375rem]"
          )}
        />
      </button>
    </div>
  );
}
