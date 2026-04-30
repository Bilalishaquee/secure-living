"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

type ServiceRequest = {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  branchId: string;
  organizationId: string;
  type: string;
};

export default function MaintenancePage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ServiceRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const res = await fetch("/api/v1/service-requests", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (!res.ok) {
        setError("Unable to load maintenance requests.");
        return;
      }
      const json = (await res.json()) as { data: ServiceRequest[] };
      setRows(json.data);
    })();
  }, [user]);

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Maintenance Tracking</h1>
          <p className="app-page-lead">
            Work request queue, assignment status, and closure tracking.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Open Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="rounded-lg border border-surface-border px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{r.title}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize">{r.status}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {r.type} / {r.category} • {r.priority} • {r.organizationId}/{r.branchId}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["approved", "in_progress", "completed", "escalated"].map((next) => (
                    <button
                      key={next}
                      className="rounded border border-surface-border px-2 py-1 text-xs"
                      onClick={async () => {
                        if (!user) return;
                        await fetch(`/api/v1/service-requests/${r.id}`, {
                          method: "PATCH",
                          headers: {
                            "content-type": "application/json",
                            Authorization: `Bearer ${user.authToken ?? ""}`,
                          },
                          body: JSON.stringify({
                            status: next,
                            escalatedReason: next === "escalated" ? "Manual escalation from dashboard" : undefined,
                          }),
                        });
                      }}
                    >
                      Mark {next}
                    </button>
                  ))}
                  <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
                  <button
                    className="rounded border border-surface-border px-2 py-1 text-xs"
                    onClick={async () => {
                      if (!selectedFile || !user) return;
                      const form = new FormData();
                      form.append("file", selectedFile);
                      await fetch(`/api/v1/service-requests/${r.id}/evidence`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
                        body: form,
                      });
                    }}
                  >
                    Upload evidence
                  </button>
                </div>
              </div>
            ))}
            {rows.length === 0 && !error ? (
              <p className="text-sm text-[var(--text-secondary)]">No requests available.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

