"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";


const STATUS_COLORS: Record<string, string> = {
  NEW:        "bg-blue-100 text-blue-700",
  IN_PROGRESS:"bg-yellow-100 text-yellow-700",
  COMPLETED:  "bg-green-100 text-green-700",
  CANCELLED:  "bg-slate-100 text-slate-500",
};

type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  assignedTo: string | null;
  internalNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
  category: { id: string; name: string; slug: string } | null;
};

export default function ServiceEnquiriesAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/v1/service-enquiries${params}`, {
        headers: { Authorization: `Bearer ${user?.authToken}` },
      });
      if (res.ok) {
        const j = await res.json();
        setEnquiries(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (user?.authToken) load(); }, [user?.authToken, statusFilter]);

  function openDetail(enq: Enquiry) {
    setSelected(enq);
    setAssignedTo(enq.assignedTo ?? "");
    setNotes(enq.internalNotes ?? "");
    setStatus(enq.status);
  }

  async function handleUpdate() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/service-enquiries/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken}` },
        body: JSON.stringify({
          status,
          assignedTo: assignedTo || null,
          internalNotes: notes || null,
        }),
      });
      if (res.ok) {
        toast({ title: "Enquiry updated", variant: "success" });
        setSelected(null);
        load();
      } else {
        const j = await res.json();
        toast({ title: j.error ?? "Failed", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Service Enquiries</h1>
        <p className="mt-1 text-sm text-slate-500">Manage inbound enquiries from the public services pages</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Status:</label>
        <div className="relative">
          <select
            className="appearance-none rounded-lg border border-slate-200 py-1.5 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-slate-400" />
        </div>
        <span className="text-sm text-slate-500">{enquiries.length} results</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : enquiries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <MessageSquare className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700">No enquiries</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.map((enq) => {
                  const sc = STATUS_COLORS[enq.status] ?? "bg-slate-100 text-slate-700";
                  return (
                    <tr key={enq.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{enq.name}</td>
                      <td className="px-4 py-3 text-slate-600">{enq.email}</td>
                      <td className="px-4 py-3 text-slate-600">{enq.category?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sc}`}>{enq.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{enq.assignedTo ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(enq.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" onClick={() => openDetail(enq)}>Manage</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Detail modal */}
      <Modal open={!!selected} onOpenChange={() => setSelected(null)} title="Enquiry Detail">
        {selected && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 text-sm space-y-1">
              <p><span className="font-medium">From:</span> {selected.name} &lt;{selected.email}&gt;{selected.phone ? ` · ${selected.phone}` : ""}</p>
              <p><span className="font-medium">Category:</span> {selected.category?.name ?? "General"}</p>
              <p><span className="font-medium">Received:</span> {new Date(selected.createdAt).toLocaleString()}</p>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Message</p>
              <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">{selected.message}</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Assign To</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Team member name or email"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Internal Notes</label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setSelected(null)} className="flex-1">Close</Button>
              <Button onClick={handleUpdate} disabled={saving} className="flex-1">
                {saving ? "Saving…" : "Update"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
