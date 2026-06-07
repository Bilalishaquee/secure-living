"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

type VisitorLog = {
  id: string;
  visitorId: string;
  visitor?: { name: string } | null;
  unitId: string | null;
  approvalStatus: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  approvalMethod: string | null;
  purpose: string;
};

export default function VisitorLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [filterUnit, setFilterUnit] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  async function loadLogs() {
    if (!user) return;
    const params = new URLSearchParams();
    if (filterUnit) params.set("unitId", filterUnit);
    if (filterStatus !== "ALL") params.set("approvalStatus", filterStatus);
    const res = await fetch(`/api/v1/visitor-logs?${params.toString()}`, {
      headers: authHeader(),
    });
    if (res.ok) {
      const json = (await res.json()) as { data: VisitorLog[] };
      setLogs(json.data ?? []);
    } else {
      setLogs([]);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, [user, filterUnit, filterStatus]);

  const columns: Column<VisitorLog>[] = [
    { key: "visitorId", header: "Visitor ID", render: (r) => r.visitor?.name ?? r.visitorId.slice(0, 8) },
    { key: "unitId", header: "Unit", render: (r) => r.unitId ?? "--" },
    { key: "purpose", header: "Purpose" },
    {
      key: "approvalStatus",
      header: "Status",
      render: (r) => {
        const variant =
          r.approvalStatus === "APPROVED" || r.approvalStatus === "AUTO_APPROVED"
            ? "success"
            : r.approvalStatus === "DENIED"
            ? "error"
            : "warning";
        return <Badge variant={variant}>{r.approvalStatus.replace(/_/g, " ")}</Badge>;
      },
    },
    {
      key: "checkInAt",
      header: "Check In",
      render: (r) => r.checkInAt ? new Date(r.checkInAt).toLocaleString() : "--",
    },
    {
      key: "checkOutAt",
      header: "Check Out",
      render: (r) => r.checkOutAt ? new Date(r.checkOutAt).toLocaleString() : "--",
    },
    { key: "approvalMethod", header: "Approval Method", render: (r) => r.approvalMethod ?? "--" },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Visitor Logs</h1>
          <p className="app-page-lead">Check-in/check-out records for all visitors.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Visitor Logs</CardTitle>
            <div className="flex gap-2">
              <input
                placeholder="Filter by unit ID"
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="w-48 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="AUTO_APPROVED">Auto Approved</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="DENIED">Denied</SelectItem>
                </SelectContent>
              </Select>
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
