"use client";

import type { AuditLogEntry } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type AuditLogRowProps = {
  entry: AuditLogEntry;
  onSelect: () => void;
};

function formatTs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-KE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function AuditLogRow({ entry, onSelect }: AuditLogRowProps) {
  const border =
    entry.status === "Failed"
      ? "border-l-4 border-l-brand-red"
      : entry.status === "Warning"
        ? "border-l-4 border-l-brand-gold"
        : "";

  return (
    <tr
      className={cn(
        "cursor-pointer border-b border-surface-border transition-colors hover:bg-surface-gray/80 focus-within:bg-surface-gray/80",
        border
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${entry.action}`}
    >
      <td className="whitespace-nowrap px-4 py-3 font-mono-data text-xs text-[var(--text-primary)]">
        {formatTs(entry.timestamp)}
      </td>
      <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{entry.user}</td>
      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{entry.action}</td>
      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{entry.module}</td>
      <td className="px-4 py-3 font-mono-data text-xs text-[var(--text-muted)]">
        {entry.ip}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            entry.status === "Success" && "bg-emerald-100 text-emerald-800",
            entry.status === "Failed" && "bg-red-100 text-red-800",
            entry.status === "Warning" && "bg-amber-100 text-amber-900"
          )}
        >
          {entry.status}
        </span>
      </td>
    </tr>
  );
}
