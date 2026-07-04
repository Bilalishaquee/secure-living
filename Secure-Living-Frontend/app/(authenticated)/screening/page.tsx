"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Info,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

type ScreeningReport = {
  id: string;
  applicationId: string;
  applicantName: string;
  nationalIdNumber: string | null;
  score: number | null;
  recommendation: "approve" | "review" | "decline" | string;
  riskFlagsJson: string | null;
  notes: string | null;
  status: string;
  generatedBy: string;
  createdAt: string;
};

type RiskFlags = Record<string, unknown>;

const SCORE_WEIGHTS = [
  { label: "Identity & KYC match", weight: 25, detail: "Name, ID/passport, verification level, duplicate account checks." },
  { label: "Rent affordability", weight: 25, detail: "Declared income, rent-to-income pressure, deposit readiness, arrears exposure." },
  { label: "Application quality", weight: 20, detail: "Completeness of custom fields, documents, references, and viewing history." },
  { label: "Platform behaviour", weight: 15, detail: "Past payments, disputes, cancellations, service request conduct, move-out record." },
  { label: "Risk exceptions", weight: 15, detail: "Fraud flags, blacklist hits, mismatched contacts, unresolved compliance concerns." },
];

const AUTO_STEPS = [
  "Collect application, KYC, rent score, deposit, and platform activity signals.",
  "Normalize every signal into a 0-100 risk score using weighted categories.",
  "Apply exception rules for missing KYC, arrears, blacklist hits, duplicate IDs, and fraud flags.",
  "Generate recommendation: approve at 75+, review at 55-74, decline below 55 or critical risk.",
  "Store the report for a human reviewer to confirm, override, or finalize.",
];

function scoreLevel(score: number | null) {
  if (score == null) return { label: "Pending", color: "bg-slate-100 text-slate-700", bar: "bg-slate-300" };
  if (score >= 75) return { label: "Low risk", color: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" };
  if (score >= 55) return { label: "Needs review", color: "bg-amber-100 text-amber-700", bar: "bg-amber-500" };
  return { label: "High risk", color: "bg-red-100 text-red-700", bar: "bg-red-500" };
}

function recommendationVariant(value: string): "success" | "warning" | "error" | "neutral" {
  if (value.toLowerCase() === "approve") return "success";
  if (value.toLowerCase() === "decline") return "error";
  if (value.toLowerCase() === "review") return "warning";
  return "neutral";
}

function parseFlags(value: string | null): RiskFlags {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as RiskFlags : {};
  } catch {
    return { notes: value };
  }
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function ScreeningPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<ScreeningReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [manualNotes, setManualNotes] = useState("");
  const [manualFlag, setManualFlag] = useState("");

  async function load() {
    if (!user) return;
    const res = await fetch("/api/v1/screening-reports", {
      headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
    });
    if (!res.ok) {
      setError("Unable to load screening reports.");
      return;
    }
    const json = (await res.json()) as { data: ScreeningReport[] };
    setRows(json.data);
    setSelectedId((current) => current ?? json.data[0]?.id ?? null);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.authToken]);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null,
    [rows, selectedId],
  );

  useEffect(() => {
    setManualNotes(selected?.notes ?? "");
    setManualFlag("");
  }, [selected?.id, selected?.notes]);

  async function updateReport(
    report: ScreeningReport,
    patch: {
      recommendation?: "approve" | "review" | "decline";
      status?: "generated" | "reviewed" | "finalized";
      notes?: string;
      riskFlagsJson?: RiskFlags;
    },
  ) {
    setBusyId(report.id);
    try {
      const res = await fetch(`/api/v1/screening-reports/${report.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.authToken ?? ""}`,
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast((json as { error?: string }).error ?? "Failed to update screening report", "error");
        return;
      }
      const json = (await res.json()) as { data: ScreeningReport };
      setRows((prev) => prev.map((row) => (row.id === report.id ? json.data : row)));
      toast("Screening decision updated", "success");
    } finally {
      setBusyId(null);
    }
  }

  function manualDecision(decision: "approve" | "review" | "decline") {
    if (!selected) return;
    const flags = parseFlags(selected.riskFlagsJson);
    const nextFlags = manualFlag.trim()
      ? { ...flags, manualReviewerFlag: manualFlag.trim() }
      : flags;
    void updateReport(selected, {
      recommendation: decision,
      status: "reviewed",
      notes: manualNotes,
      riskFlagsJson: nextFlags,
    });
  }

  function finalizeDecision() {
    if (!selected) return;
    void updateReport(selected, {
      status: "finalized",
      notes: manualNotes,
      riskFlagsJson: parseFlags(selected.riskFlagsJson),
    });
  }

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Tenant Screening</h1>
          <p className="app-page-lead">Transparent scoring, manual review controls, and approval decisions.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-emerald-900">
              <BrainCircuit className="h-5 w-5" /> Automatic Screening
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-emerald-900">
            <p>Auto-screening combines tenant application data, KYC, rent score, deposit readiness, and platform behaviour into a weighted recommendation.</p>
            <ol className="space-y-2">
              {AUTO_STEPS.map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-blue-950">
              <Scale className="h-5 w-5" /> Score Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {SCORE_WEIGHTS.map((item) => (
              <div key={item.label} className="rounded-lg bg-white/80 p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{item.weight}%</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-950">
              <SlidersHorizontal className="h-5 w-5" /> Manual Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-amber-950">
            <p>Manual screening is the final human decision. Reviewers can approve, request review, decline, add notes, record override reasons, and finalize the decision.</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white/80 p-3 text-center">
                <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" />
                <p className="mt-1 text-xs font-semibold">Approve</p>
              </div>
              <div className="rounded-lg bg-white/80 p-3 text-center">
                <AlertTriangle className="mx-auto h-5 w-5 text-amber-600" />
                <p className="mt-1 text-xs font-semibold">Review</p>
              </div>
              <div className="rounded-lg bg-white/80 p-3 text-center">
                <XCircle className="mx-auto h-5 w-5 text-red-600" />
                <p className="mt-1 text-xs font-semibold">Decline</p>
              </div>
            </div>
            <p className="rounded-lg border border-amber-200 bg-white/75 p-3 text-xs">
              Negative decisions should include a rectification note, such as missing KYC, insufficient income evidence, unresolved arrears, or document mismatch.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Screening Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="space-y-3">
              {rows.map((row) => {
                const score = scoreLevel(row.score);
                const selectedRow = selected?.id === row.id;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/30 ${
                      selectedRow ? "border-blue-400 bg-blue-50/60 shadow-sm" : "border-surface-border bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{row.applicantName}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <Badge variant={recommendationVariant(row.recommendation)} className="uppercase">
                            {row.recommendation}
                          </Badge>
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${score.color}`}>{score.label}</span>
                          <span className="text-slate-500">{row.status}</span>
                        </div>
                      </div>
                      <div className="w-28 shrink-0 text-right">
                        <p className="font-mono-data text-lg font-semibold text-slate-900">Score {row.score ?? "--"}</p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full ${score.bar}`} style={{ width: `${Math.min(row.score ?? 0, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {rows.length === 0 && !error ? (
                <p className="text-sm text-[var(--text-secondary)]">No screening reports yet.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-5 w-5 text-brand-blue" /> Decision Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <p className="text-sm text-slate-500">Select a screening report to review.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selected.applicantName}</p>
                  <p className="text-xs text-slate-500">Application {selected.applicationId}</p>
                  {selected.nationalIdNumber ? <p className="text-xs text-slate-500">ID {selected.nationalIdNumber}</p> : null}
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">Auto recommendation</span>
                    <Badge variant={recommendationVariant(selected.recommendation)} className="uppercase">
                      {selected.recommendation}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <ShieldCheck className="h-8 w-8 text-blue-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Risk score</span>
                        <span>{selected.score ?? "--"}/100</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={scoreLevel(selected.score).bar} style={{ width: `${Math.min(selected.score ?? 0, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <FileText className="h-4 w-4" /> Risk signals
                  </p>
                  {Object.entries(parseFlags(selected.riskFlagsJson)).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(parseFlags(selected.riskFlagsJson)).map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-xs font-semibold capitalize text-slate-700">{key.replace(/_/g, " ")}</p>
                          <p className="text-xs text-slate-500">{displayValue(value)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">No risk flags were recorded on this report.</p>
                  )}
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
                  <div className="flex gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Approval is not automatic. Auto-screening recommends a decision; the reviewer must confirm, override, or finalize with notes.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Reviewer notes</label>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    rows={4}
                    placeholder="Record why this applicant is approved, under review, or declined."
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Manual flag / rectification action</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. Upload bank statement, resolve arrears, verify employer"
                    value={manualFlag}
                    onChange={(e) => setManualFlag(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" size="sm" onClick={() => manualDecision("approve")} disabled={busyId === selected.id}>
                    Approve
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => manualDecision("review")} disabled={busyId === selected.id}>
                    Review
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => manualDecision("decline")} disabled={busyId === selected.id}>
                    Decline
                  </Button>
                </div>
                <Button type="button" className="w-full" onClick={finalizeDecision} disabled={busyId === selected.id || selected.status === "finalized"}>
                  Finalize decision
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
