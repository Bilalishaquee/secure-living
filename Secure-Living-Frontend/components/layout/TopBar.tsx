"use client";

import { Bell, ChevronRight, AlertTriangle, XCircle, Info, CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { useCallback, useEffect, useRef, useState } from "react";

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
  organizations: "Organisations",
  rbac: "Roles & Permissions",
  "audit-logs": "Audit Logs",
  disputes: "Disputes",
  support: "Support Tickets",
  taxonomies: "Taxonomies",
  crm: "CRM",
  "custom-fields": "Custom Fields",
  receipts: "Rent Receipts",
  "household-charges": "Household Charges",
  charges: "Nightgrab Charges",
  transfers: "Property Transfers",
  templates: "Lease Templates",
  intelligence: "MoveScore & Intelligence",
  "rent-score": "Rent Score",
  compliance: "Compliance",
  "micro-behaviors": "MicroBehavior",
  qr: "QR & Access",
  applications: "QR Applications",
  "access-logs": "QR Access Logs",
  visitors: "Visitors",
  logs: "Visitor Logs",
  "data-import": "Data Migration",
  onboarding: "Onboarding Config",
  team: "Team",
  vacating: "Vacating",
  "unit-readiness": "Unit Readiness",
  checklists: "Checklists",
  "short-stay": "Short Stay",
  "service-requests": "Service Requests",
  providers: "Providers",
  containers: "Portfolio",
  "service-enquiries": "Service Enquiries",
};

type NotifItem = {
  id: string;
  type: string;
  severity: "high" | "medium" | "low";
  message: string;
  href: string;
};

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  high:   <XCircle className="h-4 w-4 shrink-0 text-red-500" />,
  medium: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />,
  low:    <Info className="h-4 w-4 shrink-0 text-sky-500" />,
};

const SEVERITY_ROW: Record<string, string> = {
  high:   "border-red-100 bg-red-50 text-red-800",
  medium: "border-amber-100 bg-amber-50 text-amber-800",
  low:    "border-sky-100 bg-sky-50 text-sky-800",
};

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const href = `/${segments.slice(0, i + 1).join("/")}`;
    const label = labels[seg] ?? seg.replace(/-/g, " ");
    return { href, label };
  });

  const firstName = user?.name.split(" ")[0] ?? "there";

  // ── notifications ─────────────────────────────────────────────────────────
  const [notifCount, setNotifCount] = useState(0);
  const [notifItems, setNotifItems] = useState<NotifItem[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.authToken) return;
    try {
      const res = await fetch("/api/v1/notifications", {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (res.ok) {
        const json = await res.json() as { data: { count: number; items: NotifItem[] } };
        setNotifCount(json.data.count ?? 0);
        setNotifItems(json.data.items ?? []);
      }
    } catch {
      // ignore network errors
    }
  }, [user?.authToken]);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [panelOpen]);

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
          {/* Notification bell */}
          <div className="relative" ref={panelRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label={`Notifications${notifCount > 0 ? `, ${notifCount} unread` : ""}`}
              onClick={() => setPanelOpen((v) => !v)}
            >
              <Bell className="h-[18px] w-[18px]" />
              {notifCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                  {notifCount > 99 ? "99+" : notifCount}
                </span>
              )}
            </Button>

            {panelOpen && (
              <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Notifications {notifCount > 0 && <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-700">{notifCount}</span>}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto [scrollbar-width:thin] divide-y divide-slate-50">
                  {notifItems.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      <p className="text-sm font-medium text-slate-700">All clear</p>
                      <p className="text-xs text-slate-400">No active alerts right now</p>
                    </div>
                  ) : (
                    notifItems.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setPanelOpen(false);
                          router.push(n.href);
                        }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 border-l-4 ${
                          n.severity === "high" ? "border-l-red-400" : n.severity === "medium" ? "border-l-amber-400" : "border-l-sky-400"
                        }`}
                      >
                        {SEVERITY_ICON[n.severity]}
                        <span className="text-xs leading-snug text-slate-700">{n.message}</span>
                      </button>
                    ))
                  )}
                </div>

                {notifItems.length > 0 && (
                  <div className="border-t border-slate-100 px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => { setPanelOpen(false); router.push("/admin/disputes"); }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View all alerts →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Account dropdown */}
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
