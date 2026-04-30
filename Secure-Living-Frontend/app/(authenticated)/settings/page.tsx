"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, KeyRound, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { AuthUser, UserRole } from "@/types/auth";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Avatar } from "@/components/ui/Avatar";

const inputClass =
  "mt-1 w-full rounded-xl border border-[var(--surface-border)] bg-[var(--surface-white)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40";

const labelClass = "text-sm font-medium text-brand-navy";

type ProfileForm = {
  name: string;
  avatarUrl: string;
  phone: string;
  whatsappNumber: string;
  city: string;
  country: string;
  timezone: string;
  preferredCurrency: string;
  preferredLanguage: string;
  companyOrPortfolioName: string;
  taxPin: string;
  mailingAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bio: string;
  dateOfBirth: string;
  nationalIdLast4: string;
};

const emptyForm: ProfileForm = {
  name: "",
  avatarUrl: "",
  phone: "",
  whatsappNumber: "",
  city: "",
  country: "",
  timezone: "",
  preferredCurrency: "",
  preferredLanguage: "",
  companyOrPortfolioName: "",
  taxPin: "",
  mailingAddress: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  bio: "",
  dateOfBirth: "",
  nationalIdLast4: "",
};

function helpPathForRole(role: UserRole | undefined): string {
  switch (role) {
    case "tenant":
      return "/help/tenant";
    case "professional":
    case "service_provider":
      return "/help/professional";
    case "staff":
    case "supervisor":
      return "/help/staff";
    case "admin":
    case "super_admin":
      return "/help/admin";
    case "buyer":
    case "seller":
      return "/help/landlord";
    case "external_client":
      return "/help/tenant";
    default:
      return "/help/landlord";
  }
}

function userToForm(u: AuthUser): ProfileForm {
  return {
    name: u.name ?? "",
    avatarUrl: u.avatarUrl ?? "",
    phone: u.phone ?? "",
    whatsappNumber: u.whatsappNumber ?? "",
    city: u.city ?? "",
    country: u.country ?? "",
    timezone: u.timezone ?? "",
    preferredCurrency: u.preferredCurrency ?? "",
    preferredLanguage: u.preferredLanguage ?? "",
    companyOrPortfolioName: u.companyOrPortfolioName ?? "",
    taxPin: u.taxPin ?? "",
    mailingAddress: u.mailingAddress ?? "",
    emergencyContactName: u.emergencyContactName ?? "",
    emergencyContactPhone: u.emergencyContactPhone ?? "",
    bio: u.bio ?? "",
    dateOfBirth: u.dateOfBirth ?? "",
    nationalIdLast4: u.nationalIdLast4 ?? "",
  };
}

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const roleManualHref = useMemo(() => helpPathForRole(user?.role), [user?.role]);
  const [emailRent, setEmailRent] = useState(true);
  const [emailEscrow, setEmailEscrow] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [digest, setDigest] = useState(true);
  const avatarPresets = [
    "/images/property/dashboard-house.jpg",
    "/images/property/properties-banner.jpg",
    "/images/property/tenants-banner.jpg",
    "/images/property/transactions-banner.jpg",
    "/images/property/auth-estate.jpg",
  ] as const;

  useEffect(() => {
    if (user) setForm(userToForm(user));
  }, [user]);

  const set =
    (key: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const saveProfile = () => {
    if (!user) return;
    if (!form.name.trim()) {
      toast("Display name is required", "error");
      return;
    }
    updateProfile({
      name: form.name.trim(),
      avatarUrl: form.avatarUrl.trim() || undefined,
      phone: form.phone.trim() || undefined,
      whatsappNumber: form.whatsappNumber.trim() || undefined,
      city: form.city.trim() || undefined,
      country: form.country.trim() || undefined,
      timezone: form.timezone.trim() || undefined,
      preferredCurrency: form.preferredCurrency.trim() || undefined,
      preferredLanguage: form.preferredLanguage.trim() || undefined,
      companyOrPortfolioName: form.companyOrPortfolioName.trim() || undefined,
      taxPin: form.taxPin.trim() || undefined,
      mailingAddress: form.mailingAddress.trim() || undefined,
      emergencyContactName: form.emergencyContactName.trim() || undefined,
      emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
      bio: form.bio.trim() || undefined,
      dateOfBirth: form.dateOfBirth.trim() || undefined,
      nationalIdLast4: form.nationalIdLast4.replace(/\D/g, "").slice(0, 4) || undefined,
    });
    toast("Profile saved", "success");
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Settings</h1>
          <p className="app-page-lead">
            Profile, notifications, and security settings for your active account.{" "}
            <Link href="/help" className="font-semibold text-brand-blue hover:underline">
              Role manuals →
            </Link>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 rounded-xl border border-[var(--surface-border)] bg-surface-gray/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Profile image
              </p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar name={form.name || user?.name || "User"} src={form.avatarUrl} size="lg" />
                <div className="min-w-0 flex-1">
                  <label className={labelClass} htmlFor="sl-avatar">
                    Image URL
                  </label>
                  <input
                    id="sl-avatar"
                    className={inputClass}
                    value={form.avatarUrl}
                    onChange={set("avatarUrl")}
                    placeholder="https://.../profile.jpg"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {avatarPresets.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, avatarUrl: p }))}
                        className="rounded-lg border border-[var(--surface-border)] bg-white px-2 py-1 text-xs text-brand-blue hover:bg-sky-50"
                      >
                        Use preset
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, avatarUrl: "" }))}
                      className="rounded-lg border border-[var(--surface-border)] bg-white px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-slate-50"
                    >
                      Remove image
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="sl-name">
                Display name
              </label>
              <input
                id="sl-name"
                className={inputClass}
                value={form.name}
                onChange={set("name")}
                autoComplete="name"
              />
            </div>
            <div className="rounded-xl border border-[var(--surface-border)] bg-surface-gray/30 p-4 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Email
              </p>
              <p className="mt-1 font-mono-data text-sm font-medium">{user?.email}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Email change would be verified in production.
              </p>
            </div>
            <div>
              <label className={labelClass} htmlFor="sl-phone">
                Phone
              </label>
              <input
                id="sl-phone"
                className={inputClass}
                value={form.phone}
                onChange={set("phone")}
                autoComplete="tel"
                placeholder="+254 …"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="sl-wa">
                WhatsApp
              </label>
              <input
                id="sl-wa"
                className={inputClass}
                value={form.whatsappNumber}
                onChange={set("whatsappNumber")}
                placeholder="Same as phone or dedicated"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="sl-city">
                City
              </label>
              <input id="sl-city" className={inputClass} value={form.city} onChange={set("city")} />
            </div>
            <div>
              <label className={labelClass} htmlFor="sl-country">
                Country
              </label>
              <input
                id="sl-country"
                className={inputClass}
                value={form.country}
                onChange={set("country")}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="sl-tz">
                Timezone
              </label>
              <input
                id="sl-tz"
                className={inputClass}
                value={form.timezone}
                onChange={set("timezone")}
                placeholder="e.g. Africa/Nairobi"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="sl-currency">
                Preferred currency
              </label>
              <input
                id="sl-currency"
                className={inputClass}
                value={form.preferredCurrency}
                onChange={set("preferredCurrency")}
                placeholder="KES, USD, …"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="sl-lang">
                Preferred language
              </label>
              <input
                id="sl-lang"
                className={inputClass}
                value={form.preferredLanguage}
                onChange={set("preferredLanguage")}
                placeholder="English, Kiswahili, …"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="sl-company">
                Company / portfolio name
              </label>
              <input
                id="sl-company"
                className={inputClass}
                value={form.companyOrPortfolioName}
                onChange={set("companyOrPortfolioName")}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="sl-pin">
                Tax PIN / ID reference
              </label>
              <input
                id="sl-pin"
                className={inputClass}
                value={form.taxPin}
                onChange={set("taxPin")}
                placeholder="Store masked in production"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="sl-mail">
                Mailing address
              </label>
              <textarea
                id="sl-mail"
                className={`${inputClass} min-h-[88px] resize-y`}
                value={form.mailingAddress}
                onChange={set("mailingAddress")}
                rows={3}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="sl-dob">
                Date of birth
              </label>
              <input
                id="sl-dob"
                type="date"
                className={inputClass}
                value={form.dateOfBirth}
                onChange={set("dateOfBirth")}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="sl-nid">
                National ID (last 4 digits)
              </label>
              <input
                id="sl-nid"
                className={inputClass}
                inputMode="numeric"
                maxLength={4}
                value={form.nationalIdLast4}
                onChange={set("nationalIdLast4")}
                placeholder="••••"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="sl-em-name">
                Emergency contact name
              </label>
              <input
                id="sl-em-name"
                className={inputClass}
                value={form.emergencyContactName}
                onChange={set("emergencyContactName")}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="sl-em-phone">
                Emergency contact phone
              </label>
              <input
                id="sl-em-phone"
                className={inputClass}
                value={form.emergencyContactPhone}
                onChange={set("emergencyContactPhone")}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="sl-bio">
                Short bio / notes
              </label>
              <textarea
                id="sl-bio"
                className={`${inputClass} min-h-[100px] resize-y`}
                value={form.bio}
                onChange={set("bio")}
                rows={4}
                placeholder="Visible to admins / matching in future releases."
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--surface-border)] pt-4">
            <Badge className="capitalize">{user?.role}</Badge>
            <span className="text-xs text-[var(--text-muted)]">Role is set at registration.</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={saveProfile}>
              Save profile
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/kyc">KYC documents</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={roleManualHref} className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" aria-hidden />
                Manual for my role
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-blue" aria-hidden />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Switch
            label="Rent & collection emails"
            description="Payment confirmations and failed debit alerts"
            checked={emailRent}
            onCheckedChange={(v) => {
              setEmailRent(v);
              toast(v ? "Rent emails on" : "Rent emails off", "success");
            }}
          />
          <Switch
            label="Escrow release alerts"
            description="When funds move in or out of your wallet"
            checked={emailEscrow}
            onCheckedChange={(v) => {
              setEmailEscrow(v);
              toast(v ? "Escrow alerts on" : "Escrow alerts off", "success");
            }}
          />
          <Switch
            label="SMS for urgent items"
            description="Arrears and verification deadlines"
            checked={smsAlerts}
            onCheckedChange={(v) => {
              setSmsAlerts(v);
              toast(v ? "SMS alerts enabled" : "SMS alerts disabled", "info");
            }}
          />
          <Switch
            label="Weekly digest"
            description="Friday summary of portfolio health"
            checked={digest}
            onCheckedChange={(v) => {
              setDigest(v);
              toast(v ? "Digest subscribed" : "Digest unsubscribed", "info");
            }}
          />
          <Button
            type="button"
            className="mt-2 w-full"
            onClick={() => toast("Notification preferences saved", "success")}
          >
            Save preferences
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-brand-teal" aria-hidden />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Password changes and 2FA enrollment would live here in production.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => toast("Password reset email sent", "success")}
            >
              Change password
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => toast("Authenticator setup — scan QR in production", "info")}
            >
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
