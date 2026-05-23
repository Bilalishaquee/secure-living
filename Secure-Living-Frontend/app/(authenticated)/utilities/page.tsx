"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Zap, Droplets, AlertTriangle, Plus, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Meter {
  id: string;
  unitId: string;
  meterNumber: string;
  type: "WATER" | "ELECTRICITY";
  billingModel: "FLAT_RATE" | "SUB_METERED_MANUAL" | "SUB_METERED_IOT";
  isActive: boolean;
  readings: Reading[];
}

interface Reading {
  id: string;
  readingDate: string;
  previousReading: number;
  currentReading: number;
  consumption: number;
  flatRateAmountKes?: number;
  isDisputed: boolean;
  disputeStatus?: string;
}

interface Dispute {
  id: string;
  readingId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function UtilitiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<string>("");
  const [readings, setReadings] = useState<Reading[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);

  // Add meter form
  const [showAddMeter, setShowAddMeter] = useState(false);
  const [newMeter, setNewMeter] = useState({ meterNumber: "", type: "ELECTRICITY", billingModel: "SUB_METERED_MANUAL", unitId: "" });

  // Add reading form
  const [showAddReading, setShowAddReading] = useState(false);
  const [newReading, setNewReading] = useState({ previousReading: "", currentReading: "", readingDate: new Date().toISOString().split("T")[0], flatRateAmountKes: "" });

  // Dispute form
  const [disputeReadingId, setDisputeReadingId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("high_reading");

  function authHeader() {
    return { Authorization: `Bearer ${user?.authToken ?? ""}`, "Content-Type": "application/json" };
  }

  async function fetchMeters() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/utility-meters", { headers: authHeader() });
      if (res.ok) {
        const json = (await res.json()) as { data: Meter[] };
        setMeters(json.data);
        if (json.data.length && !selectedMeter) setSelectedMeter(json.data[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchReadings(meterId: string) {
    if (!user || !meterId) return;
    const res = await fetch(`/api/v1/utility-readings?meterId=${meterId}`, { headers: authHeader() });
    if (res.ok) {
      const json = (await res.json()) as { data: Reading[] };
      setReadings(json.data);
    }
    const dRes = await fetch(`/api/v1/utility-disputes?meterId=${meterId}`, { headers: authHeader() });
    if (dRes.ok) {
      const dJson = (await dRes.json()) as { data: Dispute[] };
      setDisputes(dJson.data);
    }
  }

  useEffect(() => { void fetchMeters(); }, [user]);
  useEffect(() => { if (selectedMeter) void fetchReadings(selectedMeter); }, [selectedMeter]);

  async function addMeter() {
    if (!newMeter.meterNumber || !newMeter.unitId) {
      toast("Meter number and unit ID are required.", "error");
      return;
    }
    if (newMeter.billingModel === "SUB_METERED_IOT") {
      toast("IoT meter integration is coming soon.", "info");
      return;
    }
    const res = await fetch("/api/v1/utility-meters", {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(newMeter),
    });
    if (res.ok) {
      toast("Meter registered.", "success");
      setShowAddMeter(false);
      setNewMeter({ meterNumber: "", type: "ELECTRICITY", billingModel: "SUB_METERED_MANUAL", unitId: "" });
      await fetchMeters();
    } else {
      const err = (await res.json()) as { error: string };
      toast(err.error ?? "Failed to register meter.", "error");
    }
  }

  async function submitReading() {
    if (!selectedMeter) return;
    const res = await fetch("/api/v1/utility-readings", {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({
        meterId: selectedMeter,
        readingDate: new Date(newReading.readingDate).toISOString(),
        previousReading: parseFloat(newReading.previousReading),
        currentReading: parseFloat(newReading.currentReading),
        ...(newReading.flatRateAmountKes ? { flatRateAmountKes: parseFloat(newReading.flatRateAmountKes) } : {}),
      }),
    });
    if (res.ok) {
      toast("Reading submitted.", "success");
      setShowAddReading(false);
      setNewReading({ previousReading: "", currentReading: "", readingDate: new Date().toISOString().split("T")[0], flatRateAmountKes: "" });
      await fetchReadings(selectedMeter);
    } else {
      const err = (await res.json()) as { error: string };
      toast(err.error ?? "Failed to submit reading.", "error");
    }
  }

  async function raiseDispute() {
    if (!disputeReadingId) return;
    const res = await fetch("/api/v1/utility-disputes", {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ readingId: disputeReadingId, reason: disputeReason }),
    });
    if (res.ok) {
      toast("Dispute raised. Landlord will be notified.", "success");
      setDisputeReadingId(null);
      if (selectedMeter) await fetchReadings(selectedMeter);
    } else {
      const err = (await res.json()) as { error: string };
      toast(err.error ?? "Failed to raise dispute.", "error");
    }
  }

  const activeMeter = meters.find((m) => m.id === selectedMeter);
  const chartData = [...readings].reverse().map((r) => ({
    date: new Date(r.readingDate).toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
    consumption: r.consumption,
  }));

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Utility Management</h1>
          <p className="app-page-lead">Meter readings, billing, service charges, and dispute resolution.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setShowAddMeter(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Register Meter
          </Button>
          <Button type="button" onClick={() => setShowAddReading(true)} disabled={!selectedMeter}>
            <Plus className="mr-1.5 h-4 w-4" /> Submit Reading
          </Button>
        </div>
      </div>

      {/* Meter selector */}
      {meters.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-700">Active meter</label>
              <Select value={selectedMeter} onValueChange={setSelectedMeter}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a meter" />
                </SelectTrigger>
                <SelectContent>
                  {meters.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.type === "WATER" ? <Droplets className="inline h-3 w-3 mr-1 text-blue-500" /> : <Zap className="inline h-3 w-3 mr-1 text-amber-500" />}
                      {m.meterNumber} ({m.billingModel.replace(/_/g, " ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon" onClick={() => selectedMeter && fetchReadings(selectedMeter)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Register meter form */}
      {showAddMeter && (
        <Card>
          <CardHeader><CardTitle>Register New Meter</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Unit ID</label>
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={newMeter.unitId} onChange={(e) => setNewMeter((p) => ({ ...p, unitId: e.target.value }))} placeholder="Unit ID" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Meter number</label>
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={newMeter.meterNumber} onChange={(e) => setNewMeter((p) => ({ ...p, meterNumber: e.target.value }))} placeholder="Meter number" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Type</label>
                <Select value={newMeter.type} onValueChange={(v) => setNewMeter((p) => ({ ...p, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ELECTRICITY">Electricity</SelectItem>
                    <SelectItem value="WATER">Water</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Billing model</label>
                <Select value={newMeter.billingModel} onValueChange={(v) => setNewMeter((p) => ({ ...p, billingModel: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT_RATE">Flat Rate</SelectItem>
                    <SelectItem value="SUB_METERED_MANUAL">Sub-metered (Manual)</SelectItem>
                    <SelectItem value="SUB_METERED_IOT">Sub-metered (IoT — coming soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={addMeter}>Register</Button>
              <Button type="button" variant="ghost" onClick={() => setShowAddMeter(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit reading form */}
      {showAddReading && activeMeter && (
        <Card>
          <CardHeader><CardTitle>Submit Meter Reading — {activeMeter.meterNumber}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Reading date</label>
                <input type="date" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={newReading.readingDate} onChange={(e) => setNewReading((p) => ({ ...p, readingDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Previous reading</label>
                <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={newReading.previousReading} onChange={(e) => setNewReading((p) => ({ ...p, previousReading: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Current reading</label>
                <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={newReading.currentReading} onChange={(e) => setNewReading((p) => ({ ...p, currentReading: e.target.value }))} placeholder="0.00" />
              </div>
              {activeMeter.billingModel === "FLAT_RATE" && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Flat rate amount (KES)</label>
                  <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={newReading.flatRateAmountKes} onChange={(e) => setNewReading((p) => ({ ...p, flatRateAmountKes: e.target.value }))} placeholder="0.00" />
                </div>
              )}
            </div>
            {newReading.previousReading && newReading.currentReading && (
              <p className="text-sm text-slate-600">
                Consumption: <strong>{(parseFloat(newReading.currentReading) - parseFloat(newReading.previousReading)).toFixed(2)} units</strong>
              </p>
            )}
            <div className="flex gap-2">
              <Button type="button" onClick={submitReading}>Submit Reading</Button>
              <Button type="button" variant="ghost" onClick={() => setShowAddReading(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Consumption history chart */}
        <Card>
          <CardHeader><CardTitle>Consumption History</CardTitle></CardHeader>
          <CardContent>
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="consumption" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No reading history yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent readings */}
        <Card>
          <CardHeader><CardTitle>Recent Readings</CardTitle></CardHeader>
          <CardContent>
            {readings.length ? (
              <div className="space-y-2">
                {readings.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">
                        {r.previousReading} → {r.currentReading}
                        <span className="ml-2 text-slate-500">({r.consumption} units)</span>
                      </p>
                      <p className="text-xs text-slate-400">{new Date(r.readingDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.isDisputed && (
                        <Badge variant="warning" className="text-[10px]">{r.disputeStatus ?? "Disputed"}</Badge>
                      )}
                      {!r.isDisputed && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => setDisputeReadingId(r.id)}
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" /> Dispute
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No readings submitted yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dispute form */}
      {disputeReadingId && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-red-700"><AlertTriangle className="h-4 w-4" /> Raise a Billing Dispute</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Note: a disputed invoice is not blocked from payment. You may pay under protest while the dispute is pending.
              Overpayments are credited to your next invoice.
            </p>
            <div>
              <label className="text-sm font-medium text-slate-700">Reason</label>
              <Select value={disputeReason} onValueChange={setDisputeReason}>
                <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_reading">Reading seems too high</SelectItem>
                  <SelectItem value="wrong_unit">Wrong unit charged</SelectItem>
                  <SelectItem value="previous_reading_mismatch">Previous reading mismatch</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={raiseDispute}>Submit Dispute</Button>
              <Button type="button" variant="ghost" onClick={() => setDisputeReadingId(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open disputes */}
      {disputes.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Disputes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {disputes.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-amber-900">{d.reason.replace(/_/g, " ")}</p>
                    <p className="text-xs text-amber-600">{new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="warning" className="text-[10px]">{d.status.replace(/_/g, " ")}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!meters.length && !loading && (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-slate-500">No meters registered yet.</p>
            <Button type="button" className="mt-4" onClick={() => setShowAddMeter(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Register First Meter
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
