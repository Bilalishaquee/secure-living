"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatKes } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { TrendingUp, TrendingDown } from "lucide-react";


const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Summary = {
  periodYear: number;
  periodMonth: number;
  openingBalance: number;
  totalRentDue: number;
  totalCollected: number;
  totalArrears: number;
  closingBalance: number;
  totalExpenses: number;
};

export default function AccountingPage() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [history, setHistory] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [sr, hr] = await Promise.all([
        fetch(`/api/v1/accounting/monthly-summary?year=${year}&month=${month}`, { headers: { Authorization: `Bearer ${user?.authToken}` } }),
        fetch(`/api/v1/accounting/monthly-summary/history`, { headers: { Authorization: `Bearer ${user?.authToken}` } }),
      ]);
      if (sr.ok) setSummary((await sr.json()).data);
      if (hr.ok) setHistory((await hr.json()).data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken, year, month]);

  const maxVal = history.length ? Math.max(...history.map((h) => Math.max(h.totalRentDue, h.totalCollected)), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Accounting</h1>
        <p className="mt-1 text-sm text-slate-500">Monthly rent summaries, collections, and expense tracking</p>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Period:</label>
        <select
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
        >
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
        >
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Monthly Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary — {MONTHS[(summary?.periodMonth ?? month) - 1]} {summary?.periodYear ?? year}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />)}
            </div>
          ) : !summary ? (
            <p className="text-sm text-slate-500">No data for this period</p>
          ) : (
            <div className="space-y-1">
              {[
                { label: "Opening Balance", value: summary.openingBalance, color: "" },
                { label: "+ Rent Due", value: summary.totalRentDue, color: "" },
                { label: "+ Collected", value: summary.totalCollected, color: "text-green-700" },
                { label: "− Arrears", value: -summary.totalArrears, color: summary.totalArrears > 0 ? "text-red-600" : "" },
                { label: "− Expenses", value: -summary.totalExpenses, color: "" },
                { label: "= Closing Balance", value: summary.closingBalance, color: "font-bold", border: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 ${row.border ? "border border-slate-200 bg-slate-50" : "bg-white"}`}
                >
                  <span className="text-sm text-slate-700">{row.label}</span>
                  <span className={`font-mono text-sm ${row.color}`}>
                    {formatKes(Math.abs(row.value))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6-Month Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>6-Month Trend — Rent Due vs Collected</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No history data yet</p>
          ) : (
            <div className="flex items-end gap-3 overflow-x-auto pb-2 pt-4">
              {[...history].reverse().slice(0, 6).map((h) => {
                const dueH = Math.round((h.totalRentDue / maxVal) * 100);
                const colH = Math.round((h.totalCollected / maxVal) * 100);
                return (
                  <div key={`${h.periodYear}-${h.periodMonth}`} className="flex min-w-[3rem] flex-1 flex-col items-center gap-1">
                    <div className="flex w-full items-end justify-center gap-1" style={{ height: 120 }}>
                      <div
                        className="w-5 rounded-t bg-slate-200"
                        style={{ height: `${dueH}%` }}
                        title={`Due: ${formatKes(h.totalRentDue)}`}
                      />
                      <div
                        className="w-5 rounded-t bg-blue-500"
                        style={{ height: `${colH}%` }}
                        title={`Collected: ${formatKes(h.totalCollected)}`}
                      />
                    </div>
                    <p className="text-center text-xs text-slate-500">{MONTHS[h.periodMonth - 1]}</p>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-slate-200" /> Rent Due</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-blue-500" /> Collected</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
