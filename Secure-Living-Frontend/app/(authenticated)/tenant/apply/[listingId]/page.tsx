"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { formatKes } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type Listing = {
  id: string;
  organizationId: string;
  title: string;
  rentAmount: number;
};

type CustomField = {
  id: string;
  fieldLabel: string;
  fieldType: "text" | "dropdown" | "checkbox" | "upload" | "date" | "number";
  fieldOptions: string[];
  isRequired: boolean;
  displayOrder: number;
};

type ExistingApplication = {
  id: string;
  status: string;
  adminNotes: string | null;
};

type PageProps = { params: { listingId: string } };

// Update-2.md: "landlord gives the tenant an application form which outlines the
// requirements... tenants submit the requirements and the form (optionally)".
export default function TenantApplyPage({ params }: PageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existing, setExisting] = useState<ExistingApplication | null>(null);

  const isResubmit = existing?.status === "REVIEWING";

  useEffect(() => {
    if (!user?.authToken) return;
    void (async () => {
      setLoading(true);
      try {
        const lr = await fetch(`/api/v1/listings/${params.listingId}`, {
          headers: { Authorization: `Bearer ${user.authToken}` },
        });
        if (!lr.ok) { toast("Listing not found", "error"); return; }
        const listingJson = (await lr.json()) as { data: Listing };
        setListing(listingJson.data);

        const [fr, er] = await Promise.all([
          fetch(`/api/v1/applications/custom-fields?organizationId=${listingJson.data.organizationId}`, {
            headers: { Authorization: `Bearer ${user.authToken}` },
          }),
          fetch(`/api/v1/listings/${params.listingId}/apply`, {
            headers: { Authorization: `Bearer ${user.authToken}` },
          }),
        ]);
        if (fr.ok) {
          const fieldsJson = (await fr.json()) as { data: CustomField[] };
          setFields(fieldsJson.data.slice().sort((a, b) => a.displayOrder - b.displayOrder));
        }
        if (er.ok) {
          const existingJson = (await er.json()) as { data: ExistingApplication | null };
          setExisting(existingJson.data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.authToken, params.listingId]);

  // On resubmit, a field already on file from the first submission counts as satisfied
  // even if not re-touched here — the server has the same "keep existing if not
  // resupplied" logic, this is just avoiding a false client-side block.
  const missingRequired = fields.filter((f) => f.isRequired && !isResubmit && (
    f.fieldType === "upload" ? !files[f.id] : !values[f.id]?.trim()
  ));

  async function handleSubmit() {
    if (!user?.authToken) return;
    if (missingRequired.length > 0) {
      toast(`Please complete: ${missingRequired.map((f) => f.fieldLabel).join(", ")}`, "error");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      if (message.trim()) form.append("message", message.trim());
      const nonUpload = fields
        .filter((f) => f.fieldType !== "upload")
        .map((f) => ({ fieldId: f.id, value: values[f.id] ?? "" }));
      form.append("values", JSON.stringify(nonUpload));
      for (const field of fields) {
        if (field.fieldType === "upload" && files[field.id]) {
          form.append(`file_${field.id}`, files[field.id] as File);
        }
      }

      const url = isResubmit
        ? `/api/v1/applications/${existing?.id}/resubmit`
        : `/api/v1/listings/${params.listingId}/apply`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.authToken}` },
        body: form,
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast(err.error ?? "Failed to submit application", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-2xl"><div className="h-64 animate-pulse rounded-2xl bg-slate-100" /></div>;
  if (!listing) return null;

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500" />
            <p className="text-lg font-medium text-slate-700">{isResubmit ? "Application resubmitted" : "Application submitted"}</p>
            <p className="mt-1 text-sm text-slate-500">
              Your landlord will review your requirements and get back to you. If accepted, a lease offer will appear on your My Lease page.
            </p>
            <Button className="mt-4" onClick={() => router.push("/tenant/lease")}>Go to My Lease</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already applied and not in a resubmittable state — show status instead of a form
  // that would otherwise silently create a confusing duplicate application.
  if (existing && existing.status !== "REVIEWING") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-blue-500" />
            <p className="text-lg font-medium text-slate-700">You've already applied</p>
            <p className="mt-1 text-sm text-slate-500">
              Status: <span className="font-semibold">{existing.status}</span>. Your landlord will follow up if anything else is needed.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => router.push("/tenant/lease")}>Go to My Lease</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{isResubmit ? "Resubmit — " : "Apply — "}{listing.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{formatKes(listing.rentAmount)}/month. Complete the requirements your landlord has set below.</p>
      </div>

      {isResubmit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Your landlord requested more information</p>
          {existing?.adminNotes && <p className="mt-1">{existing.adminNotes}</p>}
          <p className="mt-1 text-xs">Anything you don&apos;t change below keeps what you submitted before.</p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Requirements</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {fields.length === 0 && (
            <p className="text-sm text-slate-400">No specific documents required — just add an optional message below and submit.</p>
          )}
          {fields.map((field) => (
            <div key={field.id}>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {field.fieldLabel} {field.isRequired && <span className="text-red-500">*</span>}
              </label>
              {field.fieldType === "upload" ? (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-blue-400">
                  <FileUp className="h-4 w-4" />
                  {files[field.id]?.name ?? "Choose file (PDF or image)"}
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => setFiles((f) => ({ ...f, [field.id]: e.target.files?.[0] ?? null }))}
                  />
                </label>
              ) : field.fieldType === "dropdown" ? (
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={values[field.id] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {field.fieldOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : field.fieldType === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={values[field.id] === "true"}
                    onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.checked ? "true" : "false" }))}
                  />
                  Yes
                </label>
              ) : (
                <input
                  type={field.fieldType === "date" ? "date" : field.fieldType === "number" ? "number" : "text"}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={values[field.id] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                />
              )}
            </div>
          ))}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Message to landlord (optional)</label>
            <textarea
              className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Anything you'd like the landlord to know…"
            />
          </div>

          <Button className="w-full" onClick={() => { void handleSubmit(); }} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Application"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
