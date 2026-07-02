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

        const fr = await fetch(`/api/v1/applications/custom-fields?organizationId=${listingJson.data.organizationId}`, {
          headers: { Authorization: `Bearer ${user.authToken}` },
        });
        if (fr.ok) {
          const fieldsJson = (await fr.json()) as { data: CustomField[] };
          setFields(fieldsJson.data.slice().sort((a, b) => a.displayOrder - b.displayOrder));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.authToken, params.listingId]);

  const missingRequired = fields.filter((f) => f.isRequired && (
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

      const res = await fetch(`/api/v1/listings/${params.listingId}/apply`, {
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
            <p className="text-lg font-medium text-slate-700">Application submitted</p>
            <p className="mt-1 text-sm text-slate-500">
              Your landlord will review your requirements and get back to you. If accepted, a lease offer will appear on your My Lease page.
            </p>
            <Button className="mt-4" onClick={() => router.push("/tenant/lease")}>Go to My Lease</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Apply — {listing.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{formatKes(listing.rentAmount)}/month. Complete the requirements your landlord has set below.</p>
      </div>

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
