"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T extends object> = {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  className?: string;
};

export function DataTable<T extends object>({
  data,
  columns,
  rowKey,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey as keyof T];
      const bv = b[sortKey as keyof T];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const toggleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div
      className={cn(
        "app-touch-x-scroll overflow-x-auto rounded-xl border border-white/80 bg-white/85 font-sans shadow-[0_8px_32px_rgb(var(--rgb-ink)_/_0.06)] ring-1 ring-brand-blue/[0.05] backdrop-blur-sm",
        className
      )}
    >
      <table className="w-full min-w-[640px] text-left text-sm font-sans tabular-nums">
        <thead className="bg-gradient-to-r from-slate-50/95 via-white to-sky-50/40 text-[var(--text-secondary)]">
          <tr>
            {columns.map((col) => {
              const keyStr = String(col.key);
              return (
                <th key={keyStr} className={cn("px-4 py-3 font-medium", col.className)}>
                  {col.sortable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="-ml-2 h-auto px-2 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      onClick={() => toggleSort(keyStr, col.sortable)}
                    >
                      {col.header}
                      {sortKey === keyStr ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="ml-1 h-3 w-3" />
                        ) : (
                          <ArrowDown className="ml-1 h-3 w-3" />
                        )
                      ) : null}
                    </Button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60 bg-white/60">
          {sorted.map((row) => (
            <tr key={rowKey(row)} className="transition-colors hover:bg-sky-50/50">
              {columns.map((col) => {
                const keyStr = String(col.key);
                const cell = col.render
                  ? col.render(row)
                  : String(row[col.key as keyof T] ?? "");
                return (
                  <td key={keyStr} className={cn("px-4 py-3", col.className)}>
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
