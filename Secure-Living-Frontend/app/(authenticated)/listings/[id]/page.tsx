"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit2, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
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
  const [screeningByApp, setScreeningByApp] = useState<Record<string, Array<Record<string, unknown>>>>({});
  const [screeningOpenFor, setScreeningOpenFor] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "applications">("details");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    rentAmount: "",
    availableFrom: "",
    leaseDuration: "",
    furnished: false,
    petFriendly: false,
    contactUnlockFeeKes: "",
  });
  const [photoDrafts, setPhotoDrafts] = useState<string[]>([]);
  const [attributeDrafts, setAttributeDrafts] = useState<{ key: string; label: string; value: string }[]>([]);
  const [offerAppId, setOfferAppId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState({
    leaseType: "fixed_term",
    rentAmount: "",
    depositAmount: "",
    startDate: "",
    endDate: "",
    paymentFrequency: "monthly",
  });
  const [sendingOffer, setSendingOffer] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [lr, ar] = await Promise.all([
        fetch(`/api/v1/listings/${params.id}`, { headers: { Authorization: `Bearer ${user?.authToken}` } }),
        fetch(`/api/v1/listings/${params.id}/applications`, { headers: { Authorization: `Bearer ${user?.authToken}` } }),
      ]);
      if (lr.ok) setListing((await lr.json()).data);
      let apps: Array<Record<string, unknown>> = [];
      if (ar.ok) { apps = (await ar.json()).data ?? []; setApplications(apps); }

      if (apps.length > 0) {
        const results = await Promise.all(
          apps.map((a) =>
            fetch(`/api/v1/screening-reports?applicationId=${a.id as string}`, {
              headers: { Authorization: `Bearer ${user?.authToken}` },
            }).then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
          ),
        );
        const byApp: Record<string, Array<Record<string, unknown>>> = {};
        apps.forEach((a, i) => {
          const reports = results[i]?.data ?? [];
          if (reports.length > 0) byApp[a.id as string] = reports;
        });
        setScreeningByApp(byApp);
      }
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
    if (res.ok) { toast("Listing published", "success"); load(); }
    else { const j = await res.json(); toast((j as { error?: string }).error ?? "Failed", "error"); }
  }

  async function handleWithdraw() {
    const res = await fetch(`/api/v1/listings/${params.id}/withdraw`, {
      method: "POST",
      headers: { Authorization: `Bearer ${user?.authToken}` },
    });
    if (res.ok) { toast("Listing withdrawn", "success"); load(); }
    else { const j = await res.json(); toast((j as { error?: string }).error ?? "Failed", "error"); }
  }

  function openEdit() {
    if (!listing) return;
    setEditForm({
      title: String(listing.title ?? ""),
      description: String(listing.description ?? ""),
      rentAmount: String(listing.rentAmount ?? ""),
      availableFrom: listing.availableFrom ? new Date(listing.availableFrom as string).toISOString().slice(0, 10) : "",
      leaseDuration: String(listing.leaseDuration ?? ""),
      furnished: Boolean(listing.furnished),
      petFriendly: Boolean(listing.petFriendly),
      contactUnlockFeeKes: listing.contactUnlockFeeKes != null ? String(listing.contactUnlockFeeKes) : "",
    });
    setPhotoDrafts(Array.isArray(listing.photos) ? (listing.photos as string[]) : []);
    setAttributeDrafts(
      Array.isArray(listing.customAttributes)
        ? (listing.customAttributes as { key: string; label: string; value: string }[])
        : [],
    );
    setEditOpen(true);
  }

  function addAttributeRow() {
    setAttributeDrafts((prev) => [...prev, { key: `attr_${prev.length + 1}`, label: "", value: "" }]);
  }
  function updateAttributeRow(idx: number, field: "label" | "value", val: string) {
    setAttributeDrafts((prev) =>
      prev.map((a, i) => {
        if (i !== idx) return a;
        const next = { ...a, [field]: val };
        if (field === "label") next.key = val.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `attr_${idx + 1}`;
        return next;
      }),
    );
  }
  function removeAttributeRow(idx: number) {
    setAttributeDrafts((prev) => prev.filter((_, i) => i !== idx));
  }

  function addPhotoRow() {
    setPhotoDrafts((prev) => [...prev, ""]);
  }
  function updatePhotoRow(idx: number, val: string) {
    setPhotoDrafts((prev) => prev.map((p, i) => (i === idx ? val : p)));
  }
  function removePhotoRow(idx: number) {
    setPhotoDrafts((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleEdit() {
    const res = await fetch(`/api/v1/listings/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
      body: JSON.stringify({
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        rentAmount: Number(editForm.rentAmount),
        availableFrom: editForm.availableFrom,
        leaseDuration: editForm.leaseDuration.trim() || null,
        furnished: editForm.furnished,
        petFriendly: editForm.petFriendly,
        contactUnlockFeeKes: editForm.contactUnlockFeeKes ? Number(editForm.contactUnlockFeeKes) : null,
        photos: photoDrafts.filter((p) => p.trim()),
        customAttributes: attributeDrafts.filter((a) => a.label.trim()),
      }),
    });
    if (res.ok) {
      toast("Listing updated", "success");
      setEditOpen(false);
      await load();
    } else {
      const j = await res.json();
      toast((j as { error?: string }).error ?? "Failed to update listing", "error");
    }
  }

  async function updateAppStatus(appId: string, status: string, adminNotes?: string) {
    const res = await fetch(`/api/v1/listings/${params.id}/applications/${appId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
      body: JSON.stringify({ status, ...(adminNotes !== undefined && { adminNotes }) }),
    });
    if (res.ok) { toast("Updated", "success"); load(); }
    else { const j = await res.json(); toast((j as { error?: string }).error ?? "Failed", "error"); }
  }

  function requestMoreInfo(appId: string) {
    const note = noteDraft[appId]?.trim();
    if (!note) { toast("Add a note describing what's needed from the applicant", "error"); return; }
    updateAppStatus(appId, "REVIEWING", note);
    setNoteDraft((prev) => ({ ...prev, [appId]: "" }));
  }

  function openSendOffer() {
    const rent = (listing?.rentAmount as number | undefined) ?? undefined;
    const availableFrom = listing?.availableFrom ? new Date(listing.availableFrom as string) : new Date();
    const oneYearLater = new Date(availableFrom);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    setOfferForm({
      leaseType: "fixed_term",
      rentAmount: rent ? String(rent) : "",
      depositAmount: "",
      startDate: availableFrom.toISOString().slice(0, 10),
      endDate: oneYearLater.toISOString().slice(0, 10),
      paymentFrequency: "monthly",
    });
  }

  async function handleSendLeaseOffer() {
    if (!offerAppId) return;
    setSendingOffer(true);
    try {
      const res = await fetch(`/api/v1/listings/${params.id}/applications/${offerAppId}/send-lease-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({
          leaseType: offerForm.leaseType,
          rentAmount: Number(offerForm.rentAmount),
          depositAmount: offerForm.depositAmount ? Number(offerForm.depositAmount) : undefined,
          startDate: new Date(offerForm.startDate).toISOString(),
          endDate: new Date(offerForm.endDate).toISOString(),
          paymentFrequency: offerForm.paymentFrequency,
        }),
      });
      if (res.ok) {
        toast("Lease offer sent to the tenant", "success");
        setOfferAppId(null);
        await load();
      } else {
        const j = await res.json().catch(() => ({}));
        toast((j as { error?: string }).error ?? "Failed to send lease offer", "error");
      }
    } finally {
      setSendingOffer(false);
    }
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
          <div className="mt-2 flex flex-wrap gap-2">
            {listing.escrowBadge ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Escrow Badge</span>
            ) : listing.fullyCoveredBadge ? (
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Fully Covered</span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">Landlord Reserve</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openEdit} className="gap-2"><Edit2 className="h-4 w-4" /> Edit</Button>
          {status === "DRAFT" && <Button onClick={handlePublish} className="gap-2"><Globe className="h-4 w-4" /> Publish</Button>}
          {status === "WITHDRAWN" && <Button onClick={handlePublish} className="gap-2"><Globe className="h-4 w-4" /> Republish</Button>}
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
            {(listing.description as string | null) ? <p className="text-slate-700">{listing.description as string}</p> : null}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div><p className="text-xs text-slate-500">Rent</p><p className="font-semibold">{formatKes(listing.rentAmount as number)}/mo</p></div>
              <div><p className="text-xs text-slate-500">Available From</p><p className="font-semibold">{new Date(listing.availableFrom as string).toLocaleDateString()}</p></div>
              {(listing.leaseDuration as string | null) ? <div><p className="text-xs text-slate-500">Lease Duration</p><p className="font-semibold">{listing.leaseDuration as string}</p></div> : null}
              <div><p className="text-xs text-slate-500">Furnished</p><p className="font-semibold">{listing.furnished ? "Yes" : "No"}</p></div>
              <div><p className="text-xs text-slate-500">Pet Friendly</p><p className="font-semibold">{listing.petFriendly ? "Yes" : "No"}</p></div>
            </div>

            {/* Required fee disclosure — Section 5.1. Fee is admin/landlord-editable per listing (not fixed). */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold mb-1">Property Inspection Facilitation Fee</p>
              <p>
                <strong>Contact unlock fee:</strong> {formatKes((listing.contactUnlockFeeKes as number | null) ?? 50)} — paid to the platform when a tenant requests the exact address and agent contact for this listing. Non-refundable.
              </p>
              <p className="mt-2 text-xs">
                <strong>Important:</strong> The property inspection facilitation fee (KES 500–1,000) is optional and set by the agent. Secure Living does not collect it. You pay the agent directly (cash or M-Pesa) after the inspection, if you attend.
              </p>
            </div>

            {(listing.photos as string[])?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-slate-500">Photos</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(listing.photos as string[]).map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt={`Listing photo ${i + 1}`} className="h-28 w-full rounded-lg object-cover" />
                  ))}
                </div>
              </div>
            )}

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

            {Array.isArray(listing.customAttributes) && (listing.customAttributes as { label: string; value: string }[]).length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-slate-500">Additional Attributes</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(listing.customAttributes as { label: string; value: string }[]).map((a, i) => (
                    <div key={i}><p className="text-xs text-slate-500">{a.label}</p><p className="font-semibold">{a.value}</p></div>
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
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <p>
                <strong>Screening workflow:</strong> whoever holds edit access on this listing (you, your agency, or staff) is
                responsible for the decision. <strong>Approve</strong> makes the applicant eligible for a lease offer,
                <strong> Reject</strong> closes the application, and <strong>Request Info</strong> lets the applicant correct
                and resubmit their documents for another review — it does not close the application.
              </p>
            </div>
            {applications.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">No applications yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Screening</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => {
                    const asc = APP_STATUS_COLORS[app.status as string] ?? "bg-slate-100 text-slate-700";
                    const reports = screeningByApp[app.id as string] ?? [];
                    const screening = reports[0];
                    const recBadge: Record<string, string> = {
                      approve: "bg-green-100 text-green-700",
                      review: "bg-amber-100 text-amber-700",
                      decline: "bg-red-100 text-red-700",
                    };
                    return (
                      <tr key={app.id as string}>
                        <td className="px-4 py-3 font-medium text-slate-900">{app.applicantId as string}</td>
                        <td className="px-4 py-3 text-slate-600">{new Date(app.submittedAt as string).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {screening ? (
                            <div>
                              <button
                                type="button"
                                onClick={() => setScreeningOpenFor((v) => (v === (app.id as string) ? null : (app.id as string)))}
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${recBadge[screening.recommendation as string] ?? "bg-slate-100 text-slate-600"}`}
                              >
                                {(screening.recommendation as string).toUpperCase()}{screening.score != null ? ` · ${screening.score}` : ""}
                                {reports.length > 1 ? ` (${reports.length})` : ""}
                              </button>
                              {screeningOpenFor === (app.id as string) && (
                                <div className="mt-2 max-w-xs space-y-2 rounded-lg border border-slate-200 bg-white p-2 text-[11px] shadow-sm">
                                  {reports.map((r, i) => (
                                    <div key={(r.id as string) ?? i} className={i > 0 ? "border-t border-slate-100 pt-2" : ""}>
                                      <p className="font-semibold text-slate-700">
                                        {(r.recommendation as string).toUpperCase()}{r.score != null ? ` · Score ${r.score}` : ""}
                                        <span className="ml-1 font-normal text-slate-400">
                                          {new Date(r.createdAt as string).toLocaleDateString()}
                                        </span>
                                      </p>
                                      {r.notes ? <p className="mt-0.5 text-slate-500">{r.notes as string}</p> : null}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Not screened</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${asc}`}>{app.status as string}</span>
                          {(app.adminNotes as string | null) && app.status === "REVIEWING" && (
                            <p className="mt-1 max-w-[220px] text-[11px] text-slate-500">Note: {app.adminNotes as string}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {app.status !== "SHORTLISTED" && <Button size="sm" variant="ghost" onClick={() => updateAppStatus(app.id as string, "SHORTLISTED")}>Shortlist</Button>}
                            {app.status !== "REJECTED" && <Button size="sm" variant="ghost" onClick={() => updateAppStatus(app.id as string, "REJECTED")}>Reject</Button>}
                            {app.status === "SHORTLISTED" && <Button size="sm" onClick={() => updateAppStatus(app.id as string, "ACCEPTED")}>Accept</Button>}
                            {app.status === "ACCEPTED" && (
                              (app.lease as { id: string; status: string } | null) ? (
                                <span className="text-xs text-slate-500">
                                  Lease {(app.lease as { status: string }).status}
                                </span>
                              ) : (
                                <Button size="sm" onClick={() => { setOfferAppId(app.id as string); openSendOffer(); }}>
                                  Send Lease Offer
                                </Button>
                              )
                            )}
                            <input
                              className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                              placeholder="Info needed…"
                              value={noteDraft[app.id as string] ?? ""}
                              onChange={(e) => setNoteDraft((prev) => ({ ...prev, [app.id as string]: e.target.value }))}
                            />
                            <Button size="sm" variant="outline" onClick={() => requestMoreInfo(app.id as string)}>Request Info</Button>
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

      <Modal open={editOpen} onOpenChange={setEditOpen} title="Edit Listing">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Monthly Rent (KES)</label>
              <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editForm.rentAmount} onChange={(e) => setEditForm((f) => ({ ...f, rentAmount: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Available From</label>
              <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editForm.availableFrom} onChange={(e) => setEditForm((f) => ({ ...f, availableFrom: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lease Duration</label>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editForm.leaseDuration} onChange={(e) => setEditForm((f) => ({ ...f, leaseDuration: e.target.value }))} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.furnished} onChange={(e) => setEditForm((f) => ({ ...f, furnished: e.target.checked }))} /> Furnished</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.petFriendly} onChange={(e) => setEditForm((f) => ({ ...f, petFriendly: e.target.checked }))} /> Pet friendly</label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contact Unlock Fee (KES)</label>
            <input
              type="number" min={0}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="Default: 50"
              value={editForm.contactUnlockFeeKes}
              onChange={(e) => setEditForm((f) => ({ ...f, contactUnlockFeeKes: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-400">Leave blank to use the platform default (KES 50). Flexible per listing — not fixed.</p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Photos</label>
              <Button size="sm" variant="ghost" onClick={addPhotoRow}>+ Add Photo URL</Button>
            </div>
            <p className="mb-2 text-xs text-slate-400">Do not include phone numbers or social media handles/links — contact is shared only via the paid unlock flow.</p>
            <div className="space-y-2">
              {photoDrafts.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="https://…"
                    value={url}
                    onChange={(e) => updatePhotoRow(i, e.target.value)}
                  />
                  <button type="button" onClick={() => removePhotoRow(i)} className="text-slate-400 hover:text-red-500">×</button>
                </div>
              ))}
              {photoDrafts.length === 0 && <p className="text-xs text-slate-400">No photos added yet.</p>}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Additional Attributes</label>
              <Button size="sm" variant="ghost" onClick={addAttributeRow}>+ Add Attribute</Button>
            </div>
            <p className="mb-2 text-xs text-slate-400">Add any property feature beyond pets/furnished — no restrictions (e.g. Parking Spaces, Borehole Water, Backup Generator).</p>
            <div className="space-y-2">
              {attributeDrafts.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Attribute (e.g. Parking Spaces)"
                    value={a.label}
                    onChange={(e) => updateAttributeRow(i, "label", e.target.value)}
                  />
                  <input
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Value (e.g. 2)"
                    value={a.value}
                    onChange={(e) => updateAttributeRow(i, "value", e.target.value)}
                  />
                  <button type="button" onClick={() => removeAttributeRow(i)} className="text-slate-400 hover:text-red-500">×</button>
                </div>
              ))}
              {attributeDrafts.length === 0 && <p className="text-xs text-slate-400">No additional attributes yet.</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleEdit} disabled={!editForm.title || !editForm.rentAmount || !editForm.availableFrom} className="flex-1">Save Changes</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!offerAppId} onOpenChange={(open) => { if (!open) setOfferAppId(null); }} title="Send Lease Offer">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            You author the lease — the tenant will only be able to review it and Accept & Sign or Decline, not edit its terms.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lease Type</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={offerForm.leaseType}
              onChange={(e) => setOfferForm((f) => ({ ...f, leaseType: e.target.value }))}
            >
              <option value="fixed_term">Fixed Term</option>
              <option value="month_to_month">Month to Month</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Monthly Rent (KES)</label>
              <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={offerForm.rentAmount} onChange={(e) => setOfferForm((f) => ({ ...f, rentAmount: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Deposit (KES)</label>
              <input type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={offerForm.depositAmount} onChange={(e) => setOfferForm((f) => ({ ...f, depositAmount: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
              <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={offerForm.startDate} onChange={(e) => setOfferForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
              <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={offerForm.endDate} onChange={(e) => setOfferForm((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Payment Frequency</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={offerForm.paymentFrequency}
              onChange={(e) => setOfferForm((f) => ({ ...f, paymentFrequency: e.target.value }))}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOfferAppId(null)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => { void handleSendLeaseOffer(); }}
              disabled={sendingOffer || !offerForm.rentAmount || !offerForm.startDate || !offerForm.endDate}
              className="flex-1"
            >
              {sendingOffer ? "Sending…" : "Send Offer to Tenant"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
