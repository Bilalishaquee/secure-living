"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, Home, Phone, Mail } from "lucide-react";

type ApplicationData = {
  id: string;
  qrToken: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string | null;
  listingId: string | null;
  status: string;
  createdAt: string;
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  PENDING:   { label: "Pending Review",  icon: <Clock className="h-6 w-6" />,       color: "text-amber-600",  bg: "bg-amber-50 border-amber-200" },
  VERIFIED:  { label: "Verified",        icon: <CheckCircle className="h-6 w-6" />, color: "text-green-600",  bg: "bg-green-50 border-green-200" },
  APPLIED:   { label: "Applied",         icon: <CheckCircle className="h-6 w-6" />, color: "text-blue-600",   bg: "bg-blue-50 border-blue-200" },
  COMPLETED: { label: "Completed",       icon: <CheckCircle className="h-6 w-6" />, color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  EXPIRED:   { label: "Expired",         icon: <XCircle className="h-6 w-6" />,     color: "text-red-600",    bg: "bg-red-50 border-red-200" },
};

function QrApplyContent() {
  const params = useSearchParams();
  const token = params.get("token");

  const [data, setData] = useState<ApplicationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("No QR token provided. Please scan a valid QR code.");
      setLoading(false);
      return;
    }

    fetch(`/api/v1/qr-applications/lookup?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = (await res.json()) as { data?: ApplicationData; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Invalid or expired QR code.");
        setData(json.data!);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Verifying QR code…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <XCircle className="mx-auto h-14 w-14 text-red-500" />
          <h1 className="mt-4 text-xl font-bold text-slate-800">QR Code Invalid</h1>
          <p className="mt-2 text-sm text-slate-500">{error ?? "This QR code could not be found."}</p>
          <p className="mt-6 text-xs text-slate-400">Please contact your property manager for assistance.</p>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.PENDING;
  const isExpired = data.status === "EXPIRED";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <Home className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-800">Secure Living</h1>
          <p className="mt-1 text-sm text-slate-500">Rental Application Portal</p>
        </div>

        <div className={`rounded-2xl border p-5 ${statusCfg.bg}`}>
          <div className={`flex items-center gap-3 ${statusCfg.color}`}>
            {statusCfg.icon}
            <span className="text-lg font-semibold">{statusCfg.label}</span>
          </div>
          {isExpired && (
            <p className="mt-2 text-sm text-red-600">
              This QR application link has expired. Please request a new one from the property manager.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-700">Application Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <span className="text-xs font-bold text-slate-500">ID</span>
              </div>
              <div>
                <p className="text-xs text-slate-400">Applicant</p>
                <p className="font-medium text-slate-800">{data.applicantName}</p>
              </div>
            </div>
            {data.applicantPhone && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <Phone className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="font-medium text-slate-800">{data.applicantPhone}</p>
                </div>
              </div>
            )}
            {data.applicantEmail && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="font-medium text-slate-800">{data.applicantEmail}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-400">QR Token</p>
            <p className="mt-0.5 break-all font-mono text-xs text-slate-600">{data.qrToken}</p>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Generated on {new Date(data.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>

        {!isExpired && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-center">
            <p className="text-sm font-medium text-blue-700">✓ QR Code Verified Successfully</p>
            <p className="mt-1 text-xs text-blue-500">
              Your application is on file. The property manager will be in touch shortly.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-slate-400">
          Powered by <span className="font-semibold text-slate-500">Secure Living</span>
        </p>
      </div>
    </div>
  );
}

export default function QrApplyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    }>
      <QrApplyContent />
    </Suspense>
  );
}
