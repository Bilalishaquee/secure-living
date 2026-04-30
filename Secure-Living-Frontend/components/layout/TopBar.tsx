"use client";

import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  accounting: "Accounting",
  leasing: "Leasing",
  screening: "Tenant Screening",
  banking: "Landlord Banking",
  "rent-collection": "Rent Collection",
  investments: "Investments",
  maintenance: "Maintenance",
  new: "New property",
  properties: "Properties",
  expenses: "Expenses",
  reports: "Reports",
  "lease-renewals": "Lease Renewals",
  transactions: "Transactions",
  listings: "Listings",
  services: "Services",
  tenants: "Tenants",
  kyc: "KYC",
  settings: "Settings",
  admin: "Admin",
  organizations: "Organizations",
  rbac: "RBAC",
  "audit-logs": "Audit Logs",
};

export function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const href = `/${segments.slice(0, i + 1).join("/")}`;
    const label = labels[seg] ?? seg.replace(/-/g, " ");
    return { href, label };
  });

  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white pt-[var(--safe-top)] relative">
      <div className="relative mx-auto flex min-h-[3.5rem] w-full max-w-[1400px] items-center gap-3 gap-y-2 py-2.5 pl-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))] sm:pl-[max(1.25rem,var(--safe-left))] sm:pr-[max(1.25rem,var(--safe-right))] lg:pl-[max(1.5rem,var(--safe-left))] lg:pr-[max(1.5rem,var(--safe-right))]">
        <div className="min-w-0 flex-1 pl-10 sm:pl-11 lg:pl-0">
          <nav
            className="flex flex-wrap items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs"
            aria-label="Breadcrumb"
          >
            <Link href="/dashboard" className="transition-colors hover:text-slate-700">
              Home
            </Link>
            {crumbs.map((c) => (
              <span key={c.href} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" aria-hidden />
                <Link href={c.href} className="capitalize text-slate-500 transition-colors hover:text-slate-800">
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
          <p className="mt-0.5 text-[15px] font-semibold leading-snug text-slate-900 sm:text-base">
            Welcome back, <span className="font-semibold text-slate-700">{firstName}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Notifications, 3 unread"
            onClick={() => toast("Notifications center (demo — no server feed)", "info")}
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
              3
            </span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                aria-label="Account menu"
              >
                <Avatar name={user?.name ?? "User"} src={user?.avatarUrl} size="md" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  window.location.href = "/auth/login";
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
