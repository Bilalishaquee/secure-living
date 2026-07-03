"use client";

import { Bell, ChevronRight, AlertTriangle, XCircle, Info, CheckCircle2, Search, X, Check } from "lucide-react";
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
  reports: "Financial Reports",
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
  support: "Support",
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
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  href: string;
};

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  critical: <XCircle className="h-4 w-4 shrink-0 text-red-500" />,
  warning:  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />,
  info:     <Info className="h-4 w-4 shrink-0 text-sky-500" />,
};

const SEVERITY_BORDER: Record<string, string> = {
  critical: "border-l-red-400",
  warning:  "border-l-amber-400",
  info:     "border-l-sky-400",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.authToken) return;
    try {
      const res = await fetch("/api/v1/notifications", {
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
      if (res.ok) {
        const json = await res.json() as { data: { unreadCount: number; items: NotifItem[] } };
        setNotifCount(json.data.unreadCount ?? 0);
        setNotifItems(json.data.items ?? []);
      }
    } catch {
      // ignore network errors
    }
  }, [user?.authToken]);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 20_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function handleNotificationClick(n: NotifItem) {
    setPanelOpen(false);
    if (!n.isRead && user?.authToken) {
      setNotifItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
      setNotifCount((c) => Math.max(0, c - 1));
      fetch(`/api/v1/notifications/${n.id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.authToken}` },
      }).catch(() => undefined);
    }
    if (n.link) router.push(n.link);
  }

  async function handleMarkAllRead() {
    if (!user?.authToken) return;
    setNotifItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    setNotifCount(0);
    try {
      await fetch("/api/v1/notifications/mark-all-read", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.authToken}` },
      });
    } catch {
      // ignore — next poll will resync
    }
  }

  // Close panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setPanelOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
    }
    if (panelOpen || searchOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [panelOpen, searchOpen]);

  useEffect(() => {
    if (!user?.authToken || searchText.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/v1/search?q=${encodeURIComponent(searchText.trim())}&limit=8`, {
        headers: { Authorization: `Bearer ${user.authToken}` },
        signal: ctrl.signal,
      })
        .then((res) => (res.ok ? res.json() : { data: [] }))
        .then((json: { data?: SearchResult[] }) => {
          setSearchResults(json.data ?? []);
          setSearchOpen(true);
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setSearchResults([]);
        });
    }, 220);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [searchText, user?.authToken]);

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
          <div className="relative hidden sm:block" ref={searchRef}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
              placeholder="Search records"
              className="h-9 w-48 rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:w-64 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              aria-label="Search dashboard records"
            />
            {searchOpen && searchText.trim().length >= 2 ? (
              <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {searchResults.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-slate-500">No matching records</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto py-1 [scrollbar-width:thin]">
                    {searchResults.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        className="block w-full px-4 py-2.5 text-left hover:bg-slate-50"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchText("");
                          router.push(item.href);
                        }}
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-blue">{item.type}</span>
                        <span className="mt-0.5 block truncate text-sm font-medium text-slate-900">{item.title}</span>
                        {item.subtitle ? <span className="block truncate text-xs text-slate-500">{item.subtitle}</span> : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

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
              <div className="absolute right-0 top-11 z-50 w-96 rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Notifications {notifCount > 0 && <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-700">{notifCount} new</span>}
                  </p>
                  <div className="flex items-center gap-3">
                    {notifCount > 0 && (
                      <button
                        type="button"
                        onClick={() => { void handleMarkAllRead(); }}
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                      >
                        <Check className="h-3 w-3" /> Mark all read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPanelOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto [scrollbar-width:thin] divide-y divide-slate-50">
                  {notifItems.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      <p className="text-sm font-medium text-slate-700">All clear</p>
                      <p className="text-xs text-slate-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifItems.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => { void handleNotificationClick(n); }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 border-l-4 ${SEVERITY_BORDER[n.severity]} ${
                          n.isRead ? "opacity-60" : "bg-slate-50/60"
                        }`}
                      >
                        {SEVERITY_ICON[n.severity]}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-semibold text-slate-900">{n.title}</span>
                            {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug text-slate-600">{n.message}</span>
                          <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>

                {notifItems.length > 0 && (
                  <div className="border-t border-slate-100 px-4 py-2 text-right">
                    <Link
                      href="/notifications"
                      onClick={() => setPanelOpen(false)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View all notifications →
                    </Link>
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
