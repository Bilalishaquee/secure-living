import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ReminderItemProps = {
  icon: ReactNode;
  text: string;
  meta: string;
  className?: string;
  /** Fires when the overflow (⋯) control is activated */
  onAction?: () => void;
};

export function ReminderItem({ icon, text, meta, className, onAction }: ReminderItemProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-surface-border bg-surface-gray/50 p-3 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <span className="text-lg" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--text-primary)]">{text}</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{meta}</p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-lg p-1 text-[var(--text-muted)] hover:bg-surface-border/50 hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        aria-label="Reminder actions"
        onClick={onAction}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}
