"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { AuditLogRow } from "@/components/ui/AuditLogRow";
import { SlideOver } from "@/components/ui/SlideOver";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

type AuditLogEntry = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: "Auth" | "RBAC" | "Properties" | "Transactions" | "KYC";
  ip: string;
  status: "Success" | "Failed" | "Warning";
  description?: string;
  metadata?: Record<string, string | number | boolean>;
  sessionId?: string;
};

function mapModule(resourceType: string): AuditLogEntry["module"] {
  if (resourceType.includes("kyc")) return "KYC";
  if (resourceType.includes("role") || resourceType.includes("permission")) return "RBAC";
  if (resourceType.includes("property")) return "Properties";
  if (resourceType.includes("auth")) return "Auth";
  return "Transactions";
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [userQ, setUserQ] = useState("");
  const [module, setModule] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [detail, setDetail] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const res = await fetch("/api/v1/audit-logs", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as {
        data: {
          id: string;
          timestamp: string;
          userId: string;
          action: string;
          resourceType: string;
          beforeJson: string | null;
          afterJson: string | null;
        }[];
      };
      setLogs(
        json.data.map((l) => ({
          id: l.id,
          timestamp: l.timestamp,
          user: l.userId,
          action: l.action,
          module: mapModule(l.resourceType),
          ip: "server",
          status: "Success",
          metadata: l.afterJson ? (JSON.parse(l.afterJson) as Record<string, string | number | boolean>) : {},
        }))
      );
    })();
  }, [user]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (userQ && !l.user.toLowerCase().includes(userQ.toLowerCase())) return false;
      if (module !== "All" && l.module !== module) return false;
      if (status !== "All" && l.status !== status) return false;
      return true;
    });
  }, [logs, userQ, module, status]);

  const exportCsv = () => {
    const header = ["Timestamp", "User", "Action", "Module", "Status", "IP"];
    const rows = filtered.map((l) => [
      l.timestamp,
      `"${l.user.replace(/"/g, '""')}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      l.module,
      l.status,
      l.ip,
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${filtered.length} row(s) to CSV`, "success");
  };

  const applyDateFilter = () => {
    toast("Date range applied to current view", "info");
  };

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Audit logs</h1>
          <p className="app-page-lead">Immutable record — read-only, monospace metadata</p>
        </div>
      </div>

      <div className="app-glass-panel flex flex-col gap-4 p-4 xs:flex-row xs:flex-wrap xs:items-end">
        <div>
          <label htmlFor="from" className="text-xs font-medium text-[var(--text-muted)]">
            From
          </label>
          <input
            id="from"
            type="date"
            className="mt-1 block rounded-lg border border-surface-border px-3 py-2 text-sm font-mono-data focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            defaultValue="2026-03-01"
          />
        </div>
        <div>
          <label htmlFor="to" className="text-xs font-medium text-[var(--text-muted)]">
            To
          </label>
          <input
            id="to"
            type="date"
            className="mt-1 block rounded-lg border border-surface-border px-3 py-2 text-sm font-mono-data focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            defaultValue="2026-04-01"
          />
        </div>
        <div className="min-w-0 w-full flex-1 xs:min-w-[140px]">
          <label htmlFor="user-search" className="text-xs font-medium text-[var(--text-muted)]">
            User
          </label>
          <input
            id="user-search"
            className="mt-1 w-full rounded-lg border border-surface-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            placeholder="Search user"
            value={userQ}
            onChange={(e) => setUserQ(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="mod" className="text-xs font-medium text-[var(--text-muted)]">
            Module
          </label>
          <select
            id="mod"
            className="mt-1 block rounded-lg border border-surface-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            value={module}
            onChange={(e) => setModule(e.target.value)}
          >
            <option>All</option>
            <option>Auth</option>
            <option>RBAC</option>
            <option>Properties</option>
            <option>Transactions</option>
            <option>KYC</option>
          </select>
        </div>
        <div>
          <label htmlFor="st" className="text-xs font-medium text-[var(--text-muted)]">
            Status
          </label>
          <select
            id="st"
            className="mt-1 block rounded-lg border border-surface-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>All</option>
            <option>Success</option>
            <option>Failed</option>
            <option>Warning</option>
          </select>
        </div>
        <Button type="button" variant="secondary" onClick={applyDateFilter}>
          Apply dates
        </Button>
        <Button type="button" variant="outline" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="app-glass-panel app-touch-x-scroll overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50/95 via-white to-sky-50/40 font-mono-data text-xs uppercase tracking-wide text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Module</th>
              <th className="px-4 py-3 font-medium">IP Address</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <AuditLogRow
                key={entry.id}
                entry={entry}
                onSelect={() => setDetail(entry)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <SlideOver
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        title="Log detail"
      >
        {detail ? (
          <div className="space-y-4 font-mono-data text-xs">
            <div>
              <p className="text-[10px] uppercase text-[var(--text-muted)]">Action</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{detail.action}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-[var(--text-muted)]">Description</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">
                {detail.description ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-[var(--text-muted)]">User</p>
              <p className="mt-1">{detail.user}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-[var(--text-muted)]">Session</p>
              <p className="mt-1 break-all">{detail.sessionId ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-[var(--text-muted)]">Metadata</p>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-slate-200/60 bg-slate-50/70 p-3 text-[11px] leading-relaxed backdrop-blur-sm">
                {JSON.stringify(detail.metadata ?? {}, null, 2)}
              </pre>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              This entry is immutable — no edits or deletes from the UI.
            </p>
          </div>
        ) : null}
      </SlideOver>
    </div>
  );
}
