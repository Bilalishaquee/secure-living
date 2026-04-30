"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

type OrgType = "Diaspora Client" | "Agency" | "Independent Manager";
type OrgRow = {
  id: string;
  name: string;
  type: string;
  country: string;
  email: string;
  phone?: string | null;
  usersCount: number;
  status: string;
  branches: { id: string; name: string; location?: string | null; usersCount?: number }[];
};

export default function OrganizationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(orgs[0]?.id ?? null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Independent Manager" as OrgType,
    country: "Kenya",
    email: "",
    phone: "",
  });
  const [branchDraft, setBranchDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const res = await fetch("/api/v1/organizations", {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as { data: OrgRow[] };
      setOrgs(json.data);
      setExpanded(json.data[0]?.id ?? null);
    })();
  }, [user]);

  const toggle = (id: string) => {
    setExpanded((e) => (e === id ? null : id));
  };

  const createOrg = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast("Please fill required fields", "error");
      return;
    }
    const res = await fetch("/api/v1/organizations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.authToken ?? ""}`,
      },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      toast("Organization creation failed", "error");
      return;
    }
    const json = (await res.json()) as { data: OrgRow };
    setOrgs((o) => [json.data, ...o]);
    setModalOpen(false);
    setForm({
      name: "",
      type: "Independent Manager",
      country: "Kenya",
      email: "",
      phone: "",
    });
    toast("Organization created", "success");
  };

  const addBranch = async (orgId: string) => {
    const name = (branchDraft[orgId] ?? "").trim();
    if (!name) return;
    const res = await fetch(`/api/v1/organizations/${orgId}/branches`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${user?.authToken ?? ""}`,
      },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      toast("Failed to add branch", "error");
      return;
    }
    const json = (await res.json()) as { data: { id: string; name: string; location?: string } };
    setOrgs((items) =>
      items.map((i) => (i.id === orgId ? { ...i, branches: [...i.branches, json.data] } : i))
    );
    setBranchDraft((s) => ({ ...s, [orgId]: "" }));
  };

  return (
    <div className="w-full space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Organizations &amp; branches</h1>
          <p className="app-page-lead">Diaspora clients, agencies, and independent managers</p>
        </div>
        <Button type="button" className="shrink-0" onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Create organization"
        description="Add a new tenant organization to Secure Living."
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Organization name</label>
            <input
              className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as OrgType }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Diaspora Client">Diaspora Client</SelectItem>
                <SelectItem value="Agency">Agency</SelectItem>
                <SelectItem value="Independent Manager">Independent Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Country</label>
            <input
              className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Primary email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              className="mt-1 w-full rounded-xl border border-surface-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <Button type="button" className="w-full" onClick={createOrg}>
            Save organization
          </Button>
        </div>
      </Modal>

      <div className="space-y-4">
        {orgs.map((org) => (
          <Card key={org.id}>
            <CardContent className="p-0">
              <button
                type="button"
                onClick={() => toggle(org.id)}
                className="flex w-full flex-wrap items-center gap-2 gap-y-3 border-b border-slate-200/60 px-4 py-4 text-left transition-colors hover:bg-sky-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue sm:flex-nowrap sm:gap-3"
                aria-expanded={expanded === org.id}
              >
                {expanded === org.id ? (
                  <ChevronDown className="h-5 w-5 shrink-0 text-brand-blue" />
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-navy">{org.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{org.type}</p>
                </div>
                <Badge variant="neutral">{org.branches.length} branches</Badge>
                <Badge variant="neutral">{org.usersCount} users</Badge>
                <Badge variant={org.status === "Active" ? "success" : "warning"}>
                  {org.status}
                </Badge>
              </button>
              {expanded === org.id ? (
                <div className="space-y-4 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-brand-navy">Branches</h3>
                    <div className="flex gap-2">
                      <input
                        className="rounded-md border border-surface-border px-2 py-1 text-xs"
                        placeholder="New branch"
                        value={branchDraft[org.id] ?? ""}
                        onChange={(e) =>
                          setBranchDraft((s) => ({ ...s, [org.id]: e.target.value }))
                        }
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => addBranch(org.id)}>
                        + Add Branch
                      </Button>
                    </div>
                  </div>
                  <div className="app-touch-x-scroll overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead className="text-[var(--text-secondary)]">
                        <tr>
                          <th className="py-2 pr-4 font-medium">Branch</th>
                          <th className="py-2 pr-4 font-medium">Location</th>
                          <th className="py-2 pr-4 font-medium">Users</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {org.branches.map((b) => (
                          <tr key={b.id}>
                            <td className="py-3 pr-4 font-medium">{b.name}</td>
                            <td className="py-3 pr-4">{b.location}</td>
                            <td className="py-3 pr-4">{b.usersCount ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
