"use client";

import * as Switch from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

type PermissionToggleProps = {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  id: string;
};

export function PermissionToggle({
  checked,
  onCheckedChange,
  disabled,
  label,
  id,
}: PermissionToggleProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-200 transition-colors data-[state=checked]:bg-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700"
        )}
        aria-label={label}
      >
        <Switch.Thumb
          className={cn(
            "block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform will-change-transform data-[state=checked]:translate-x-[22px]"
          )}
        />
      </Switch.Root>
      <span className="sr-only">{label}</span>
    </div>
  );
}
