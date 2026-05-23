"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatKes } from "@/lib/utils";


type Props = { params: { id: string } };

const STATUS_COLORS: Record<string, string> = {
  DRAFT:       "bg-slate-100 text-slate-700",
  PUBLISHED:   "bg-green-100 text-green-700",
  UNDER_OFFER: "bg-blue-100 text-blue-700",
  LET:         "bg-purple-100 text-purple-700",
  WITHDRAWN:   "bg-red-100 text-red-700",
};

const APP_STATUS_COLORS: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700",
  REVIEWING:   "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-indigo-100 text-indigo-700",
  REJECTED:    "bg-red-100 text-red-700",
  ACCEPTED:    "bg-green-100 text-green-700",
};

export default function ListingDetailPage({ params }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listing, setListing] = useState<Record<string, unknown> | null>(null);
  const [applications, setApplications] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "applications">("details");

  async function load() {
    setLoading(true);
    try {
      const [lr, ar] = await Promise.all([
        fetch(`/api/v1/listings/${params.id}`, { headers: { Authorization: `Bearer ${user?.authToken}` } }),
        fetch(`/api/v1/listings/${params.id}/applications`, { headers: { Authorization: `Bearer ${user?.authToken}` } }),
      ]);
      if (lr.ok) setListing((await lr.json()).data);
      if (ar.ok) setApplications((await ar.json()).data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken]);

  async function handlePublish() {
    const res = await fetch(`/api/v1/listings/${params.id}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user?.authToken}` },
    });
    if (res.ok) { toast({ title: "Listing published", variant: "success" }); load(); }
    else { const j = await res.json(); toast({ title: j.error ?? "Failed", variant: "error" }); }
  }

  async function handleWithdraw() {
    const res = await fetch(`/api/v1/listings/${params.id}/withdraw`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user?.authToken}` },
    });
    if (res.ok) { toast({ title: "Listing withdrawn", variant: "success" }); load(); }
    else { const j = await res.json(); toast({ title: j.error ?? "Failed", variant: "error" }); }
  }

  async function updateAppStatus(appId: string, status: string) {
    const res = await fetch(`/api/v1/listings/${params.id}/applications/${appId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast({ title: "Updated", variant: "success" }); load(); }
    else { const j = await res.json(); toast({ title: j.error ?? "Failed", variant: "error" }); }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-xl bg-slate-100" />;
  if (!listing) return <p className="text-slate-500">Listing not found</p>;

  const status = listing.status as string;
  const sc = STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/listings" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Listings
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{listing.title as string}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc}`}>{status}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Unit {(listing.unit as Record<string, unknown>)?.unitNumber as string} · {formatKes(listing.rentAmount as number)}/month
          </p>
        </div>
        <div className="flex gap-2">
          {status === "DRAFT" && <Button onClick={handlePublish} className="gap-2"><Globe className="h-4 w-4" /> Publish</Button>}
          {status === "PUBLISHED" && <Button variant="ghost" onClick={handleWithdraw}>Withdraw</Button>}
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {(["details", "applications"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            {tab === "details" ? "Details" : `Applications (${applications.length})`}
          </button>
        ))}
      </div>

      {activeTab === "details" && (
        <Card>
          <CardContent className="space-y-4 p-6">
            {listing.description && <p className="text-slate-700">{listing.description as string}</p>}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div><p className="text-xs text-slate-500">Rent</p><p className="font-semibold">{formatKes(listing.rentAmount as number)}/mo</p></div>
              <div><p className="text-xs text-slate-500">Available From</p><p className="font-semibold">{new Date(listing.availableFrom as string).toLocaleDateString()}</p></div>
              {listing.leaseDuration && <div><p className="text-xs text-slate-500">Lease Duration</p><p className="font-semibold">{listing.leaseDuration as string}</p></div>}
              <div><p className="text-xs text-slate-500">Furnished</p><p className="font-semibold">{listing.furnished ? "Yes" : "No"}</p></div>
              <div><p className="text-xs text-slate-500">Pet Friendly</p><p className="font-semibold">{listing.petFriendly ? "Yes" : "No"}</p></div>
            </div>

            {/* Required fee disclosure — Section 5.1 */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold mb-1">Property Inspection Facilitation Fee</p>
              <p>
                <strong>Contact unlock fee:</strong> KES 50 — paid to the platform when a tenant requests the exact address and agent contact for this listing. Non-refundable.
              </p>
              <p className="mt-2 text-xs">
                <strong>Important:</strong> The property inspection facilitation fee (KES 500–1,000) is optional and set by the agent. Secure Living does not collect it. You pay the agent directly (cash or M-Pesa) after the inspection, if you attend.
              </p>
            </div>
            {(listing.features as string[])?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-slate-500">Features</p>
                <div className="flex flex-wrap gap-2">
                  {(listing.features as string[]).map((f) => (
                    <span key={f} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "applications" && (
        <Card>
          <CardContent className="p-0">
            {applications.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">No applications yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => {
                    const asc = APP_STATUS_COLORS[app.status as string] ?? "bg-slate-100 text-slate-700";
                    return (
                      <tr key={app.id as string}>
                        <td className="px-4 py-3 font-medium text-slate-900">{app.applicantId as string}</td>
                        <td className="px-4 py-3 text-slate-600">{new Date(app.submittedAt as string).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${asc}`}>{app.status as string}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {app.status !== "SHORTLISTED" && <Button size="sm" variant="ghost" onClick={() => updateAppStatus(app.id as string, "SHORTLISTED")}>Shortlist</Button>}
                            {app.status !== "REJECTED" && <Button size="sm" variant="ghost" onClick={() => updateAppStatus(app.id as string, "REJECTED")}>Reject</Button>}
                            {app.status === "SHORTLISTED" && <Button size="sm" onClick={() => updateAppStatus(app.id as string, "ACCEPTED")}>Accept</Button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
