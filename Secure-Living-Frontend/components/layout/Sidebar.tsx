"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BarChart2,
  Banknote,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSearch,
  CalendarClock,
  Landmark,
  LayoutDashboard,
  LineChart,
  Menu,
  ReceiptText,
  Receipt,
  Settings,
  Shield,
  ShieldCheck,
  ShieldBan,
  Upload,
  Users,
  X,
  Wrench,
  Briefcase,
  FileText,
  UserPlus,
  ToggleLeft,
  LifeBuoy,
  FileInput,
  Home,
  AlertTriangle,
  Tags,
  Ticket,
  Globe,
  Layers,
  LogOut,
  ClipboardCheck,
  BedDouble,
  Package,
  Megaphone,
  CalendarDays,
  ConciergeBell,
  HardHat,
  CheckSquare,
  Zap,
  ScanQrCode,
  DoorOpen,
  GitCompare,
  ScrollText,
  BrainCircuit,
  Award,
  Fingerprint,
  Eye,
  Hotel,
  QrCode,
  GanttChartSquare,
  ListChecks,
  NotebookText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, type ComponentType } from "react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useFeatureFlags } from "@/lib/feature-flags";
import type { UserRole } from "@/types/auth";
import { LogoShield } from "@/components/brand/LogoShield";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles?: UserRole[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
  roles?: UserRole[];
};

const landlordGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/crm", label: "CRM", icon: GanttChartSquare },
      { href: "/containers", label: "Portfolio", icon: Layers },
      { href: "/properties", label: "Properties & Units", icon: Building2 },
      { href: "/tenants", label: "Tenants", icon: Users },
      { href: "/rental-application", label: "Rental Application", icon: FileText },
    ],
  },
  {
    label: "Financial",
    items: [
      { href: "/rent-collection", label: "Payments & Escrow", icon: Banknote },
      { href: "/rent-collection/receipts", label: "Rent Receipts", icon: NotebookText },
      { href: "/accounting", label: "Accounting", icon: ReceiptText },
      { href: "/banking", label: "Landlord Banking", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/leasing", label: "Leasing", icon: Landmark },
      { href: "/leasing/templates", label: "Lease Templates", icon: ScrollText },
      { href: "/listings", label: "Listings", icon: Megaphone },
      { href: "/vacating", label: "Move-Out / Vacating", icon: LogOut },
      { href: "/service-requests", label: "Service Requests", icon: ConciergeBell },
      { href: "/service-requests/manager-queue", label: "Manager Queue", icon: ClipboardList },
      { href: "/providers", label: "Providers", icon: HardHat },
      { href: "/unit-readiness", label: "Unit Readiness", icon: CheckSquare },
      { href: "/checklists", label: "Checklists", icon: ClipboardCheck },
      { href: "/short-stay", label: "Short Stay", icon: BedDouble },
      { href: "/short-stay/charges", label: "Nightgrab Charges", icon: Hotel },
      { href: "/screening", label: "Tenant Screening", icon: FileSearch },
      { href: "/intelligence", label: "MoveScore & Intel", icon: BrainCircuit },
      { href: "/screening/rent-score", label: "Rent Score", icon: Award },
      { href: "/services", label: "Services", icon: Wrench },
      { href: "/utilities", label: "Utilities", icon: Zap },
      { href: "/utilities/household-charges", label: "Utility Charges", icon: ListChecks },
      { href: "/expenses", label: "Expenses", icon: Receipt },
      { href: "/lease-renewals", label: "Lease Renewals", icon: CalendarClock },
    ],
  },
  {
    label: "Compliance & Access",
    items: [
      { href: "/compliance", label: "Compliance Numbers", icon: Fingerprint },
      { href: "/compliance/micro-behaviors", label: "MicroBehavior", icon: Eye },
      { href: "/qr/applications", label: "QR Applications", icon: ScanQrCode },
      { href: "/qr/access-logs", label: "QR Access Logs", icon: QrCode },
      { href: "/visitors", label: "Visitors", icon: DoorOpen },
      { href: "/visitors/logs", label: "Visitor Logs", icon: DoorOpen },
    ],
  },
  {
    label: "Organisation",
    items: [
      { href: "/team", label: "Team", icon: UserPlus },
      { href: "/data-import", label: "Data Migration", icon: FileInput },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/investments", label: "Investments", icon: LineChart },
      { href: "/properties/transfers", label: "Property Transfers", icon: GitCompare },
      { href: "/commercial-readiness", label: "Plan & Referrals", icon: Ticket },
      { href: "/reports", label: "Financial Reports", icon: BarChart2 },
      { href: "/kyc", label: "KYC & Verification", icon: Upload },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const superAdminGroups: NavGroup[] = [
  {
    label: "Core Operations",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/dashboard", label: "Super Admin Dashboard", icon: Shield },
      { href: "/crm", label: "CRM", icon: GanttChartSquare },
      { href: "/containers", label: "Portfolio", icon: Layers },
      { href: "/properties", label: "Properties", icon: Building2 },
      { href: "/tenants", label: "Tenants", icon: Users },
      { href: "/rental-application", label: "Rental Application", icon: FileText },
      { href: "/leasing", label: "Leases", icon: Landmark },
      { href: "/leasing/templates", label: "Lease Templates", icon: ScrollText },
      { href: "/listings", label: "Listings", icon: Megaphone },
      { href: "/vacating", label: "Vacating", icon: LogOut },
      { href: "/lease-renewals", label: "Lease Renewals", icon: CalendarClock },
    ],
  },
  {
    label: "Financial System",
    items: [
      { href: "/rent-collection", label: "Payments & Escrow", icon: Banknote },
      { href: "/rent-collection/receipts", label: "Rent Receipts", icon: NotebookText },
      { href: "/accounting", label: "Accounting", icon: ReceiptText },
      { href: "/banking", label: "Wallets & Payouts", icon: BarChart3 },
      { href: "/expenses", label: "Expenses", icon: Receipt },
      { href: "/reports", label: "Financial Reports", icon: BarChart2 },
    ],
  },
  {
    label: "Trust & Compliance",
    items: [
      { href: "/kyc", label: "KYC", icon: Upload },
      { href: "/admin/kyc", label: "KYC Review Queue", icon: ShieldCheck },
      { href: "/screening", label: "Screening", icon: FileSearch },
      { href: "/intelligence", label: "MoveScore & Intel", icon: BrainCircuit },
      { href: "/screening/rent-score", label: "Rent Score", icon: Award },
      { href: "/compliance", label: "Compliance Numbers", icon: Fingerprint },
      { href: "/compliance/micro-behaviors", label: "MicroBehavior", icon: Eye },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
      { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
    ],
  },
  {
    label: "Services & Marketplace",
    items: [
      { href: "/service-requests", label: "Service Requests", icon: ConciergeBell },
      { href: "/service-requests/manager-queue", label: "Manager Queue", icon: ClipboardList },
      { href: "/providers", label: "Providers", icon: HardHat },
      { href: "/unit-readiness", label: "Unit Readiness", icon: CheckSquare },
      { href: "/services", label: "Services", icon: Briefcase },
      { href: "/checklists", label: "Checklists", icon: ClipboardCheck },
      { href: "/short-stay", label: "Short Stay", icon: BedDouble },
      { href: "/short-stay/charges", label: "Nightgrab Charges", icon: Hotel },
      { href: "/investments", label: "Investments", icon: LineChart },
    ],
  },
  {
    label: "Access & Visitors",
    items: [
      { href: "/qr/applications", label: "QR Applications", icon: ScanQrCode },
      { href: "/qr/access-logs", label: "QR Access Logs", icon: QrCode },
      { href: "/visitors", label: "Visitors", icon: DoorOpen },
      { href: "/visitors/logs", label: "Visitor Logs", icon: DoorOpen },
    ],
  },
  {
    label: "Organisation & Users",
    items: [
      { href: "/admin/organizations", label: "Organisations", icon: Globe },
      { href: "/admin/management-inquiries", label: "Management Inquiries", icon: Building2 },
      { href: "/admin/rbac", label: "Roles & Permissions", icon: Shield },
      { href: "/admin/service-categories", label: "Service Categories", icon: Tags },
      { href: "/admin/service-restrictions", label: "Service Restrictions", icon: ShieldBan },
      { href: "/team", label: "Team Invitations", icon: UserPlus },
      { href: "/commercial-readiness", label: "Commercial Readiness", icon: Ticket },
    ],
  },
  {
    label: "System Configuration",
    items: [
      { href: "/data-import", label: "Data Migration", icon: FileInput },
      { href: "/admin/taxonomies", label: "Taxonomies", icon: Tags },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "/admin/support", label: "Support", icon: Ticket },
    ],
  },
];

const adminGroups: NavGroup[] = [
  {
    label: "Core Operations",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/crm", label: "CRM", icon: GanttChartSquare },
      { href: "/properties", label: "Properties", icon: Building2 },
      { href: "/tenants", label: "Tenants", icon: Users },
      { href: "/rental-application", label: "Rental Application", icon: FileText },
      { href: "/leasing", label: "Leases", icon: Landmark },
      { href: "/leasing/templates", label: "Lease Templates", icon: ScrollText },
      { href: "/lease-renewals", label: "Lease Renewals", icon: CalendarClock },
    ],
  },
  {
    label: "Financial System",
    items: [
      { href: "/rent-collection", label: "Payments & Escrow", icon: Banknote },
      { href: "/rent-collection/receipts", label: "Rent Receipts", icon: NotebookText },
      { href: "/accounting", label: "Accounting", icon: ReceiptText },
      { href: "/banking", label: "Wallets & Payouts", icon: BarChart3 },
      { href: "/expenses", label: "Expenses", icon: Receipt },
      { href: "/reports", label: "Financial Reports", icon: BarChart2 },
    ],
  },
  {
    label: "Trust & Compliance",
    items: [
      { href: "/kyc", label: "KYC", icon: Upload },
      { href: "/admin/kyc", label: "KYC Review Queue", icon: ShieldCheck },
      { href: "/screening", label: "Screening", icon: FileSearch },
      { href: "/intelligence", label: "MoveScore & Intel", icon: BrainCircuit },
      { href: "/screening/rent-score", label: "Rent Score", icon: Award },
      { href: "/compliance", label: "Compliance Numbers", icon: Fingerprint },
      { href: "/compliance/micro-behaviors", label: "MicroBehavior", icon: Eye },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
    ],
  },
  {
    label: "Services & Marketplace",
    items: [
      { href: "/service-requests", label: "Service Requests", icon: ConciergeBell },
      { href: "/service-requests/manager-queue", label: "Manager Queue", icon: ClipboardList },
      { href: "/providers", label: "Providers", icon: HardHat },
      { href: "/unit-readiness", label: "Unit Readiness", icon: CheckSquare },
      { href: "/services", label: "Professionals", icon: Briefcase },
      { href: "/short-stay", label: "Short Stay", icon: BedDouble },
      { href: "/short-stay/charges", label: "Nightgrab Charges", icon: Hotel },
      { href: "/investments", label: "Investments", icon: LineChart },
    ],
  },
  {
    label: "Access & Visitors",
    items: [
      { href: "/qr/applications", label: "QR Applications", icon: ScanQrCode },
      { href: "/qr/access-logs", label: "QR Access Logs", icon: QrCode },
      { href: "/visitors", label: "Visitors", icon: DoorOpen },
      { href: "/visitors/logs", label: "Visitor Logs", icon: DoorOpen },
    ],
  },
  {
    label: "Organisation",
    items: [
      { href: "/admin/organizations", label: "Organisations", icon: Globe },
      { href: "/team", label: "Team", icon: UserPlus },
      { href: "/commercial-readiness", label: "Commercial Readiness", icon: Ticket },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/data-import", label: "Data Migration", icon: FileInput },
      { href: "/properties/transfers", label: "Property Transfers", icon: GitCompare },
      { href: "/commercial-readiness", label: "Plan & Referrals", icon: Ticket },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const staffGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/properties", label: "Properties", icon: Building2 },
      { href: "/tenants", label: "Tenants", icon: Users },
      { href: "/visitors", label: "Visitors", icon: DoorOpen },
    ],
  },
  {
    label: "Work",
    items: [
      { href: "/service-requests", label: "Service Requests", icon: ConciergeBell },
      { href: "/service-requests/my-queue", label: "My Job Queue", icon: ClipboardList },
      { href: "/unit-readiness", label: "Unit Readiness", icon: CheckSquare },
      { href: "/leasing", label: "Leases", icon: Landmark },
      { href: "/leasing/templates", label: "Lease Templates", icon: ScrollText },
      { href: "/services", label: "Services", icon: Wrench },
      { href: "/short-stay/charges", label: "Nightgrab Charges", icon: Hotel },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/kyc", label: "KYC", icon: Upload },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const agencyGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/crm", label: "CRM", icon: GanttChartSquare },
      { href: "/containers", label: "Managed Properties", icon: Layers },
      { href: "/properties", label: "Properties & Units", icon: Building2 },
      { href: "/tenants", label: "Tenants", icon: Users },
      { href: "/rental-application", label: "Rental Application", icon: FileText },
    ],
  },
  {
    label: "Financial",
    items: [
      { href: "/rent-collection", label: "Payments & Escrow", icon: Banknote },
      { href: "/rent-collection/receipts", label: "Rent Receipts", icon: NotebookText },
      { href: "/accounting", label: "Accounting", icon: ReceiptText },
      { href: "/banking", label: "Agency Banking", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/leasing", label: "Leasing", icon: Landmark },
      { href: "/leasing/templates", label: "Lease Templates", icon: ScrollText },
      { href: "/listings", label: "Listings", icon: Megaphone },
      { href: "/vacating", label: "Move-Out / Vacating", icon: LogOut },
      { href: "/service-requests", label: "Service Requests", icon: ConciergeBell },
      { href: "/service-requests/manager-queue", label: "Manager Queue", icon: ClipboardList },
      { href: "/providers", label: "Providers", icon: HardHat },
      { href: "/unit-readiness", label: "Unit Readiness", icon: CheckSquare },
      { href: "/checklists", label: "Checklists", icon: ClipboardCheck },
      { href: "/short-stay", label: "Short Stay", icon: BedDouble },
      { href: "/short-stay/charges", label: "Nightgrab Charges", icon: Hotel },
      { href: "/screening", label: "Tenant Screening", icon: FileSearch },
      { href: "/intelligence", label: "MoveScore & Intel", icon: BrainCircuit },
      { href: "/screening/rent-score", label: "Rent Score", icon: Award },
      { href: "/utilities", label: "Utilities", icon: Zap },
      { href: "/utilities/household-charges", label: "Utility Charges", icon: ListChecks },
      { href: "/expenses", label: "Expenses", icon: Receipt },
      { href: "/lease-renewals", label: "Lease Renewals", icon: CalendarClock },
    ],
  },
  {
    label: "Compliance & Access",
    items: [
      { href: "/compliance", label: "Compliance Numbers", icon: Fingerprint },
      { href: "/compliance/micro-behaviors", label: "MicroBehavior", icon: Eye },
      { href: "/qr/applications", label: "QR Applications", icon: ScanQrCode },
      { href: "/qr/access-logs", label: "QR Access Logs", icon: QrCode },
      { href: "/visitors", label: "Visitors", icon: DoorOpen },
      { href: "/visitors/logs", label: "Visitor Logs", icon: DoorOpen },
    ],
  },
  {
    label: "Organisation",
    items: [
      { href: "/team", label: "Agency Team", icon: UserPlus },
      { href: "/data-import", label: "Data Migration", icon: FileInput },
      { href: "/commercial-readiness", label: "Plan & Referrals", icon: Ticket },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/reports", label: "Financial Reports", icon: BarChart2 },
      { href: "/properties/transfers", label: "Property Transfers", icon: GitCompare },
      { href: "/commercial-readiness", label: "Plan & Referrals", icon: Ticket },
      { href: "/kyc", label: "KYC & Verification", icon: Upload },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const agencyManagerGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/crm", label: "CRM", icon: GanttChartSquare },
      { href: "/properties", label: "Managed Properties", icon: Building2 },
      { href: "/tenants", label: "Tenants", icon: Users },
      { href: "/rental-application", label: "Rental Application", icon: FileText },
      { href: "/visitors", label: "Visitors", icon: DoorOpen },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/leasing", label: "Leasing", icon: Landmark },
      { href: "/leasing/templates", label: "Lease Templates", icon: ScrollText },
      { href: "/listings", label: "Listings", icon: Megaphone },
      { href: "/service-requests", label: "Service Requests", icon: ConciergeBell },
      { href: "/service-requests/manager-queue", label: "Manager Queue", icon: ClipboardList },
      { href: "/screening", label: "Tenant Screening", icon: FileSearch },
      { href: "/intelligence", label: "MoveScore & Intel", icon: BrainCircuit },
      { href: "/screening/rent-score", label: "Rent Score", icon: Award },
      { href: "/vacating", label: "Move-Out / Vacating", icon: LogOut },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/kyc", label: "KYC & Docs", icon: Upload },
      { href: "/properties/transfers", label: "Property Transfers", icon: GitCompare },
      { href: "/commercial-readiness", label: "Plan & Referrals", icon: Ticket },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const tenantGroups: NavGroup[] = [
  {
    label: "My Home",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/tenant/lease", label: "My Lease", icon: FileText },
      { href: "/service-requests", label: "Service Requests", icon: ConciergeBell },
      { href: "/tenant/vacate", label: "Move-Out Notice", icon: LogOut },
      { href: "/tenant/checklist", label: "My Checklist", icon: ClipboardCheck },
      { href: "/visitors", label: "Visitors", icon: DoorOpen },
    ],
  },
  {
    label: "Payments",
    items: [
      { href: "/tenant/lease/payments", label: "Payments", icon: Banknote },
      { href: "/rent-collection/receipts", label: "Rent Receipts", icon: NotebookText },
      { href: "/deposit-transfer", label: "Deposit Transfer", icon: Banknote },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/kyc", label: "KYC & Docs", icon: Upload },
      { href: "/crm/applications", label: "CRM Applications", icon: GanttChartSquare },
      { href: "/utilities", label: "Utilities & Disputes", icon: Zap },
      { href: "/tenant/professionals", label: "Professional Profile", icon: Briefcase },
      { href: "/tenant/organization", label: "My Organization", icon: Building2 },
      { href: "/commercial-readiness", label: "Referrals", icon: Ticket },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function getGroups(role: UserRole): NavGroup[] {
  switch (role) {
    case "super_admin":     return superAdminGroups;
    case "admin":           return adminGroups;
    case "staff":           return staffGroups;
    case "tenant":          return tenantGroups;
    case "agency":          return agencyGroups;
    case "agency_manager":  return agencyManagerGroups;
    default:                return landlordGroups;
  }
}

interface SidebarNavProps {
  groups: NavGroup[];
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}

function SidebarNav({ groups, collapsed, pathname, onNavigate }: SidebarNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<number>(0);

  // Save scroll position before pathname changes, restore after
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    el.scrollTop = scrollRef.current;
  }, [pathname]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      ref={navRef}
      onScroll={(e) => { scrollRef.current = (e.currentTarget as HTMLElement).scrollTop; }}
      className="relative z-10 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2 py-2 [scrollbar-width:thin]"
      aria-label="Main"
    >
      {groups.map((group) => (
        <div key={group.label} className="mb-2">
          {!collapsed ? (
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {group.label}
            </p>
          ) : (
            <div className="mb-1.5 mx-auto h-px w-8 bg-slate-200" aria-hidden />
          )}
          {group.items.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" aria-hidden />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

// Nav items masked by an admin feature flag (UPDATE.md: "Allow masking (hiding) of
// features"). Flag defaults to enabled when unset, so nothing hides until an admin
// explicitly deactivates it from /admin/feature-flags.
const NAV_FEATURE_FLAGS: Record<string, string> = {
  "/qr/applications": "qr_access_module",
  "/qr/access-logs": "qr_access_module",
  "/short-stay": "short_stay_module",
  "/short-stay/charges": "short_stay_module",
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = (user?.role ?? "landlord") as UserRole;
  const groups = getGroups(role)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isEnabled(NAV_FEATURE_FLAGS[item.href] ?? item.href, true)),
    }))
    .filter((group) => group.items.length > 0);

  const userBlock = (
    <div
      className={cn(
        "border-t border-slate-200 bg-slate-50/80 p-3",
        collapsed && "flex flex-col items-center"
      )}
    >
      <div className={cn("flex items-center gap-3", collapsed && "flex-col")}>
        <Avatar name={user?.name ?? "User"} src={user?.avatarUrl} size="md" />
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
            <Badge variant="neutral" className="mt-1 capitalize">
              {user?.role}
            </Badge>
          </div>
        ) : null}
      </div>
      {!collapsed ? (
        <Button
          type="button"
          variant="ghost"
          className="mt-3 w-full justify-center text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          onClick={() => {
            logout();
            window.location.href = "/auth/login";
          }}
        >
          Sign out
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-2 text-slate-600 hover:bg-slate-200/60"
          onClick={() => {
            logout();
            window.location.href = "/auth/login";
          }}
          aria-label="Sign out"
        >
          <span className="text-xs font-medium">Out</span>
        </Button>
      )}
    </div>
  );

  return (
    <div className="relative z-30 flex h-full min-h-0 w-0 min-w-0 shrink-0 overflow-visible lg:w-auto">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="fixed z-40 h-10 w-10 rounded-md border border-slate-200 bg-white shadow-sm lg:hidden left-[max(1rem,var(--safe-left))] top-[max(1rem,var(--safe-top))]"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-slate-700" />
      </Button>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute left-0 top-0 flex h-full w-[min(280px,100vw)] flex-col overflow-hidden border-r border-slate-200 bg-white text-slate-900 shadow-xl"
            >
              <div className="relative flex min-h-[3.75rem] shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2.5">
                <Link
                  href="/dashboard"
                  className="flex items-center"
                  onClick={() => setMobileOpen(false)}
                >
                  <LogoShield variant="dark" size="sm" />
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close"
                  className="text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <SidebarNav groups={groups} collapsed={false} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              <div className="relative mt-auto shrink-0">{userBlock}</div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "relative hidden h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white text-slate-900 transition-[width] duration-200 lg:flex",
          collapsed ? "w-[4.25rem]" : "w-[15.5rem]"
        )}
      >
        <div
          className={cn(
            "relative flex min-h-[3.5rem] shrink-0 items-center border-b border-slate-100 px-2 py-2",
            collapsed ? "justify-center" : "justify-between gap-2"
          )}
        >
          {!collapsed ? (
            <Link
              href="/dashboard"
              className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <LogoShield variant="dark" size="sm" />
            </Link>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        <SidebarNav groups={groups} collapsed={collapsed} pathname={pathname} />
        <div className="relative mt-auto shrink-0">{userBlock}</div>
      </aside>
    </div>
  );
}
