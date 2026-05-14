"use client";

import { useState } from "react";
import {
  FileInput,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Download,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

type EntityType = "properties" | "units" | "tenants";

type ImportError = { row: number; reason: string };
type ImportResult = { imported: number; errors: ImportError[]; skipped?: number };

const ENTITY_CONFIG: Record<EntityType, {
  label: string;
  description: string;
  columns: string[];
  mappableFields: { value: string; label: string; required?: boolean }[];
  example: Record<string, string>[];
}> = {
  properties: {
    label: "Properties",
    description: "Import property records with addresses and category information.",
    columns: ["name", "addressLine1", "city", "county", "country", "propertyType", "category"],
    mappableFields: [
      { value: "name", label: "Property Name", required: true },
      { value: "addressLine1", label: "Address" },
      { value: "city", label: "City" },
      { value: "county", label: "County" },
      { value: "country", label: "Country" },
      { value: "propertyType", label: "Property Type" },
      { value: "category", label: "Category" },
      { value: "_ignore", label: "Ignore this column" },
    ],
    example: [
      { name: "Sunrise Apartments", addressLine1: "Ngong Road, Karen", city: "Nairobi", county: "Nairobi", country: "Kenya", propertyType: "Apartment Block", category: "residential" },
    ],
  },
  units: {
    label: "Units",
    description: "Import units linked to existing properties.",
    columns: ["propertyName", "unitNumber", "unitType", "category", "rentAmountKes", "depositAmountKes", "bedrooms", "floor"],
    mappableFields: [
      { value: "propertyName", label: "Property Name", required: true },
      { value: "unitNumber", label: "Unit Number", required: true },
      { value: "unitType", label: "Unit Type" },
      { value: "category", label: "Category" },
      { value: "rentAmountKes", label: "Monthly Rent (KES)" },
      { value: "depositAmountKes", label: "Deposit (KES)" },
      { value: "bedrooms", label: "Bedrooms" },
      { value: "floor", label: "Floor" },
      { value: "_ignore", label: "Ignore this column" },
    ],
    example: [
      { propertyName: "Sunrise Apartments", unitNumber: "A1", unitType: "2BR", category: "residential", rentAmountKes: "45000", depositAmountKes: "45000", bedrooms: "2" },
    ],
  },
  tenants: {
    label: "Tenants",
    description: "Import tenant accounts with optional lease details.",
    columns: ["fullName", "email", "phone", "unitReference", "idNumber", "leaseStartDate", "monthlyRent", "depositAmount"],
    mappableFields: [
      { value: "fullName", label: "Full Name", required: true },
      { value: "firstName", label: "First Name" },
      { value: "lastName", label: "Last Name" },
      { value: "email", label: "Email", required: true },
      { value: "phone", label: "Phone" },
      { value: "unitReference", label: "Unit Reference" },
      { value: "idNumber", label: "ID Number" },
      { value: "leaseStartDate", label: "Lease Start Date" },
      { value: "monthlyRent", label: "Monthly Rent" },
      { value: "depositAmount", label: "Deposit Amount" },
      { value: "_ignore", label: "Ignore this column" },
    ],
    example: [
      { fullName: "John Mwangi", email: "john@example.com", phone: "+254712345678", unitReference: "A1", monthlyRent: "45000" },
    ],
  },
};

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0]?.split(",").map((h) => h.trim().replace(/^"|"$/g, "")) ?? [];
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
  return { headers, rows };
}

function autoMap(header: string, fields: { value: string; label: string }[]): string {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliases: Record<string, string> = {
    name: "name", fullname: "fullName", firstname: "firstName", lastname: "lastName",
    email: "email", phone: "phone", mobile: "phone", phonenumber: "phone",
    unit: "unitNumber", unitnumber: "unitNumber", unitno: "unitNumber", unitreference: "unitReference",
    property: "propertyName", propertyname: "propertyName",
    rent: "monthlyRent", monthlyrent: "monthlyRent", rentamount: "monthlyRent", rentamountkes: "rentAmountKes",
    deposit: "depositAmount", depositamount: "depositAmount", depositamountkes: "depositAmountKes",
    id: "idNumber", idnumber: "idNumber", nationalid: "idNumber",
    leasestart: "leaseStartDate", startdate: "leaseStartDate",
    city: "city", county: "county", country: "country",
    address: "addressLine1", addressline1: "addressLine1",
    category: "category", type: "propertyType", propertytype: "propertyType",
    unittype: "unitType", bedrooms: "bedrooms", floor: "floor",
  };
  const mapped = aliases[h];
  if (mapped && fields.find((f) => f.value === mapped)) return mapped;
  return "_ignore";
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

const STEPS = ["Choose Type", "Upload CSV", "Map Columns", "Preview", "Result"];

export default function ImportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [entity, setEntity] = useState<EntityType>("properties");
  const [csvText, setCsvText] = useState("");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const config = ENTITY_CONFIG[entity];

  function handleParse() {
    setParseError(null);
    if (!csvText.trim()) { setParseError("Please paste CSV data first."); return; }
    const { headers, rows } = parseCsv(csvText);
    if (rows.length === 0) { setParseError("No data rows found. Make sure the first row is a header."); return; }
    setCsvHeaders(headers);
    setCsvRows(rows);
    // Auto-map columns
    const autoMapped: Record<string, string> = {};
    headers.forEach((h) => { autoMapped[h] = autoMap(h, config.mappableFields); });
    setMappings(autoMapped);
    setStep(2);
  }

  // Build mapped rows from CSV rows + mappings
  function buildMappedRows(): Record<string, string>[] {
    return csvRows.map((row) => {
      const mapped: Record<string, string> = {};
      Object.entries(mappings).forEach(([csvCol, field]) => {
        if (field !== "_ignore" && field) {
          mapped[field] = row[csvCol] ?? "";
        }
      });
      // Merge firstName + lastName into fullName if fullName not already mapped
      if (!mapped.fullName && (mapped.firstName || mapped.lastName)) {
        mapped.fullName = [mapped.firstName, mapped.lastName].filter(Boolean).join(" ");
      }
      return mapped;
    });
  }

  function rowStatus(row: Record<string, string>): "ok" | "warn" | "error" {
    const required = config.mappableFields.filter((f) => f.required).map((f) => f.value);
    const missing = required.filter((f) => !row[f]);
    if (missing.length > 0) return "error";
    // Warn if unitReference not found (tenant import only, simplified check)
    if (entity === "tenants" && row.unitReference && !/^[A-Za-z0-9\-\/]+$/.test(row.unitReference)) return "warn";
    return "ok";
  }

  async function handleImport() {
    if (!user?.authToken) return;
    setImporting(true);
    const mappedRows = buildMappedRows();
    try {
      // First do a dry run
      const dryRes = await fetch(`/api/v1/import?dryRun=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.authToken}` },
        body: JSON.stringify({ organizationId: user.organizationId, branchId: user.branchId, entity, rows: mappedRows, mappings }),
      });
      const dryJson = (await dryRes.json()) as { data: ImportResult };
      // If dry run has errors, show them but still allow import
      const res = await fetch(`/api/v1/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.authToken}` },
        body: JSON.stringify({ organizationId: user.organizationId, branchId: user.branchId, entity, rows: mappedRows, mappings }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast(err.error ?? "Import failed", "error");
        return;
      }
      const json = (await res.json()) as { data: ImportResult };
      setResult(json.data);
      setStep(4);
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setStep(0); setCsvText(""); setCsvHeaders([]); setCsvRows([]);
    setMappings({}); setParseError(null); setResult(null);
  }

  const mappedRows = step >= 3 ? buildMappedRows() : [];
  const errorRows = mappedRows.filter((r) => rowStatus(r) === "error");
  const warnRows = mappedRows.filter((r) => rowStatus(r) === "warn");
  const goodRows = mappedRows.filter((r) => rowStatus(r) === "ok");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Data Import</h1>
          <p className="app-page-lead">Migrate your existing portfolio data — properties, units, and tenants.</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i < step ? "bg-emerald-500 text-white" : i === step ? "bg-brand-blue text-white" : "bg-slate-200 text-slate-500"
            }`}>
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm ${i === step ? "font-medium text-slate-900" : "text-slate-400"}`}>{s}</span>
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
              <button key={ent} type="button" onClick={() => setEntity(ent)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${entity === ent ? "border-brand-blue bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <FileInput className={`h-6 w-6 mb-2 ${entity === ent ? "text-brand-blue" : "text-slate-400"}`} />
                <p className="font-semibold text-sm">{ENTITY_CONFIG[ent].label}</p>
                <p className="mt-1 text-xs text-slate-500">{ENTITY_CONFIG[ent].description}</p>
              </button>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Expected columns for {config.label}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {config.columns.map((col) => (
                  <span key={col} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-mono text-slate-700">{col}</span>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-4"
                onClick={() => downloadCsv(`${entity}-template.csv`, toCsv(config.example, config.columns))}>
                <Download className="mr-2 h-4 w-4" /> Download CSV Template
              </Button>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => setStep(1)}>Next: Upload CSV <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Step 1: Paste CSV */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Paste your CSV data</h2>
          <p className="text-sm text-slate-500">
            The first row must be a header row. Column names don&apos;t need to match exactly — you&apos;ll map them in the next step.
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-600">
            <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Example format:</p>
            {config.columns.join(",")}<br />
            {config.example.map((row, i) => (
              <span key={i}>{config.columns.map((c) => row[c] ?? "").join(",")}<br /></span>
            ))}
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Paste CSV here…\n\n${config.columns.join(",")}`}
            rows={12}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue/40 resize-y"
          />
          {parseError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <XCircle className="h-4 w-4 shrink-0" /> {parseError}
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={handleParse}>Parse & Map Columns <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Map CSV columns to fields</h2>
          <p className="text-sm text-slate-500">
            We auto-detected {Object.values(mappings).filter((v) => v !== "_ignore").length} of {csvHeaders.length} columns.
            Adjust any mappings that look incorrect.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="px-4 py-2.5 text-left">CSV Column Header</th>
                  <th className="px-4 py-2.5 text-left">Sample Value</th>
                  <th className="px-4 py-2.5 text-left">Map To Field</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {csvHeaders.map((header) => {
                  const sample = csvRows[0]?.[header] ?? "";
                  const mappedTo = mappings[header] ?? "_ignore";
                  return (
                    <tr key={header}>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{header}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[200px] truncate">{sample || "—"}</td>
                      <td className="px-4 py-2.5">
                        <select
                          value={mappedTo}
                          onChange={(e) => setMappings((m) => ({ ...m, [header]: e.target.value }))}
                          className={`rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 ${
                            mappedTo === "_ignore" ? "border-slate-200 text-slate-400" : "border-brand-blue/30 text-slate-900"
                          }`}
                        >
                          {config.mappableFields.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}{f.required ? " *" : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)}>Preview Rows <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview with highlighting */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Preview — {mappedRows.length} rows</h2>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-green-700">
              <CheckCircle2 className="h-4 w-4" /> {goodRows.length} ready
            </span>
            {warnRows.length > 0 && (
              <span className="flex items-center gap-1.5 text-amber-700">
                <AlertTriangle className="h-4 w-4" /> {warnRows.length} warnings
              </span>
            )}
            {errorRows.length > 0 && (
              <span className="flex items-center gap-1.5 text-red-700">
                <XCircle className="h-4 w-4" /> {errorRows.length} will be skipped
              </span>
            )}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  {Object.values(mappings).filter((v) => v !== "_ignore").filter((v, i, arr) => arr.indexOf(v) === i).map((field) => (
                    <th key={field} className="px-3 py-2 text-left">{field}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mappedRows.slice(0, 15).map((row, i) => {
                  const status = rowStatus(row);
                  return (
                    <tr key={i} className={`border-b ${
                      status === "error" ? "bg-red-50" : status === "warn" ? "bg-amber-50" : "hover:bg-slate-50"
                    }`}>
                      <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2">
                        {status === "error" ? <XCircle className="h-3.5 w-3.5 text-red-500" /> :
                         status === "warn" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> :
                         <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                      </td>
                      {Object.values(mappings).filter((v) => v !== "_ignore").filter((v, idx, arr) => arr.indexOf(v) === idx).map((field) => (
                        <td key={field} className="px-3 py-2 text-slate-700 max-w-[160px] truncate">{row[field] || "—"}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {mappedRows.length > 15 && (
              <p className="px-3 py-2 text-xs text-slate-400">… and {mappedRows.length - 15} more rows</p>
            )}
          </div>
          {errorRows.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {errorRows.length} row(s) missing required fields (Email, Full Name) and will be skipped during import.
            </div>
          )}
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <strong>{goodRows.length + warnRows.length}</strong> rows will be imported. {errorRows.length > 0 && <span className="text-red-600"><strong>{errorRows.length}</strong> will be skipped.</span>}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={() => { void handleImport(); }} disabled={importing || goodRows.length + warnRows.length === 0}>
              {importing ? `Importing…` : `Import ${goodRows.length + warnRows.length} rows`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === 4 && result && (
        <div className="space-y-4">
          <div className={`rounded-xl border-2 p-6 text-center ${result.errors.length === 0 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            {result.errors.length === 0
              ? <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              : <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />}
            <h2 className="mt-3 text-lg font-bold">
              {result.errors.length === 0 ? "Import Complete" : "Import Partially Complete"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              <strong>{result.imported}</strong> {config.label.toLowerCase()} imported.
              {result.errors.length > 0 && ` ${result.errors.length} row(s) failed.`}
            </p>
          </div>
          {result.errors.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm text-red-700">Failed Rows</CardTitle></CardHeader>
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
            <Button asChild><a href="/properties">View Properties</a></Button>
          </div>
        </div>
      )}
    </div>
  );
}
