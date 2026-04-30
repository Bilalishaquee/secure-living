"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Briefcase,
  KeyRound,
  Shield,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/types/auth";
import { cn } from "@/lib/utils";

const fallbackOptions: {
  role: UserRole;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    role: "landlord",
    label: "Landlord",
    description: "Manage escrow, properties, and releases for your portfolio.",
    icon: Building2,
  },
  {
    role: "tenant",
    label: "Tenant",
    description: "Pay rent securely and complete verification in one place.",
    icon: KeyRound,
  },
  {
    role: "professional",
    label: "Professional",
    description: "Join verified jobs and grow your field reputation.",
    icon: UserCog,
  },
  {
    role: "staff",
    label: "Staff",
    description: "Support operations within your assigned branch scope.",
    icon: Users,
  },
  {
    role: "super_admin",
    label: "Super Admin",
    description: "Full platform configuration — orgs, RBAC, and audit.",
    icon: Shield,
  },
];

const roleIcons: Partial<Record<UserRole, LucideIcon>> = {
  landlord: Building2,
  tenant: KeyRound,
  professional: UserCog,
  staff: Users,
  supervisor: Users,
  super_admin: Shield,
  admin: Shield,
  buyer: Briefcase,
  seller: Briefcase,
  service_provider: Building2,
  external_client: Users,
};

export default function SelectRolePage() {
  const { user, hydrated, updateRole } = useAuth();
  const router = useRouter();

  const options = useMemo(() => {
    const ra = user?.roleAssignments;
    if (ra && ra.length >= 1) {
      return ra.map((a) => ({
        role: a.roleSlug,
        label: a.label,
        description: `Org ${a.organizationId} · Branch ${a.branchId}`,
        icon: roleIcons[a.roleSlug] ?? Users,
      }));
    }
    return fallbackOptions;
  }, [user?.roleAssignments]);

  if (hydrated && !user) {
    router.replace("/auth/login");
    return null;
  }

  const select = (role: UserRole) => {
    updateRole(role);
    router.push("/dashboard");
  };

  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="font-display text-3xl font-semibold text-brand-navy">
          Choose how you&apos;ll use Secure Living
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {user?.roleAssignments && user.roleAssignments.length > 1
            ? "Switch active role for this session."
            : user?.roleAssignments && user.roleAssignments.length === 1
              ? "Confirm your active role for this session."
              : "You can adjust this later with your organization administrator."}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {options.map((o, i) => {
            const Icon = o.icon;
            return (
              <motion.button
                key={`${o.role}-${o.label}`}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => select(o.role)}
                className={cn(
                  "rounded-2xl border border-white/90 bg-white/90 p-6 text-left shadow-[0_8px_40px_rgb(var(--rgb-ink)_/_0.08)] ring-1 ring-slate-200/40 backdrop-blur-md transition-all hover:border-brand-blue/40 hover:shadow-[0_20px_56px_rgb(var(--rgb-primary)_/_0.12)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                )}
              >
                <Icon className="h-8 w-8 text-brand-blue" />
                <p className="mt-3 font-display text-lg font-semibold text-brand-navy">
                  {o.label}
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{o.description}</p>
              </motion.button>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm">
          <Link href="/dashboard" className="text-brand-blue hover:underline">
            Skip for now
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
