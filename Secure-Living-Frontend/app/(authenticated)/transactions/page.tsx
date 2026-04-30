"use client";

import Link from "next/link";
import Image from "next/image";
import { Download, PlusCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/lib/toast-context";
import { formatKes } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

type TxRow = {
  id: string;
  createdAt: string;
  description: string | null;
  amountKes: number;
  status: string;
};

function downloadCsv(rows: TxRow[]) {
  const header = ["Date", "Description", "Amount (KES)", "Status"];
  const lines = rows.map((t) => [
    new Date(t.createdAt).toISOString().slice(0, 10),
    `"${(t.description ?? "").replace(/"/g, '""')}"`,
    String(t.amountKes),
    t.status,
  ]);
  const csv = [header.join(","), ...lines.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `secure-living-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<TxRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const res = await fetch("/api/v1/transactions", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (!res.ok) {
        setError("Unable to load transactions.");
        setRows([]);
        return;
      }
      const json = (await res.json()) as { data: TxRow[] };
      setRows(json.data);
      setError(null);
    })();
  }, [user]);

  const inflow = useMemo(() => rows.filter((t) => t.amountKes > 0).reduce((s, t) => s + t.amountKes, 0), [rows]);
  const outflow = useMemo(() => rows.filter((t) => t.amountKes < 0).reduce((s, t) => s + Math.abs(t.amountKes), 0), [rows]);

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Transactions</h1>
          <p className="app-page-lead">Escrow wallet and rent ledger from live transaction records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              downloadCsv(rows);
              toast("CSV file downloaded", "success");
            }}
          >
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
          <Button type="button" size="sm" asChild>
            <Link href="/transactions#ledger">
              <PlusCircle className="h-4 w-4" aria-hidden />
              Record manual
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/80 shadow-[0_16px_48px_rgb(var(--rgb-ink)_/_0.1)]">
        <Image
          src="/images/property/transactions-banner.jpg"
          alt="Property finance workspace"
          width={1600}
          height={560}
          className="h-40 w-full object-cover sm:h-48"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1f38]/75 via-[#0f1f38]/45 to-transparent" />
        <p className="absolute bottom-4 left-4 max-w-xl text-sm font-medium text-white/90 sm:bottom-5 sm:left-5 sm:text-base">
          Monitor rent inflows, escrow releases, and complete transaction history for each property.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white/90">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Inflow
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-emerald-800">
              +{formatKes(inflow)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Outflow
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-brand-navy">
              −{formatKes(outflow)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Net
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-brand-blue">
              {formatKes(inflow - outflow)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card id="ledger">
        <CardContent className="p-0">
          <div className="app-touch-x-scroll overflow-x-auto rounded-b-xl">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50/95 via-white to-sky-50/40 text-[var(--text-secondary)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white/50">
                {rows.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-sky-50/50">
                    <td className="px-4 py-3 font-mono-data text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{t.description ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">
                      {t.amountKes === 0
                        ? "—"
                        : `${t.amountKes > 0 ? "+" : ""}${formatKes(Math.abs(t.amountKes))}`}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          t.status === "failed"
                            ? "error"
                            : t.status === "pending"
                              ? "warning"
                              : "success"
                        }
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => toast(`Reference: ${t.id}`, "info")}
                      >
                        Reference
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
                      {error ?? "No transactions yet."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
