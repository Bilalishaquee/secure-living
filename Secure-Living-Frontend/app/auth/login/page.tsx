"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Building2, House, Lock, Mail, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * (typeof i === "number" ? i : 0), duration: 0.35 },
  }),
};

export default function LoginPage() {
  const { login, user, hydrated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  if (hydrated && user) {
    router.replace("/dashboard");
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = await login(email, password);
    if (!ok) {
      setError("Enter a valid email and password.");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-lg"
      >
        <div className="mb-7 text-center">
          <p className="text-sm font-semibold tracking-wide text-brand-blue">Secure Living</p>
          <p className="text-xs text-[var(--text-muted)]">
            Partner portal · owners, tenants &amp; agencies
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-brand-navy">Welcome back</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Sign in to your organization&apos;s workspace — properties, tenants, escrow, and reporting
            in one place.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/92 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.16)] ring-1 ring-brand-blue/10 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent" />
          <div className="pointer-events-none absolute -right-16 -top-12 h-36 w-36 rounded-full bg-brand-blue/10 blur-3xl" />
          <div className="relative mb-4 overflow-hidden rounded-2xl border border-white/80">
            <Image
              src="/images/property/dashboard-house.jpg"
              alt="Managed modern home"
              width={1200}
              height={320}
              className="h-24 w-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f1f38]/65 via-[#0f1f38]/30 to-transparent" />
          </div>
          <div className="mb-4 flex flex-wrap justify-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
              <House className="h-3.5 w-3.5" />
              500+ Homes Managed
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Escrow Protected
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800">
              <Building2 className="h-3.5 w-3.5" />
              Real Estate Operations
            </span>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
          <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(
                  "w-full rounded-xl border border-surface-border bg-surface-white py-3 pl-10 pr-4 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                )}
                placeholder="Enter your email"
              />
            </div>
          </motion.div>
          <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  "w-full rounded-xl border border-surface-border bg-surface-white py-3 pl-10 pr-4 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                )}
                placeholder="Enter your password"
              />
            </div>
          </motion.div>
          <motion.div
            custom={2}
            variants={fieldVariants}
            initial="hidden"
            animate="show"
            className="flex items-center justify-between gap-4 pt-0.5"
          >
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue"
              />
              Remember me
            </label>
            <button
              type="button"
              className="text-sm font-medium text-brand-blue hover:underline"
              onClick={() =>
                toast(
                  "Password reset is not wired yet. Please contact support to reset access.",
                  "info"
                )
              }
            >
              Forgot password?
            </button>
          </motion.div>
          {error ? (
            <p className="text-sm text-brand-red" role="alert">
              {error}
            </p>
          ) : null}
          <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="show">
            <Button type="submit" className="w-full" size="lg">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </form>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-semibold text-brand-blue hover:underline">
              Sign up here
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--text-secondary)]/80">
          Landlord with multiple roles?{" "}
          <Link href="/auth/select-role" className="text-brand-blue hover:underline">
            Switch role
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
