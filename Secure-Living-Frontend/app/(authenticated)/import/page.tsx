"use client";

import { useState } from "react";
import {
  FileInput,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Download,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type EntityType = "properties" | "units" | "tenants";

type ImportError = { row: number; reason: string };
type ImportResult = { imported: number; errors: ImportError[] };

const ENTITY_CONFIG: Record<EntityType, {
  label: string;
  description: string;
  columns: string[];
  example: Record<string, string>[];
}> = {
  properties: {
    label: "Properties",
    description: "Import property records with addresses and category information.",
    columns: ["name", "addressLine1", "city", "county", "country", "propertyType", "category", "gpsLatitude", "gpsLongitude"],
    example: [
      { name: "Sunrise Apartments", addressLine1: "Ngong Road, Karen", city: "Nairobi", county: "Nairobi", country: "Kenya", propertyType: "Apartment Block", category: "residential" },
      { name: "Westlands Plaza", addressLine1: "Westlands Ave", city: "Nairobi", county: "Nairobi", country: "Kenya", propertyType: "Commercial", category: "commercial" },
    ],
  },
  units: {
    label: "Units",
    description: "Import units linked to existing properties by property name.",
    columns: ["propertyName", "unitNumber", "unitType", "category", "rentAmountKes", "depositAmountKes", "bedrooms", "sizeSqft", "floor"],
    example: [
      { propertyName: "Sunrise Apartments", unitNumber: "A1", unitType: "2BR", category: "residential", rentAmountKes: "45000", depositAmountKes: "45000", bedrooms: "2" },
      { propertyName: "Westlands Plaza", unitNumber: "Shop 1", unitType: "Shop", category: "commercial", rentAmountKes: "80000", depositAmountKes: "80000" },
    ],
  },
  tenants: {
    label: "Tenants",
    description: "Import tenant user accounts. Imported tenants will need to reset their password.",
    columns: ["fullName", "email", "phone"],
    example: [
      { fullName: "John Mwangi", email: "john@example.com", phone: "+254712345678" },
      { fullName: "Mary Wanjiku", email: "mary@example.com", phone: "+254798765432" },
    ],
  },
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0]?.split(",").map((h) => h.trim().replace(/^"|"$/g, "")) ?? [];
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

function toCsv(rows: Record<string, string>[], cols: string[]): string {
  const header = cols.join(",");
  const dataRows = rows.map((r) => cols.map((c) => `"${r[c] ?? ""}"`).join(","));
  return [header, ...dataRows].join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const STEPS = ["Choose Type", "Prepare Data", "Preview & Validate", "Import"];

export default function ImportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [entity, setEntity] = useState<EntityType>("properties");
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<Record<string, string>[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const config = ENTITY_CONFIG[entity];

  function handleParse() {
    setParseError(null);
    if (!csvText.trim()) {
      setParseError("Please paste CSV data first.");
      return;
    }
    try {
      const rows = parseCsv(csvText);
      if (rows.length === 0) {
        setParseError("No data rows found. Make sure the first row is a header.");
        return;
      }
      setParsed(rows);
      setStep(2);
    } catch {
      setParseError("Failed to parse CSV. Check the format.");
    }
  }

  async function handleImport() {
    if (!user?.authToken || parsed.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/v1/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.authToken}`,
        },
        body: JSON.stringify({
          organizationId: user.organizationId,
          branchId: user.branchId,
          entity,
          rows: parsed,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast(err.error ?? "Import failed", "error");
        return;
      }
      const json = (await res.json()) as { data: ImportResult };
      setResult(json.data);
      setStep(3);
      if (json.data.errors.length === 0) {
        toast(`Successfully imported ${json.data.imported} ${config.label.toLowerCase()}`, "success");
      } else {
        toast(`Imported ${json.data.imported} rows. ${json.data.errors.length} rows failed — check error report.`, "info");
      }
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setStep(0);
    setCsvText("");
    setParsed([]);
    setParseError(null);
    setResult(null);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Data Import</h1>
          <p className="app-page-lead">
            Migrate your existing portfolio data — properties, units, and tenants.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i < step ? "bg-emerald-500 text-white" :
              i === step ? "bg-brand-blue text-white" :
              "bg-slate-200 text-slate-500"
            }`}>
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm ${i === step ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* Step 0: Choose Type */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">What do you want to import?</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((ent) => (
              <button
                key={ent}
                type="button"
                onClick={() => setEntity(ent)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  entity === ent
                    ? "border-brand-blue bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <FileInput className={`h-6 w-6 mb-2 ${entity === ent ? "text-brand-blue" : "text-slate-400"}`} />
                <p className="font-semibold text-sm">{ENTITY_CONFIG[ent].label}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{ENTITY_CONFIG[ent].description}</p>
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Required columns for {config.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {config.columns.map((col) => (
                  <span key={col} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-mono text-slate-700">{col}</span>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => downloadCsv(`${entity}-template.csv`, toCsv(config.example, config.columns))}
              >
                <Download className="mr-2 h-4 w-4" /> Download CSV Template
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setStep(1)}>Next: Prepare Data</Button>
          </div>
        </div>
      )}

      {/* Step 1: Paste CSV */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Paste your CSV data</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            The first row must be a header row. Column names are flexible — the system auto-maps common variations.
          </p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-600">
            <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Example format:</p>
            {config.columns.join(",")}
            <br />
            {config.example.map((row, i) => (
              <span key={i}>{config.columns.map((c) => row[c] ?? "").join(",")}<br /></span>
            ))}
          </div>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Paste CSV here…\n\n${config.columns.join(",")}\n${config.example.map((r) => config.columns.map((c) => r[c] ?? "").join(",")).join("\n")}`}
            rows={12}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue/40 resize-y"
          />

          {parseError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <XCircle className="h-4 w-4 shrink-0" />
              {parseError}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={handleParse}>Preview Data</Button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Preview — {parsed.length} rows detected</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Showing first 10 rows. Review carefully before importing.
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-2 text-left text-slate-500 font-medium">#</th>
                  {Object.keys(parsed[0] ?? {}).map((col) => (
                    <th key={col} className="px-3 py-2 text-left text-slate-500 font-medium">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-3 py-2 text-[var(--text-primary)]">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > 10 && (
              <p className="px-3 py-2 text-xs text-[var(--text-muted)]">
                … and {parsed.length - 10} more rows
              </p>
            )}
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This will import <strong>{parsed.length}</strong> {config.label.toLowerCase()} into your organisation.
              Existing records with the same identifier will be skipped (no duplicates created).
            </span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => { void handleImport(); }} disabled={importing}>
              {importing ? `Importing ${parsed.length} rows…` : `Import ${parsed.length} rows`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && result && (
        <div className="space-y-4">
          <div className={`rounded-xl border-2 p-6 text-center ${
            result.errors.length === 0
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }`}>
            {result.errors.length === 0 ? (
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            ) : (
              <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            )}
            <h2 className="mt-3 text-lg font-bold">
              {result.errors.length === 0 ? "Import Complete" : "Import Partially Complete"}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              <strong>{result.imported}</strong> {config.label.toLowerCase()} imported successfully.
              {result.errors.length > 0 && ` ${result.errors.length} row(s) failed.`}
            </p>
          </div>

          {result.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-red-700">Failed Rows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-64 overflow-y-auto [scrollbar-width:thin]">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <span><strong>Row {err.row}:</strong> {err.reason}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={reset}>Start New Import</Button>
            <Button asChild>
              <a href="/properties">View Properties</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
