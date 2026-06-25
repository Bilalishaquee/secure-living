"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

export default function NewTenantPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const password = form.password || `Tenant-${new Date().getFullYear()}!`;

  async function submit() {
    if (!user?.organizationId) return;
    if (!form.fullName.trim() || !form.email.trim()) {
      toast("Tenant name and email are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password,
          role: "tenant",
          orgCode: user.organizationId,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { data?: { user?: { id?: string } }; error?: string };
      if (!res.ok) {
        toast(json.error ?? "Unable to create tenant.", "error");
        return;
      }
      const id = json.data?.user?.id ?? null;
      setCreatedId(id);
      toast("Tenant account created.", "success");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/tenants"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to tenants</Link>
          </Button>
          <h1 className="app-page-title">Add Tenant</h1>
          <p className="app-page-lead">Create a tenant account in the current organization.</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-blue" />
            Tenant details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Full name *</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Tenant full name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email *</label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="tenant@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Phone</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+254 ..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Temporary password</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={password}
              />
              <p className="mt-1 text-xs text-slate-500">Leave blank to use the generated temporary password shown above.</p>
            </div>
          </div>

          {createdId ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Tenant created. Tenant User ID: <span className="font-mono">{createdId}</span>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href="/tenants">Cancel</Link>
            </Button>
            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? "Creating..." : "Create tenant"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
