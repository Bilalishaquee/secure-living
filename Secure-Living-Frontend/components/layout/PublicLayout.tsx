import type { ReactNode } from "react";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-surface-white pb-[var(--safe-bottom)] font-sans">
      {children}
    </div>
  );
}
