"use client";

import { useState } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { useToast } from "@/lib/toast-context";
import { StatusTimeline, type TimelineStep } from "@/components/ui/StatusTimeline";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

const initialSteps: TimelineStep[] = [
  { id: "1", label: "Account Created", status: "complete", timestamp: "2026-03-28 09:12 EAT" },
  { id: "2", label: "Documents Uploaded (pending review)", status: "current" },
  { id: "3", label: "Identity Verified", status: "upcoming" },
  { id: "4", label: "Profile Activated", status: "upcoming" },
];

export default function KycPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docType, setDocType] = useState("national_id");
  const [addressType, setAddressType] = useState("utility");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [addrFile, setAddrFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [documents, setDocuments] = useState<{ id: string; documentType: string; status: string; uploadedAt: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const res = await fetch("/api/v1/kyc/documents", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as { data: { id: string; documentType: string; status: string; uploadedAt: string }[] };
      setDocuments(json.data);
    })();
  }, [user, submitted]);

  const steps: TimelineStep[] = submitted
    ? [
        initialSteps[0],
        {
          ...initialSteps[1],
          status: "current",
          timestamp: new Date().toLocaleString("en-KE", { hour12: false }),
        },
        initialSteps[2],
        initialSteps[3],
      ]
    : initialSteps;

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">KYC document upload</h1>
          <p className="app-page-lead">
            Verification is processed within 24–48 hours. Documents are encrypted at rest.
          </p>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Identity document
              </label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="mt-2 w-full" aria-label="Identity document type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="license">Driver&apos;s License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dropzone label="Identity document file" onFileSelect={setIdFile} />
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Proof of address
              </label>
              <Select value={addressType} onValueChange={setAddressType}>
                <SelectTrigger className="mt-2 w-full" aria-label="Proof of address type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utility">Utility Bill</SelectItem>
                  <SelectItem value="bank">Bank Statement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dropzone label="Proof of address file" onFileSelect={setAddrFile} />
            <Button
              type="button"
              className="w-full"
              onClick={async () => {
                if (!user) return;
                const queue = [idFile && { file: idFile, docType }, addrFile && { file: addrFile, docType: addressType }].filter(Boolean) as { file: File; docType: string }[];
                for (const item of queue) {
                  const form = new FormData();
                  form.append("documentType", item.docType);
                  form.append("file", item.file);
                  await fetch("/api/v1/kyc/documents", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
                    body: form,
                  });
                }
                setSubmitted(true);
                toast(
                  "Documents submitted — verification queue updated.",
                  "success"
                );
              }}
              disabled={!idFile || !addrFile}
            >
              Upload Documents
            </Button>
            <p className="text-xs text-[var(--text-muted)]">
              Your documents are encrypted and stored securely. This phase records uploads
              as Pending — no automated verification runs yet.
            </p>
            {documents.length ? (
              <div className="rounded-lg border border-surface-border p-3">
                <p className="text-xs font-semibold text-[var(--text-muted)]">Recent submissions</p>
                <div className="mt-2 space-y-1 text-xs">
                  {documents.slice(0, 5).map((d) => (
                    <p key={d.id}>
                      {d.documentType} - {d.status} - {new Date(d.uploadedAt).toLocaleString()}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline steps={steps} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
