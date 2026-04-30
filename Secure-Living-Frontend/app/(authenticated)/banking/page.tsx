"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatKes } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

type Wallet = {
  id: string;
  ownerId: string;
  walletType: string;
  currency: string;
};

type LedgerEntry = {
  id: string;
  walletId: string;
  amountKes: number;
  entryType: string;
  description: string | null;
  createdAt: string;
};

export default function BankingPage() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [walletRes, ledgerRes] = await Promise.all([
        fetch("/api/v1/wallets", { headers: { Authorization: `Bearer ${user.authToken ?? ""}` } }),
        fetch("/api/v1/wallets/w_property_p1/ledger", { headers: { Authorization: `Bearer ${user.authToken ?? ""}` } }),
      ]);
      if (walletRes.ok) {
        const json = (await walletRes.json()) as { data: Wallet[] };
        setWallets(json.data);
      }
      if (ledgerRes.ok) {
        const json = (await ledgerRes.json()) as { data: LedgerEntry[] };
        setLedger(json.data);
      }
    })();
  }, [user]);

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Landlord Banking</h1>
          <p className="app-page-lead">Wallet infrastructure, transaction trails, and cash movement.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wallet Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {wallets.map((w) => (
              <div key={w.id} className="rounded-lg border border-surface-border px-3 py-2 text-sm">
                <p className="font-medium text-[var(--text-primary)]">{w.walletType}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {w.id} • Owner: {w.ownerId} • {w.currency}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Latest Ledger Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ledger.map((e) => (
              <div key={e.id} className="rounded-lg border border-surface-border px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{e.entryType}</p>
                  <p className="font-mono-data text-sm">{formatKes(e.amountKes)}</p>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {e.description ?? "No description"} • {new Date(e.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

