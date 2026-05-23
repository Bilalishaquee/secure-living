"use client";

import { useState, useEffect } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { useToast } from "@/lib/toast-context";
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
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, Clock, Lock, Shield, Star, AlertTriangle } from "lucide-react";

type VerificationLevel =
  | "UNVERIFIED"
  | "IDENTITY_VERIFIED"
  | "COMPLIANCE_VERIFIED"
  | "TRUSTED_PERSONNEL"
  | "ENTERPRISE_VERIFIED";

type TrustedPersonnelStatus = "PENDING" | "APPROVED" | "DENIED" | "REVOKED" | null;

interface VerificationState {
  verificationLevel: VerificationLevel;
  verificationLevelSetAt: string | null;
  iprsCheckedAt: string | null;
  iprsResult: string | null;
  trustedPersonnelStatus: TrustedPersonnelStatus;
  goodConductExpiresAt: string | null;
  kycDocuments: { id: string; documentType: string; status: string; uploadedAt: string }[];
}

const LEVELS: { level: VerificationLevel; label: string; description: string; icon: React.ReactNode }[] = [
  {
    level: "UNVERIFIED",
    label: "Unverified",
    description: "Account created. No verification taken.",
    icon: <Lock className="h-5 w-5 text-slate-400" />,
  },
  {
    level: "IDENTITY_VERIFIED",
    label: "Level 1 — Identity Verified",
    description: "ID photo + liveness selfie + face match via Didit.me.",
    icon: <CheckCircle className="h-5 w-5 text-blue-500" />,
  },
  {
    level: "COMPLIANCE_VERIFIED",
    label: "Level 2 — Compliance Verified",
    description: "Government ID confirmed against Kenya IPRS national database.",
    icon: <Shield className="h-5 w-5 text-green-500" />,
  },
  {
    level: "TRUSTED_PERSONNEL",
    label: "Level 3 — Trusted Personnel",
    description: "Enhanced trust: 3+ months active, 3+ transactions, Good Conduct Certificate.",
    icon: <Star className="h-5 w-5 text-amber-500" />,
  },
  {
    level: "ENTERPRISE_VERIFIED",
    label: "Level 4 — Enterprise Verified",
    description: "Full agency or business document review. Admin approved.",
    icon: <Shield className="h-5 w-5 text-purple-600" />,
  },
];

function levelIndex(level: VerificationLevel): number {
  return ["UNVERIFIED", "IDENTITY_VERIFIED", "COMPLIANCE_VERIFIED", "TRUSTED_PERSONNEL", "ENTERPRISE_VERIFIED"].indexOf(level);
}

export default function KycPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [state, setState] = useState<VerificationState | null>(null);
  const [loading, setLoading] = useState(true);

  // Document upload state
  const [docType, setDocType] = useState("national_id");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Trusted Personnel application
  const [gcFile, setGcFile] = useState<File | null>(null);
  const [gcIssueDate, setGcIssueDate] = useState("");
  const [applyingTP, setApplyingTP] = useState(false);

  // IPRS consent
  const [iprsConsent, setIprsConsent] = useState(false);
  const [checkingIprs, setCheckingIprs] = useState(false);

  async function fetchState() {
    if (!user) return;
    try {
      const res = await fetch("/api/v1/kyc/verification-level", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: VerificationState };
        setState(json.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchState(); }, [user]);

  const currentIdx = state ? levelIndex(state.verificationLevel) : 0;

  async function uploadDocument() {
    if (!user || !idFile) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("documentType", docType);
      form.append("file", idFile);
      const res = await fetch("/api/v1/kyc/documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
        body: form,
      });
      if (res.ok) {
        toast("Document submitted for verification.", "success");
        setIdFile(null);
        await fetchState();
      } else {
        toast("Upload failed. Please try again.", "error");
      }
    } finally {
      setUploading(false);
    }
  }

  async function initiateLevel1() {
    if (!user) return;
    const res = await fetch("/api/v1/kyc/verification-level", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.authToken ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "initiate_level1" }),
    });
    if (res.ok) {
      toast("Identity verification session started. Complete the Didit.me flow.", "success");
    } else {
      toast("Could not start verification. Try again.", "error");
    }
  }

  async function triggerIprs() {
    if (!user || !iprsConsent) return;
    setCheckingIprs(true);
    try {
      const res = await fetch("/api/v1/kyc/verification-level", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.authToken ?? ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "check_iprs", consentGiven: true }),
      });
      if (res.ok) {
        toast("IPRS check submitted. You will be notified within 48 hours.", "success");
        await fetchState();
      } else {
        const err = (await res.json()) as { error: string };
        toast(err.error ?? "IPRS check failed.", "error");
      }
    } finally {
      setCheckingIprs(false);
    }
  }

  async function applyTrustedPersonnel() {
    if (!user || !gcFile || !gcIssueDate) return;
    setApplyingTP(true);
    try {
      const form = new FormData();
      form.append("goodConductCertificate", gcFile);
      form.append("issueDate", gcIssueDate);
      const res = await fetch("/api/v1/kyc/trusted-personnel", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
        body: form,
      });
      if (res.ok) {
        toast("Application submitted. Admin will review within 5 business days.", "success");
        setGcFile(null);
        setGcIssueDate("");
        await fetchState();
      } else {
        const err = (await res.json()) as { error: string };
        toast(err.error ?? "Application failed.", "error");
      }
    } finally {
      setApplyingTP(false);
    }
  }

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">KYC & Verification</h1>
          <p className="app-page-lead">
            Build trust on the platform. Higher verification levels unlock more features.
          </p>
        </div>
      </div>

      {/* Verification level progress */}
      <Card>
        <CardHeader>
          <CardTitle>Your Verification Level</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="space-y-3">
              {LEVELS.map((l, idx) => {
                const achieved = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div
                    key={l.level}
                    className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                      isCurrent
                        ? "border-blue-300 bg-blue-50"
                        : achieved
                        ? "border-green-200 bg-green-50"
                        : "border-slate-200 bg-white opacity-60"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{l.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{l.label}</span>
                        {isCurrent && (
                          <Badge variant="info" className="text-[11px]">Current</Badge>
                        )}
                        {achieved && !isCurrent && (
                          <Badge variant="success" className="text-[11px]">Achieved</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{l.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Level 1 — Document upload & Didit.me */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              Level 1 — Identity Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Upload your identity document, then complete the Didit.me liveness check (ID photo + selfie + face match).
            </p>
            <div>
              <label className="text-sm font-medium text-slate-800">Identity document type</label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="drivers_license">Driver&apos;s License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dropzone label="Identity document (front)" onFileSelect={setIdFile} />
            <Button
              type="button"
              className="w-full"
              onClick={uploadDocument}
              disabled={!idFile || uploading}
            >
              {uploading ? "Uploading…" : "Upload Document"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={initiateLevel1}
              disabled={state?.verificationLevel !== "UNVERIFIED"}
            >
              Start Didit.me Verification
            </Button>
            <p className="text-xs text-slate-400">
              First verification is free. Platform absorbs the cost.
            </p>

            {/* Recent docs */}
            {state?.kycDocuments?.length ? (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-500">Submitted documents</p>
                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  {state.kycDocuments.slice(0, 5).map((d) => (
                    <div key={d.id} className="flex items-center justify-between">
                      <span className="capitalize">{d.documentType.replace(/_/g, " ")}</span>
                      <Badge
                        variant={d.status === "verified" ? "success" : d.status === "rejected" ? "error" : "neutral"}
                        className="text-[10px]"
                      >
                        {d.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Level 2 — IPRS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Level 2 — Compliance Verified (IPRS)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Your ID is automatically cross-checked against the Kenya government national database (IPRS).
              This is triggered when you create your first listing or request your first payout.
            </p>
            {state?.iprsCheckedAt ? (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <p className="text-sm text-green-800">
                  IPRS check completed on {new Date(state.iprsCheckedAt).toLocaleDateString()}. Result: {state.iprsResult ?? "Confirmed"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <strong>Consent required:</strong> To verify your identity we will check your ID details against
                  the Kenya government national database. This check is required to list a property on Secure Living.
                  Your data is stored securely and never shared with third parties.
                </div>
                <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={iprsConsent}
                    onChange={(e) => setIprsConsent(e.target.checked)}
                  />
                  I agree to the identity verification terms above
                </label>
                <Button
                  type="button"
                  className="w-full"
                  onClick={triggerIprs}
                  disabled={
                    !iprsConsent ||
                    checkingIprs ||
                    state?.verificationLevel === "UNVERIFIED"
                  }
                >
                  {checkingIprs ? "Submitting…" : "Trigger IPRS Check"}
                </Button>
                {state?.verificationLevel === "UNVERIFIED" && (
                  <p className="text-xs text-slate-400">Complete Level 1 first.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Level 3 — Trusted Personnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Level 3 — Trusted Personnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Eligibility: Level 2 verified, active 3+ months, 3+ completed transactions, zero confirmed fraud reports.
            </p>

            {state?.trustedPersonnelStatus === "APPROVED" ? (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                <p className="text-sm text-green-800">
                  Trusted Personnel status active.
                  {state.goodConductExpiresAt && (
                    <> Certificate expires {new Date(state.goodConductExpiresAt).toLocaleDateString()}.</>
                  )}
                </p>
              </div>
            ) : state?.trustedPersonnelStatus === "PENDING" ? (
              <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                <p className="text-sm text-blue-800">Application under review. Admin will respond within 5 business days.</p>
              </div>
            ) : state?.trustedPersonnelStatus === "DENIED" ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-800">Application denied. You may reapply after 30 days.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Upload your Kenya Certificate of Good Conduct (issued within the last 12 months).
                </p>
                <div>
                  <label className="text-sm font-medium text-slate-800">Certificate issue date</label>
                  <input
                    type="date"
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={gcIssueDate}
                    onChange={(e) => setGcIssueDate(e.target.value)}
                  />
                </div>
                <Dropzone label="Good Conduct Certificate (PDF)" onFileSelect={setGcFile} />
                <Button
                  type="button"
                  className="w-full"
                  onClick={applyTrustedPersonnel}
                  disabled={
                    !gcFile ||
                    !gcIssueDate ||
                    applyingTP ||
                    (state?.verificationLevel !== "COMPLIANCE_VERIFIED" &&
                      state?.verificationLevel !== "TRUSTED_PERSONNEL" &&
                      state?.verificationLevel !== "ENTERPRISE_VERIFIED")
                  }
                >
                  {applyingTP ? "Submitting…" : "Apply for Trusted Status"}
                </Button>
              </div>
            )}

            <p className="text-xs text-slate-400">
              <em>Trusted status indicates enhanced platform verification and history review. It is not a legal guarantee, insurance, or endorsement.</em>
            </p>
          </CardContent>
        </Card>

        {/* Legal Document Hub */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-600" />
              Legal Document Hub
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Landlords and agencies must upload at least one document before their first listing goes live.
            </p>
            <div>
              <label className="text-sm font-medium text-slate-800">Document type</label>
              <Select defaultValue="title_deed">
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title_deed">Title Deed</SelectItem>
                  <SelectItem value="sale_agreement">Sale Agreement</SelectItem>
                  <SelectItem value="management_agreement">Management Agreement</SelectItem>
                  <SelectItem value="letter_of_authority">Letter of Authority / Power of Attorney</SelectItem>
                  <SelectItem value="management_letter">Management Letter</SelectItem>
                  <SelectItem value="agency_registration">Agency Registration Certificate</SelectItem>
                  <SelectItem value="kra_pin">KRA PIN Certificate</SelectItem>
                  <SelectItem value="skill_certificate">Skill Certificate / Trade License</SelectItem>
                  <SelectItem value="good_conduct_certificate">Good Conduct Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dropzone label="Legal document" onFileSelect={() => {}} />
            <Button type="button" className="w-full" variant="outline">
              Upload Legal Document
            </Button>
            <p className="text-xs text-slate-400">
              Documents are reviewed within 48 hours. Expired documents will trigger an account soft freeze after a 7-day grace period.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
