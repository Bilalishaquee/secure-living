"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

type KycDoc = {
  id: string;
  userId: string;
  organizationId: string | null;
  documentType: string;
  fileName: string;
  status: string; // pending, approved, rejected
  uploadedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

const STATUS_BADGE: Record<string, "warning" | "success" | "error"> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
};

export default function AdminKycReviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<KycDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/kyc/documents", {
        headers: { Authorization: `Bearer ${user?.authToken ?? ""}` },
      });
      if (res.ok) {
        const j = await res.json();
        setDocs(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.authToken) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.authToken]);

  const filtered = useMemo(
    () => (filter === "all" ? docs : docs.filter((d) => d.status === filter)),
    [docs, filter],
  );

  async function review(id: string, decision: "approve" | "reject", reason?: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/v1/kyc/documents/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken ?? ""}` },
        body: JSON.stringify({ decision, rejectionReason: reason }),
      });
      if (res.ok) {
        toast(decision === "approve" ? "Document approved" : "Document rejected", "success");
        setRejectingId(null);
        setRejectionReason("");
        load();
      } else {
        const j = await res.json().catch(() => ({}));
        toast(j.error ?? "Failed", "error");
      }
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = docs.filter((d) => d.status === "pending").length;

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-brand-blue" /> KYC Review Queue
          </h1>
          <p className="app-page-lead">
            Dedicated KYC management: approve or reject submitted documents. Decisions update the
            submitter&apos;s verification badge across the platform.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
              filter === f ? "border-brand-blue bg-brand-blue text-white" : "border-surface-border text-slate-600"
            }`}
          >
            {f} {f === "pending" && pendingCount > 0 ? `(${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <CheckCircle2 className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-700">No {filter !== "all" ? filter : ""} documents</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{d.documentType}</p>
                  <p className="truncate text-xs text-slate-500">{d.fileName}</p>
                  <p className="text-xs text-slate-400">
                    Uploaded {new Date(d.uploadedAt).toLocaleDateString()}
                    {d.reviewedAt ? ` · Reviewed ${new Date(d.reviewedAt).toLocaleDateString()}` : ""}
                  </p>
                  {d.rejectionReason && <p className="mt-1 text-xs text-red-600">Reason: {d.rejectionReason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_BADGE[d.status] ?? "neutral"}>{d.status}</Badge>
                  {d.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => review(d.id, "approve")} disabled={busyId === d.id}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectingId(d.id)} disabled={busyId === d.id}>
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!rejectingId} onOpenChange={(open) => { if (!open) { setRejectingId(null); setRejectionReason(""); } }} title="Reject KYC document">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Reason *</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Document is blurry, expired, or doesn't match name on file"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => { setRejectingId(null); setRejectionReason(""); }} className="flex-1">Cancel</Button>
            <Button
              onClick={() => rejectingId && review(rejectingId, "reject", rejectionReason)}
              disabled={!rejectionReason.trim() || busyId === rejectingId}
              className="flex-1"
            >
              <XCircle className="mr-1.5 h-4 w-4" /> Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
