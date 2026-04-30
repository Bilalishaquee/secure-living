"use client";

import { X } from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-2xl border border-surface-border bg-surface-white p-4 shadow-card",
            t.variant === "success" && "border-l-4 border-l-brand-green",
            t.variant === "error" && "border-l-4 border-l-brand-red",
            t.variant === "info" && "border-l-4 border-l-brand-blue"
          )}
        >
          <p className="flex-1 text-sm text-[var(--text-primary)]">{t.message}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
