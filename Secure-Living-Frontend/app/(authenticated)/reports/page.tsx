"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { useAuth } from "@/lib/auth-context";
import { formatKes } from "@/lib/utils";

type Property = { id: string; name: string };
type PnlData = {
  totalIncomeKes: number;
  totalExpenseKes: number;
  netKes: number;
  expenseByCategory: Record<string, number>;
};
type NoiData = {
  grossRentalIncomeKes: number;
  operatingExpensesKes: number;
  noiKes: number;
  monthly: Array<{ month: number; grossIncomeKes: number; operatingExpenseKes: number; noiKes: number }>;
  expenseCategoryTotals: Record<string, number>;
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("pnl");
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [periodStart, setPeriodStart] = useState(`${new Date().getFullYear()}-01-01`);
  const [periodEnd, setPeriodEnd] = useState(`${new Date().getFullYear()}-12-31`);
  const [pnl, setPnl] = useState<PnlData | null>(null);
  const [noi, setNoi] = useState<NoiData | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const res = await fetch("/api/v1/properties", { headers: { Authorization: `Bearer ${user.authToken ?? ""}` } });
      if (!res.ok) return;
      const json = (await res.json()) as { data: Property[] };
      setProperties(json.data);
      if (json.data[0]) setPropertyId(json.data[0].id);
    })();
  }, [user?.id, user?.authToken]);

  async function loadPnl() {
    if (!user?.id) return;
    const q = new URLSearchParams({
      periodStart: new Date(periodStart).toISOString(),
      periodEnd: new Date(periodEnd).toISOString(),
    });
    if (propertyId) q.set("propertyId", propertyId);
    const res = await fetch(`/api/v1/reports/pnl?${q.toString()}`, { headers: { Authorization: `Bearer ${user.authToken ?? ""}` } });
    if (!res.ok) return;
    const json = (await res.json()) as { data: PnlData };
    setPnl(json.data);
  }

  async function loadNoi() {
    if (!user?.id || !propertyId) return;
    const q = new URLSearchParams({ propertyId, year });
    const res = await fetch(`/api/v1/reports/noi?${q.toString()}`, { headers: { Authorization: `Bearer ${user.authToken ?? ""}` } });
    if (!res.ok) return;
    const json = (await res.json()) as { data: NoiData };
    setNoi(json.data);
  }

  useEffect(() => { void loadPnl(); }, [user?.id, propertyId, periodStart, periodEnd]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void loadNoi(); }, [user?.id, propertyId, year]); // eslint-disable-line react-hooks/exhaustive-deps

  function exportCsv() {
    if (!pnl) return;
    const rows = [["Category", "Income", "Expense", "Net"]];
    Object.entries(pnl.expenseByCategory).forEach(([category, expense]) => {
      rows.push([category, "0", String(expense), String(-expense)]);
    });
    rows.push(["Rent income", String(pnl.totalIncomeKes), "0", String(pnl.totalIncomeKes)]);
    rows.push(["TOTAL", String(pnl.totalIncomeKes), String(pnl.totalExpenseKes), String(pnl.netKes)]);
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pnl-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const pieData = useMemo(
    () => Object.entries(noi?.expenseCategoryTotals ?? {}).map(([name, value]) => ({ name, value })),
    [noi]
  );

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Financial Reports</h1>
          <p className="app-page-lead">P&amp;L and NOI summaries backed by live database records.</p>
        </div>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          {
            id: "pnl",
            label: "P&L",
            content: (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
                    <option value="">All Properties</option>
                    {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                  <input type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                  <Button onClick={exportCsv}>Export CSV</Button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Card><CardContent className="p-4"><p className="text-xs text-[var(--text-secondary)]">Total Income</p><p className="text-xl font-semibold">{formatKes(pnl?.totalIncomeKes ?? 0)}</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-xs text-[var(--text-secondary)]">Total Expenses</p><p className="text-xl font-semibold">{formatKes(pnl?.totalExpenseKes ?? 0)}</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-xs text-[var(--text-secondary)]">Net Cash Flow</p><p className="text-xl font-semibold">{formatKes(pnl?.netKes ?? 0)}</p></CardContent></Card>
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-base">Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-200 text-left text-xs text-[var(--text-secondary)]"><th className="py-2">Category</th><th className="py-2">Income</th><th className="py-2">Expense</th><th className="py-2">Net</th></tr></thead>
                      <tbody>
                        {Object.entries(pnl?.expenseByCategory ?? {}).map(([category, expense]) => (
                          <tr key={category} className="border-b border-slate-100"><td className="py-2">{category}</td><td className="py-2">{formatKes(0)}</td><td className="py-2">{formatKes(expense)}</td><td className="py-2">-{formatKes(expense)}</td></tr>
                        ))}
                        <tr><td className="py-2 font-semibold">Total</td><td className="py-2">{formatKes(pnl?.totalIncomeKes ?? 0)}</td><td className="py-2">{formatKes(pnl?.totalExpenseKes ?? 0)}</td><td className="py-2">{formatKes(pnl?.netKes ?? 0)}</td></tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            id: "noi",
            label: "NOI Summary",
            content: (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
                    {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={year} onChange={(e) => setYear(e.target.value)} />
                  <Button onClick={() => { void loadNoi(); }}>Refresh</Button>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <Card><CardContent className="p-4"><p className="text-xs text-[var(--text-secondary)]">Gross Rental Income</p><p className="text-xl font-semibold">{formatKes(noi?.grossRentalIncomeKes ?? 0)}</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-xs text-[var(--text-secondary)]">Operating Expenses</p><p className="text-xl font-semibold">{formatKes(noi?.operatingExpensesKes ?? 0)}</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-xs text-[var(--text-secondary)]">NOI</p><p className="text-xl font-semibold">{formatKes(noi?.noiKes ?? 0)}</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-xs text-[var(--text-secondary)]">Cap Rate</p><p className="text-xl font-semibold">—</p></CardContent></Card>
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-base">Monthly NOI</CardTitle></CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={noi?.monthly ?? []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="grossIncomeKes" fill="#2563eb" name="Gross Income" />
                        <Bar dataKey="operatingExpenseKes" fill="#f59e0b" name="Operating Expense" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Expense Category Mix</CardTitle></CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100}>
                          {pieData.map((_, idx) => <Cell key={idx} fill={["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"][idx % 6]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
