"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { formatKes } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

type RentInvoice = {
  id: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  totalDueKes: number;
  amountPaidKes: number;
  balanceKes: number;
  status: string;
  paidAt: string | null;
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "neutral"> = {
  paid:     "success",
  sent:     "neutral",
  pending:  "warning",
  overdue:  "error",
};

export default function TenantPaymentSchedulePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const leaseId = searchParams.get("leaseId");
  const [invoices, setInvoices] = useState<RentInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.authToken) return;
    void (async () => {
      setLoading(true);
      try {
        const url = leaseId ? `/api/v1/rent-invoices?leaseId=${leaseId}` : "/api/v1/rent-invoices";
        const res = await fetch(url, { headers: { Authorization: `Bearer ${user.authToken}` } });
        if (res.ok) {
          const json = (await res.json()) as { data: RentInvoice[] };
          setInvoices(json.data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.authToken, leaseId]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tenant/lease"><ArrowLeft className="mr-1 h-4 w-4" /> My Lease</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment Schedule</h1>
        <p className="mt-1 text-sm text-slate-500">Rent invoices for your lease — due dates, amounts, and payment status.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Receipt className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No invoices yet</p>
            <p className="mt-1 text-sm text-slate-500">Your rent invoices will appear here once generated.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Due Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Amount Due</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(inv.periodStart).toLocaleDateString("en-GB")} – {new Date(inv.periodEnd).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{new Date(inv.dueDate).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatKes(inv.totalDueKes)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatKes(inv.balanceKes)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[inv.status] ?? "neutral"}>{inv.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
