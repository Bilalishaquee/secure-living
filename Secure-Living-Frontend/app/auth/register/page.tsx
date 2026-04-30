"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Building2, Check, House, KeyRound, ShieldCheck, UserCog, Users } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import type { RegisterableRole } from "@/types/auth";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const roles: {
  id: RegisterableRole;
  label: string;
  icon: typeof Users;
  lines: [string, string, string];
}[] = [
  {
    id: "landlord",
    label: "Landlord",
    icon: Building2,
    lines: [
      "List and verify properties across branches.",
      "Control escrow releases and rent schedules.",
      "Invite staff and professionals to your org.",
    ],
  },
  {
    id: "tenant",
    label: "Tenant",
    icon: KeyRound,
    lines: [
      "Pay rent through protected escrow rails.",
      "Upload KYC and track verification status.",
      "Access maintenance and document center.",
    ],
  },
  {
    id: "professional",
    label: "Professional",
    icon: UserCog,
    lines: [
      "Join the verified contractor network.",
      "Get matched to vetted landlords.",
      "Log jobs and milestone completions.",
    ],
  },
  {
    id: "staff",
    label: "Staff",
    icon: Users,
    lines: [
      "Operate within branch permissions.",
      "Support tenants and field workflows.",
      "View assigned properties only.",
    ],
  },
];

export default function RegisterPage() {
  const { registerUser, user, hydrated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<RegisterableRole>("landlord");
  const [orgMode, setOrgMode] = useState<"join" | "create">("create");
  const [orgCode, setOrgCode] = useState("");
  const [orgName, setOrgName] = useState("");
  const [dir, setDir] = useState(1);

  if (hydrated && user) {
    router.replace("/dashboard");
    return null;
  }

  const nextFrom1 = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      toast("Please fill in all required fields", "error");
      return;
    }
    if (!password || password !== confirm) {
      toast("Passwords must match and be non-empty", "error");
      return;
    }
    setStep(2);
  };

  const nextFrom2 = () => setStep(3);

  const finish = async () => {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    const ok = await registerUser({
      id: "",
      name,
      email: email.trim().toLowerCase(),
      role,
      organizationId: "",
      branchId: "",
      permissions: [],
      password,
      phone: phone.trim(),
      whatsappNumber: phone.trim(),
      country: "Kenya",
      timezone: "Africa/Nairobi",
      preferredCurrency: "KES",
      preferredLanguage: "English",
      orgName: orgMode === "create" ? orgName.trim() || undefined : undefined,
      orgCode: orgMode === "join" ? orgCode.trim() || undefined : undefined,
    });
    if (!ok) {
      toast("Registration failed. Please verify details and retry.", "error");
      return;
    }
    router.push("/dashboard");
  };

  const slide = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 40 : -40, opacity: 0 }),
  };

  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-7 text-center">
          <p className="text-sm font-semibold tracking-wide text-brand-blue">Secure Living</p>
          <p className="text-xs text-[var(--text-muted)]">
            Partner portal · owners, tenants &amp; agencies
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-brand-navy">Create your account</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Step {step} of 3 — join your org or register a new one
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/92 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.16)] ring-1 ring-brand-blue/10 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent" />
          <div className="pointer-events-none absolute -right-16 -top-12 h-36 w-36 rounded-full bg-brand-blue/10 blur-3xl" />
          <div className="relative mb-4 overflow-hidden rounded-2xl border border-white/80">
            <Image
              src="/images/property/properties-banner.jpg"
              alt="Residential portfolio onboarding"
              width={1200}
              height={320}
              className="h-24 w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f1f38]/65 via-[#0f1f38]/30 to-transparent" />
          </div>
          <div className="mb-4 flex flex-wrap justify-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
              <House className="h-3.5 w-3.5" />
              Portfolio Visibility
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Escrow Safe Payments
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800">
              <Building2 className="h-3.5 w-3.5" />
              Property Workflow
            </span>
          </div>

          <div className="mb-6 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-brand-blue" : "bg-surface-border"
                )}
                aria-hidden
              />
            ))}
          </div>

          <div className="relative min-h-[450px] overflow-hidden">
            <AnimatePresence custom={dir} mode="wait">
              {step === 1 ? (
                <motion.div
                  key="1"
                  custom={dir}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">First name</label>
                      <input
                        className="w-full rounded-xl border border-surface-border px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Sarah"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Last name</label>
                      <input
                        className="w-full rounded-xl border border-surface-border px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Mwangi"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Email address</label>
                    <input
                      type="email"
                      className="w-full rounded-xl border border-surface-border px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Phone number</label>
                    <input
                      className="w-full rounded-xl border border-surface-border px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254 ..."
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Password</label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-surface-border px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-surface-border px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter password"
                    />
                  </div>
                  <Button
                    type="button"
                    className="mt-1 w-full"
                    onClick={() => {
                      setDir(1);
                      nextFrom1();
                    }}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              ) : null}

              {step === 2 ? (
                <motion.div
                  key="2"
                  custom={dir}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  {roles.map((r) => {
                    const selected = role === r.id;
                    const Icon = r.icon;
                    return (
                      <motion.button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "rounded-2xl border-2 p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue",
                          selected
                            ? "border-brand-blue bg-escrow shadow-card"
                            : "border-surface-border bg-surface-white hover:border-brand-blue/40"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Icon className="h-6 w-6 text-brand-blue" />
                          {selected ? (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue text-white">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 font-semibold text-brand-navy">{r.label}</p>
                        <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
                          {r.lines.map((line) => (
                            <li key={line}>- {line}</li>
                          ))}
                        </ul>
                      </motion.button>
                    );
                  })}
                  <div className="col-span-full flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDir(-1);
                        setStep(1);
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => {
                        setDir(1);
                        nextFrom2();
                      }}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ) : null}

              {step === 3 ? (
                <motion.div
                  key="3"
                  custom={dir}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-[var(--text-secondary)]">
                    Set up your organization access to continue.
                  </p>
                  <div className="flex gap-2 rounded-xl bg-surface-gray p-1">
                    <button
                      type="button"
                      onClick={() => setOrgMode("join")}
                      className={cn(
                        "flex-1 rounded-lg py-2 text-sm font-medium transition",
                        orgMode === "join" ? "bg-white shadow-sm" : "text-[var(--text-secondary)]"
                      )}
                    >
                      Join existing org
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrgMode("create")}
                      className={cn(
                        "flex-1 rounded-lg py-2 text-sm font-medium transition",
                        orgMode === "create" ? "bg-white shadow-sm" : "text-[var(--text-secondary)]"
                      )}
                    >
                      Create organization
                    </button>
                  </div>
                  {orgMode === "join" ? (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Organization code</label>
                      <input
                        className="w-full rounded-xl border border-surface-border px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                        value={orgCode}
                        onChange={(e) => setOrgCode(e.target.value)}
                        placeholder="e.g. MWA-NAI-2026"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Organization name</label>
                      <input
                        className="w-full rounded-xl border border-surface-border px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Mwakaba Properties Ltd"
                      />
                    </div>
                  )}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDir(-1);
                        setStep(2);
                      }}
                    >
                      Back
                    </Button>
                    <Button type="button" className="flex-1" onClick={finish}>
                      Complete registration
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Already registered?{" "}
            <Link href="/auth/login" className="font-semibold text-brand-blue hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
