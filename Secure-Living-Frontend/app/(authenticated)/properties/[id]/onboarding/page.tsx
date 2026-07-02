"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";

type OnboardingConfig = {
  id: string;
  propertyId: string;
  isShortStayEnabled: boolean;
  visitorApprovalRequired: boolean;
  gateAccessRequired: boolean;
  maintenanceSla: string;
  customOnboardingFields: Record<string, unknown>;
};

export default function PropertyOnboardingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<OnboardingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    void (async () => {
      const res = await fetch(`/api/v1/properties/${id}/onboarding`, {
        headers: { Authorization: `Bearer ${user.authToken ?? ""}` },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: Partial<OnboardingConfig> };
        const d = json.data;
        setConfig({
          id: d.id ?? "",
          propertyId: d.propertyId ?? id,
          isShortStayEnabled: d.isShortStayEnabled ?? false,
          visitorApprovalRequired: d.visitorApprovalRequired ?? true,
          gateAccessRequired: d.gateAccessRequired ?? false,
          maintenanceSla: d.maintenanceSla ?? "48 hours",
          customOnboardingFields: d.customOnboardingFields ?? {},
        });
      } else {
        setConfig({
          id: "",
          propertyId: id,
          isShortStayEnabled: false,
          visitorApprovalRequired: true,
          gateAccessRequired: false,
          maintenanceSla: "48 hours",
          customOnboardingFields: {},
        });
      }
      setLoading(false);
    })();
  }, [user, id]);

  function updateField<K extends keyof OnboardingConfig>(key: K, value: OnboardingConfig[K]) {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  }

  async function handleSave() {
    if (!user || !config) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/properties/${id}/onboarding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.authToken ?? ""}` },
        body: JSON.stringify({
          isShortStayEnabled: config.isShortStayEnabled,
          visitorApprovalRequired: config.visitorApprovalRequired,
          gateAccessRequired: config.gateAccessRequired,
          maintenanceSla: config.maintenanceSla,
          customOnboardingFields: config.customOnboardingFields,
        }),
      });
      if (res.ok) {
        toast("Onboarding settings saved.", "success");
      } else {
        const err = (await res.json()) as { error: string };
        toast(err.error ?? "Failed to save.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-[var(--text-secondary)]">Loading onboarding settings...</div>;
  if (!config) return <div className="p-6 text-sm text-red-600">Failed to load configuration.</div>;

  return (
    <div className="w-full space-y-6">
      <div className="app-page-toolbar">
        <div>
          <h1 className="app-page-title">Property Onboarding</h1>
          <p className="app-page-lead">Configure onboarding settings for property {id}.</p>
        </div>
        <Button onClick={() => { void handleSave(); }} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Onboarding Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Switch
            label="Short Stay Enabled"
            description="Allow Airbnb-style short-term stays"
            checked={config.isShortStayEnabled}
            onCheckedChange={(v) => updateField("isShortStayEnabled", v)}
          />

          <Switch
            label="Visitor Approval Required"
            description="Visitors must be approved before entry"
            checked={config.visitorApprovalRequired}
            onCheckedChange={(v) => updateField("visitorApprovalRequired", v)}
          />

          <Switch
            label="Gate Access Required"
            description="Gate access control enabled for this property"
            checked={config.gateAccessRequired}
            onCheckedChange={(v) => updateField("gateAccessRequired", v)}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Maintenance SLA</label>
            <input
              value={config.maintenanceSla}
              onChange={(e) => updateField("maintenanceSla", e.target.value)}
              placeholder="e.g. 48 hours"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">Custom Onboarding Fields (JSON)</label>
            <textarea
              value={JSON.stringify(config.customOnboardingFields, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value) as Record<string, unknown>;
                  updateField("customOnboardingFields", parsed);
                } catch {
                  // Allow editing invalid JSON
                }
              }}
              rows={8}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue/40 resize-y"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
