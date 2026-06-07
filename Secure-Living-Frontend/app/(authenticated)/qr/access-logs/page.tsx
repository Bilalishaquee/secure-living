"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type QrAccessLog = {
  id: string;
  qrToken: string;
  userId: string | null;
  visitorId: string | null;
  accessType: string;
  granted: boolean;
  reason: string | null;
  accessedAt: string;
};

export default function QrAccessLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<QrAccessLog[]>([]);
  const [filterToken, setFilterToken] = useState("");
  const [filterUser, setFilterUser] = useState("");

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadLogs() {
    if (!user) return;
    const params = new URLSearchParams();
    if (filterToken) params.set("qrToken", filterToken);
    if (filterUser) params.set("userId", filterUser);
    const res = await fetch(`/api/v1/qr-access-logs?${params.toString()}`, {
      headers: authHeader(),
    });
    if (res.ok) {
      const json = (await res.json()) as { data: QrAccessLog[] };
      setLogs(json.data ?? []);
    } else {
      setLogs([]);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, [user, filterToken, filterUser]);

  const columns: Column<QrAccessLog>[] = [
    { key: "qrToken", header: "QR Token", sortable: true },
    {
      key: "userId",
      header: "User / Visitor",
      render: (r) => r.userId ?? r.visitorId ?? "--",
    },
    { key: "accessType", header: "Access Type" },
    {
      key: "granted",
      header: "Granted",
      render: (r) => r.granted ? <Badge variant="success">Granted</Badge> : <Badge variant="error">Denied</Badge>,
    },
    {
      key: "accessedAt",
      header: "Timestamp",
      render: (r) => new Date(r.accessedAt).toLocaleString(),
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">QR Access Logs</h1>
          <p className="app-page-lead">Track QR-based access attempts.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Access Logs</CardTitle>
            <div className="flex gap-2">
              <input
                placeholder="Filter by QR token"
                value={filterToken}
                onChange={(e) => setFilterToken(e.target.value)}
                className="w-48 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
              <input
                placeholder="Filter by user ID"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-48 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable data={logs} columns={columns} rowKey={(r) => r.id} />
        </CardContent>
      </Card>
    </div>
  );
}
