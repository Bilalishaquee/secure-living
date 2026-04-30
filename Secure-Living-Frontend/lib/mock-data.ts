import type { AuthUser, UserRole } from "@/types/auth";
import { authUserFromSeedEmail } from "@/lib/profile-merge";

/** Demo accounts merged from `profileMockDataset` (profile architecture). */
const seedLoginEmails = [
  "david@secureliving.com",
  "kevin@secureliving.com",
  "sarah@secureliving.com",
  "wanjiku@mwakaba.co.ke",
  "grace@kenyarealtors.co.ke",
  "amina@diasporalink.com",
  "james@secureliving.com",
] as const;

export const mockUsers: AuthUser[] = seedLoginEmails
  .map((email) => authUserFromSeedEmail(email))
  .filter((u): u is AuthUser => u != null);
 
export type OrgType = "Diaspora Client" | "Agency" | "Independent Manager";

export type MockBranch = {
  id: string;
  name: string;
  location: string;
  manager: string;
  usersCount: number;
  users: { name: string; email: string; role: UserRole; status: string }[];
};

export type MockOrganization = {
  id: string;
  name: string;
  type: OrgType;
  branches: MockBranch[];
  usersCount: number;
  status: "Active" | "Suspended";
  country: string;
  email: string;
  phone: string;
};

export const mockOrganizations: MockOrganization[] = [
  {
    id: "org1",
    name: "Mwakaba Properties",
    type: "Independent Manager",
    country: "Kenya",
    email: "ops@mwakabaproperties.co.ke",
    phone: "+254 712 000 111",
    usersCount: 12,
    status: "Active",
    branches: [
      {
        id: "b1",
        name: "Nairobi HQ",
        location: "Westlands, Nairobi",
        manager: "David Mwakaba",
        usersCount: 8,
        users: [
          {
            name: "David Mwakaba",
            email: "david@secureliving.com",
            role: "landlord",
            status: "Active",
          },
          {
            name: "Wanjiku N.",
            email: "wanjiku@mwakaba.co.ke",
            role: "staff",
            status: "Active",
          },
        ],
      },
      {
        id: "b2",
        name: "Coastal Office",
        location: "Nyali, Mombasa",
        manager: "James Otieno",
        usersCount: 4,
        users: [
          {
            name: "James Otieno",
            email: "james@mwakaba.co.ke",
            role: "staff",
            status: "Active",
          },
        ],
      },
    ],
  },
  {
    id: "org2",
    name: "Kenya Realtors Agency",
    type: "Agency",
    country: "Kenya",
    email: "hello@kenyarealtors.co.ke",
    phone: "+254 722 444 889",
    usersCount: 48,
    status: "Active",
    branches: [
      {
        id: "b3",
        name: "Kilimani Branch",
        location: "Kilimani, Nairobi",
        manager: "Grace Muthoni",
        usersCount: 18,
        users: [],
      },
      {
        id: "b4",
        name: "Kisumu Desk",
        location: "Milimani, Kisumu",
        manager: "Peter Ochieng",
        usersCount: 12,
        users: [],
      },
      {
        id: "b5",
        name: "Eldoret Hub",
        location: "Eldoret CBD",
        manager: "Faith Chebet",
        usersCount: 18,
        users: [],
      },
    ],
  },
  {
    id: "org3",
    name: "Diaspora Link Ltd",
    type: "Diaspora Client",
    country: "United Kingdom / Kenya",
    email: "care@diasporalink.com",
    phone: "+44 20 7946 0955",
    usersCount: 6,
    status: "Active",
    branches: [
      {
        id: "b6",
        name: "London Coordination",
        location: "Remote — UK",
        manager: "Amina Hassan",
        usersCount: 6,
        users: [],
      },
    ],
  },
];

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: "Auth" | "RBAC" | "Properties" | "Transactions" | "KYC";
  ip: string;
  status: "Success" | "Failed" | "Warning";
  description?: string;
  metadata?: Record<string, string | number | boolean>;
  sessionId?: string;
};

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: "a1",
    timestamp: "2026-04-01T14:32:01",
    user: "David M.",
    action: "Released escrow funds",
    module: "Transactions",
    ip: "41.90.12.88",
    status: "Success",
    description:
      "Released KES 150,000 from escrow wallet to beneficiary account ending 4826 for Redwood Ridge maintenance milestone.",
    metadata: { amount: 150000, propertyId: "p1", milestone: "repairs_phase_2" },
    sessionId: "sess_8f2a9c1d",
  },
  {
    id: "a2",
    timestamp: "2026-04-01T14:28:44",
    user: "Admin",
    action: 'Created role "Field Agent"',
    module: "RBAC",
    ip: "41.90.12.10",
    status: "Success",
    description: "New custom role Field Agent with scoped property view permissions.",
    metadata: { roleId: "role_field_agent" },
    sessionId: "sess_admin_001",
  },
  {
    id: "a3",
    timestamp: "2026-04-01T13:55:12",
    user: "Kevin P.",
    action: "Uploaded KYC document",
    module: "KYC",
    ip: "102.68.45.201",
    status: "Success",
    description: "National ID front upload — pending automated checks.",
    metadata: { docType: "national_id", fileSize: 842000 },
    sessionId: "sess_kp_77",
  },
  {
    id: "a4",
    timestamp: "2026-04-01T13:01:09",
    user: "Sarah K.",
    action: "Failed login attempt",
    module: "Auth",
    ip: "41.90.55.12",
    status: "Failed",
    description: "Invalid password — account locked for 15 minutes after 5 attempts.",
    metadata: { attempts: 5 },
    sessionId: "unknown",
  },
  {
    id: "a5",
    timestamp: "2026-04-01T12:44:22",
    user: "Wanjiku N.",
    action: "Updated property verification",
    module: "Properties",
    ip: "197.248.3.90",
    status: "Success",
    description: "Marked Palm Heights Apartments as under document review.",
    sessionId: "sess_wn_22",
  },
  {
    id: "a6",
    timestamp: "2026-04-01T11:20:00",
    user: "System",
    action: "Escrow top-up reminder sent",
    module: "Transactions",
    ip: "10.0.0.1",
    status: "Warning",
    description: "Wallet balance below recommended threshold for Sunset View Estate.",
    metadata: { threshold: 500000, balance: 420000 },
    sessionId: "cron_escrow_01",
  },
  {
    id: "a7",
    timestamp: "2026-03-31T18:05:33",
    user: "Grace Muthoni",
    action: "Approved tenant application",
    module: "Properties",
    ip: "105.29.12.44",
    status: "Success",
    description: "Tenant application for Unit 4B — Karen Family Home approved.",
    sessionId: "sess_gm_901",
  },
  {
    id: "a8",
    timestamp: "2026-03-31T09:12:01",
    user: "James Otieno",
    action: "Exported audit subset",
    module: "RBAC",
    ip: "41.212.8.77",
    status: "Success",
    description: "CSV export of March transactions module events (read-only).",
    sessionId: "sess_jo_exp",
  },
  {
    id: "a9",
    timestamp: "2026-03-30T16:48:19",
    user: "Amina Hassan",
    action: "KYC document rejected",
    module: "KYC",
    ip: "86.12.44.101",
    status: "Warning",
    description: "Proof of address image unreadable — resubmission requested.",
    metadata: { reason: "blur" },
    sessionId: "sess_ah_kyc",
  },
  {
    id: "a10",
    timestamp: "2026-03-30T08:00:00",
    user: "David M.",
    action: "Scheduled rent reminder",
    module: "Properties",
    ip: "41.90.12.88",
    status: "Success",
    description: "Automated SMS rent reminder for Sunset View tenants.",
    sessionId: "sess_dm_cron",
  },
  {
    id: "a11",
    timestamp: "2026-03-29T22:15:40",
    user: "Unknown",
    action: "API key rotation",
    module: "Auth",
    ip: "52.31.10.11",
    status: "Success",
    description: "Partner API key rotated per security policy.",
    sessionId: "api_system",
  },
];

export type MockProperty = {
  id: string;
  name: string;
  address: string;
  monthlyRent: number;
  occupied: number;
  available: number;
  arrears: number;
  verification: "Verified" | "Processing" | "Under Review" | "Critical";
  imageUrl: string;
};

export const mockProperties: MockProperty[] = [
  {
    id: "p1",
    name: "Redwood Ridge Villas",
    address: "Karen, Nairobi",
    monthlyRent: 80000,
    occupied: 2,
    available: 0,
    arrears: 0,
    verification: "Verified",
    imageUrl:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400",
  },
  {
    id: "p2",
    name: "Palm Heights Apartments",
    address: "Runda, Nairobi",
    monthlyRent: 60000,
    occupied: 0,
    available: 1,
    arrears: 0,
    verification: "Processing",
    imageUrl:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
  },
  {
    id: "p3",
    name: "Sunset View Estate",
    address: "Mombasa",
    monthlyRent: 50000,
    occupied: 1,
    available: 0,
    arrears: 1,
    verification: "Critical",
    imageUrl:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400",
  },
];

/** Public marketing / marketplace listings (verified-first story) */
export type MockListing = {
  id: string;
  title: string;
  location: string;
  priceKes: number;
  listingType: "Sale" | "Rent";
  beds: number;
  baths: number;
  sqm: number;
  imageUrl: string;
  featured: boolean;
  verifiedListing: boolean;
  agentVerified: boolean;
  secureTransaction: boolean;
  agentName: string;
  summary: string;
};

export const mockListings: MockListing[] = [
  {
    id: "l1",
    title: "Karen Garden Townhouse",
    location: "Karen, Nairobi",
    priceKes: 48500000,
    listingType: "Sale",
    beds: 4,
    baths: 3,
    sqm: 280,
    imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
    featured: true,
    verifiedListing: true,
    agentVerified: true,
    secureTransaction: true,
    agentName: "Wanjiku M. · PrimeNest",
    summary: "Gated community, borehole, solar-ready roof.",
  },
  {
    id: "l2",
    title: "Kilimani Skyline Apartment",
    location: "Kilimani, Nairobi",
    priceKes: 95000,
    listingType: "Rent",
    beds: 2,
    baths: 2,
    sqm: 96,
    imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
    featured: true,
    verifiedListing: true,
    agentVerified: true,
    secureTransaction: true,
    agentName: "David O. · UrbanKeys",
    summary: "High floor, backup generator, fiber-ready.",
  },
  {
    id: "l3",
    title: "Nyali Oceanview Duplex",
    location: "Nyali, Mombasa",
    priceKes: 62000000,
    listingType: "Sale",
    beds: 5,
    baths: 4,
    sqm: 340,
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    featured: true,
    verifiedListing: true,
    agentVerified: true,
    secureTransaction: true,
    agentName: "Amina H. · Coastline Realty",
    summary: "Walk to beach, staff quarters, verified title path.",
  },
  {
    id: "l4",
    title: "Runda Family Villa",
    location: "Runda, Nairobi",
    priceKes: 132000000,
    listingType: "Sale",
    beds: 6,
    baths: 5,
    sqm: 520,
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    featured: false,
    verifiedListing: true,
    agentVerified: true,
    secureTransaction: true,
    agentName: "Peter K. · Runda Estates",
    summary: "Half-acre, pool, full backup power.",
  },
  {
    id: "l5",
    title: "Westlands Executive Flat",
    location: "Westlands, Nairobi",
    priceKes: 120000,
    listingType: "Rent",
    beds: 3,
    baths: 2,
    sqm: 118,
    imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    featured: false,
    verifiedListing: true,
    agentVerified: true,
    secureTransaction: true,
    agentName: "Lucy N. · MetroLet",
    summary: "Near Sarit, parking, 24h security.",
  },
  {
    id: "l6",
    title: "Thika Road Garden Home",
    location: "Ruiru, Kiambu",
    priceKes: 28500000,
    listingType: "Sale",
    beds: 3,
    baths: 2,
    sqm: 195,
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    featured: false,
    verifiedListing: true,
    agentVerified: true,
    secureTransaction: true,
    agentName: "Brian T. · Kiambu Homes",
    summary: "Corner plot, water storage, title verified.",
  },
  {
    id: "l7",
    title: "Lavington Loft Studio",
    location: "Lavington, Nairobi",
    priceKes: 55000,
    listingType: "Rent",
    beds: 1,
    baths: 1,
    sqm: 48,
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    featured: false,
    verifiedListing: true,
    agentVerified: true,
    secureTransaction: true,
    agentName: "Irene W. · Loft & Co",
    summary: "Ideal for professionals, inclusive service charge.",
  },
  {
    id: "l8",
    title: "Naivasha Lakeside Cottage",
    location: "Naivasha",
    priceKes: 19500000,
    listingType: "Sale",
    beds: 3,
    baths: 2,
    sqm: 165,
    imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    featured: false,
    verifiedListing: true,
    agentVerified: true,
    secureTransaction: true,
    agentName: "Eric M. · Great Rift Realty",
    summary: "Lake views, holiday letting potential.",
  },
];

export function getMockListingById(id: string): MockListing | undefined {
  return mockListings.find((l) => l.id === id);
}

export const rbacModules = [
  "Properties",
  "Tenants",
  "Transactions",
  "KYC Documents",
  "Audit Logs",
  "Staff",
  "Reports",
] as const;

export type RbacModule = (typeof rbacModules)[number];

export const rbacActions = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "release",
] as const;

export type RbacAction = (typeof rbacActions)[number];

/** Initial matrix per role name for demo */
export const initialRbacState: Record<
  string,
  Record<RbacModule, Record<RbacAction, boolean>>
> = {
  Admin: {
    Properties: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      approve: true,
      release: true,
    },
    Tenants: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      approve: true,
      release: true,
    },
    Transactions: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      approve: true,
      release: true,
    },
    "KYC Documents": {
      view: true,
      create: true,
      edit: true,
      delete: true,
      approve: true,
      release: false,
    },
    "Audit Logs": {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Staff: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      approve: false,
      release: false,
    },
    Reports: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      approve: false,
      release: false,
    },
  },
  Landlord: {
    Properties: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      approve: false,
      release: false,
    },
    Tenants: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      approve: true,
      release: false,
    },
    Transactions: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: true,
      release: true,
    },
    "KYC Documents": {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: true,
      release: false,
    },
    "Audit Logs": {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Staff: {
      view: true,
      create: true,
      edit: true,
      delete: true,
      approve: false,
      release: false,
    },
    Reports: {
      view: true,
      create: true,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
  },
  Tenant: {
    Properties: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Tenants: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Transactions: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    "KYC Documents": {
      view: true,
      create: true,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    "Audit Logs": {
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Staff: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Reports: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
  },
  Professional: {
    Properties: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Tenants: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Transactions: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    "KYC Documents": {
      view: true,
      create: true,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    "Audit Logs": {
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Staff: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Reports: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
  },
  Staff: {
    Properties: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      approve: false,
      release: false,
    },
    Tenants: {
      view: true,
      create: true,
      edit: true,
      delete: false,
      approve: false,
      release: false,
    },
    Transactions: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    "KYC Documents": {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    "Audit Logs": {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Staff: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Reports: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
  },
  "Field Agent": {
    Properties: {
      view: true,
      create: false,
      edit: true,
      delete: false,
      approve: false,
      release: false,
    },
    Tenants: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Transactions: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    "KYC Documents": {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    "Audit Logs": {
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Staff: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
    Reports: {
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      release: false,
    },
  },
};

/** Weekly escrow balance trend — dashboard chart */
export const mockEscrowChartData = [
  { w: "W1", v: 820000 },
  { w: "W2", v: 910000 },
  { w: "W3", v: 880000 },
  { w: "W4", v: 950000 },
  { w: "W5", v: 1020000 },
  { w: "W6", v: 1180000 },
  { w: "W7", v: 1250450 },
] as const;

export type MockTenant = {
  id: string;
  name: string;
  property: string;
  propertyId: string;
  rent: number;
  status: "Current" | "Arrears" | "Notice";
  email: string;
  leaseEnd: string;
};

export const mockTenants: MockTenant[] = [
  {
    id: "t1",
    name: "Sarah K.",
    property: "Redwood Ridge Villas — Unit A",
    propertyId: "p1",
    rent: 80000,
    status: "Current",
    email: "sarah.k@email.co.ke",
    leaseEnd: "2027-03-01",
  },
  {
    id: "t2",
    name: "Kevin O.",
    property: "Karen Family Home",
    propertyId: "p1",
    rent: 150000,
    status: "Current",
    email: "kevin.o@email.co.ke",
    leaseEnd: "2026-11-15",
  },
  {
    id: "t3",
    name: "James Otieno",
    property: "Sunset View Estate — Block B",
    propertyId: "p3",
    rent: 50000,
    status: "Arrears",
    email: "j.otieno@email.co.ke",
    leaseEnd: "2026-08-01",
  },
  {
    id: "t4",
    name: "Wanjiku N.",
    property: "Palm Heights Apartments — Unit 2B",
    propertyId: "p2",
    rent: 60000,
    status: "Notice",
    email: "wanjiku.n@email.co.ke",
    leaseEnd: "2026-05-30",
  },
];

export type MockTransaction = {
  id: string;
  date: string;
  desc: string;
  amount: number;
  status: "Success" | "Failed" | "Pending";
};

export const mockTransactions: MockTransaction[] = [
  {
    id: "tx1",
    date: "2026-04-01",
    desc: "Escrow release — Redwood Ridge repairs",
    amount: -150000,
    status: "Success",
  },
  {
    id: "tx2",
    date: "2026-03-31",
    desc: "Rent collection — Sarah K.",
    amount: 80000,
    status: "Success",
  },
  {
    id: "tx3",
    date: "2026-03-30",
    desc: "Rent collection — Kevin O.",
    amount: 150000,
    status: "Success",
  },
  {
    id: "tx4",
    date: "2026-03-28",
    desc: "Failed debit retry — Sunset View",
    amount: 0,
    status: "Failed",
  },
  {
    id: "tx5",
    date: "2026-03-27",
    desc: "Escrow top-up — wallet funding",
    amount: 500000,
    status: "Success",
  },
  {
    id: "tx6",
    date: "2026-03-25",
    desc: "Service fee — March",
    amount: -2500,
    status: "Success",
  },
];

export type MockReminder = {
  id: string;
  icon: string;
  text: string;
  meta: string;
  actionHint?: string;
};

export const mockReminders: MockReminder[] = [
  {
    id: "r1",
    icon: "🛡️",
    text: "Approve repairs estimate – Redwood Ridge",
    meta: "Due tomorrow, 2:00 PM",
    actionHint: "Opens approval queue (demo)",
  },
  {
    id: "r2",
    icon: "🔵",
    text: "1 Unit available at Palm Heights Apartments",
    meta: "Listed this morning",
    actionHint: "View listing",
  },
  {
    id: "r3",
    icon: "🔴",
    text: "2 tenants in arrears – Sunset View Estate",
    meta: "Follow up today",
    actionHint: "Message tenants",
  },
];

export type MockActivity = {
  id: string;
  avatar: string;
  message: string;
  time: string;
};

export const mockRecentActivity: MockActivity[] = [
  {
    id: "a1",
    avatar: "Kevin O.",
    message: "Kevin O. paid KES 150,000 for Karen Family Home",
    time: "Just now",
  },
  {
    id: "a2",
    avatar: "16th Ave",
    message: "16th Ave Construction is 60% complete — PaceSANG Pending",
    time: "1 hour ago",
  },
  {
    id: "a3",
    avatar: "System",
    message: "Rent payment for Smith Lane Apt. is 3 days overdue",
    time: "2 hours ago",
  },
];

export const mockDocuments = [
  { id: "d1", name: "Smart Housing Laws Guide" },
  { id: "d2", name: "Home Repair Checklist" },
  { id: "d3", name: "Escrow Release Policy (2026)" },
] as const;

/** Dashboard demo content varies by primary persona (staff/professional use landlord-shaped data). */
export type DashboardTrend = "up" | "down" | "neutral";

export type DashboardMock = {
  intro: { subtitle: string; title: string; updated: string };
  kpis: {
    escrow: { amount: number; label: string; showRelease: boolean };
    rent: {
      total: number;
      collected: number;
      label: string;
      trend: DashboardTrend;
      trendLabel: string;
    };
    occupancy: {
      value: string;
      sublabel: string;
      trend: DashboardTrend;
      trendLabel: string;
    };
    arrears: {
      amount: number;
      sublabel: string;
      trend: DashboardTrend;
      trendLabel: string;
    };
  };
  escrowPanel: { amount: number; accountSuffix: string };
  chartData: { w: string; v: number }[];
  occupancyKpiLabel: string;
  arrearsKpiLabel: string;
  propertiesSectionTitle: string;
  properties: MockProperty[];
  reminders: MockReminder[];
  documents: { id: string; name: string }[];
  recentActivity: MockActivity[];
};

const landlordDashboardMock: DashboardMock = {
  intro: {
    subtitle: "Snapshot of your properties, escrow, and portfolio health.",
    title: "Portfolio overview",
    updated: "Updated 2 mins ago",
  },
  kpis: {
    escrow: { amount: 1_250_450, label: "Escrow Wallet", showRelease: true },
    rent: {
      total: 450_000,
      collected: 300_000,
      label: "Monthly Rent",
      trend: "up",
      trendLabel: "On track",
    },
    occupancy: {
      value: "92%",
      sublabel: "+1% this month",
      trend: "up",
      trendLabel: "▲4%",
    },
    arrears: {
      amount: 17_000,
      sublabel: "2 Overdue Payments",
      trend: "down",
      trendLabel: "Review",
    },
  },
  escrowPanel: { amount: 1_250_450, accountSuffix: "4826" },
  chartData: [
    { w: "W1", v: 820_000 },
    { w: "W2", v: 910_000 },
    { w: "W3", v: 880_000 },
    { w: "W4", v: 950_000 },
    { w: "W5", v: 1_020_000 },
    { w: "W6", v: 1_180_000 },
    { w: "W7", v: 1_250_450 },
  ],
  occupancyKpiLabel: "Occupancy",
  arrearsKpiLabel: "In Arrears",
  propertiesSectionTitle: "Active Properties",
  properties: mockProperties,
  reminders: mockReminders,
  documents: [...mockDocuments],
  recentActivity: mockRecentActivity,
};

const adminDashboardMock: DashboardMock = {
  intro: {
    subtitle: "Network-wide escrow, onboarding risk, and rent velocity across all organizations.",
    title: "Platform operations",
    updated: "Synced from live aggregates · 30s ago",
  },
  kpis: {
    escrow: { amount: 48_920_000, label: "Escrow under custody", showRelease: false },
    rent: {
      total: 18_400_000,
      collected: 12_750_000,
      label: "Rent in flight (30d)",
      trend: "up",
      trendLabel: "+6% vs last month",
    },
    occupancy: {
      value: "94%",
      sublabel: "Weighted across 127 portfolios",
      trend: "up",
      trendLabel: "▲2.1%",
    },
    arrears: {
      amount: 2_140_000,
      sublabel: "41 accounts past grace",
      trend: "down",
      trendLabel: "Escalate",
    },
  },
  escrowPanel: { amount: 48_920_000, accountSuffix: "9011" },
  chartData: [
    { w: "W1", v: 38_200_000 },
    { w: "W2", v: 40_100_000 },
    { w: "W3", v: 39_400_000 },
    { w: "W4", v: 42_800_000 },
    { w: "W5", v: 44_900_000 },
    { w: "W6", v: 47_200_000 },
    { w: "W7", v: 48_920_000 },
  ],
  occupancyKpiLabel: "Network occupancy",
  arrearsKpiLabel: "Risk & arrears",
  propertiesSectionTitle: "Largest managed portfolios",
  properties: [
    {
      id: "adm-p1",
      name: "Kenya Realtors Agency",
      address: "3 branches · Kilimani hub",
      monthlyRent: 2_400_000,
      occupied: 42,
      available: 5,
      arrears: 3,
      verification: "Verified",
      imageUrl:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
    },
    {
      id: "adm-p2",
      name: "Diaspora Link Ltd",
      address: "UK coordination · remote-first",
      monthlyRent: 890_000,
      occupied: 11,
      available: 2,
      arrears: 0,
      verification: "Under Review",
      imageUrl:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
    },
    {
      id: "adm-p3",
      name: "Mwakaba Properties",
      address: "Nairobi HQ + Coastal office",
      monthlyRent: 1_120_000,
      occupied: 18,
      available: 1,
      arrears: 2,
      verification: "Processing",
      imageUrl:
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400",
    },
  ],
  reminders: [
    {
      id: "ar1",
      icon: "🛡️",
      text: "RBAC: review new “Field Agent” permissions",
      meta: "Policy queue · due today",
      actionHint: "Open RBAC (demo)",
    },
    {
      id: "ar2",
      icon: "📋",
      text: "12 KYC submissions awaiting level-2 check",
      meta: "Oldest 4d in queue",
      actionHint: "Open KYC (demo)",
    },
    {
      id: "ar3",
      icon: "🔔",
      text: "Audit export for Q1 compliance requested",
      meta: "Finance · EOD tomorrow",
      actionHint: "Audit logs (demo)",
    },
  ],
  documents: [
    { id: "ad1", name: "Platform SLA & uptime report (Mar)" },
    { id: "ad2", name: "Cross-org escrow reconciliation sheet" },
    { id: "ad3", name: "Incident response playbook v3" },
  ],
  recentActivity: [
    {
      id: "aa1",
      avatar: "System",
      message: "API rate limits raised for partner org Kenya Realtors",
      time: "6 min ago",
    },
    {
      id: "aa2",
      avatar: "Kevin P.",
      message: "Kevin P. approved 2 new branch manager seats",
      time: "42 min ago",
    },
    {
      id: "aa3",
      avatar: "Compliance",
      message: "Weekly sanctions screening completed — 0 hits",
      time: "3 hr ago",
    },
  ],
};

const tenantDashboardMock: DashboardMock = {
  intro: {
    subtitle: "Your lease, upcoming rent, and protected deposits in one place.",
    title: "My home",
    updated: "Last payment reflected · 1 hr ago",
  },
  kpis: {
    escrow: { amount: 80_000, label: "Rent held in escrow", showRelease: false },
    rent: {
      total: 80_000,
      collected: 80_000,
      label: "April rent",
      trend: "up",
      trendLabel: "Cleared",
    },
    occupancy: {
      value: "Mar 2027",
      sublabel: "Lease end date",
      trend: "neutral",
      trendLabel: "On lease",
    },
    arrears: {
      amount: 0,
      sublabel: "No balance due",
      trend: "up",
      trendLabel: "All good",
    },
  },
  escrowPanel: { amount: 80_000, accountSuffix: "7712" },
  chartData: [
    { w: "W1", v: 72_000 },
    { w: "W2", v: 74_500 },
    { w: "W3", v: 76_000 },
    { w: "W4", v: 78_000 },
    { w: "W5", v: 79_000 },
    { w: "W6", v: 79_500 },
    { w: "W7", v: 80_000 },
  ],
  occupancyKpiLabel: "Lease",
  arrearsKpiLabel: "Account status",
  propertiesSectionTitle: "Your tenancy",
  properties: [
    {
      id: "p1",
      name: "Redwood Ridge Villas — Unit A",
      address: "Karen, Nairobi · 2 bed",
      monthlyRent: 80_000,
      occupied: 1,
      available: 0,
      arrears: 0,
      verification: "Verified",
      imageUrl:
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400",
    },
  ],
  reminders: [
    {
      id: "tr1",
      icon: "📅",
      text: "Next rent debit · 5 April",
      meta: "Autopay from escrow wallet",
      actionHint: "View schedule (demo)",
    },
    {
      id: "tr2",
      icon: "🔧",
      text: "Maintenance: plumber visit scheduled",
      meta: "Tue 10:00 AM",
      actionHint: "Reschedule (demo)",
    },
    {
      id: "tr3",
      icon: "✅",
      text: "KYC refresh optional until Jun 2026",
      meta: "No action required",
      actionHint: "Open KYC (demo)",
    },
  ],
  documents: [
    { id: "td1", name: "Signed lease — Redwood Ridge Unit A" },
    { id: "td2", name: "Tenant welcome & house rules" },
    { id: "td3", name: "March rent receipt (PDF)" },
  ],
  recentActivity: [
    {
      id: "ta1",
      avatar: "Escrow",
      message: "March rent of KES 80,000 cleared from your wallet",
      time: "Yesterday",
    },
    {
      id: "ta2",
      avatar: "David M.",
      message: "David M. acknowledged your maintenance request",
      time: "2 days ago",
    },
    {
      id: "ta3",
      avatar: "System",
      message: "Smoke detector inspection reminder — completed",
      time: "1 week ago",
    },
  ],
};

const dashboardMocksByPersona = {
  landlord: landlordDashboardMock,
  admin: adminDashboardMock,
  tenant: tenantDashboardMock,
} as const;

export type DashboardPersona = keyof typeof dashboardMocksByPersona;

export function dashboardPersonaForRole(role: UserRole): DashboardPersona {
  if (role === "admin" || role === "super_admin" || role === "supervisor") {
    return "admin";
  }
  if (role === "tenant") return "tenant";
  return "landlord";
}

export function getDashboardMock(role: UserRole): DashboardMock {
  return dashboardMocksByPersona[dashboardPersonaForRole(role)];
}

export type MockServiceOffering = {
  id: string;
  title: string;
  description: string;
  tone: "blue" | "teal" | "gold";
  actionLabel: string;
  toastMessage: string;
  variant: "default" | "secondary" | "outline";
};

export const mockServiceOfferings: MockServiceOffering[] = [
  {
    id: "svc1",
    title: "Portfolio desk",
    description:
      "Speak with a Secure Living analyst about escrow rules and compliance in Kenya.",
    tone: "blue",
    actionLabel: "Schedule call",
    toastMessage:
      "Request received — we’ll email you available slots within 24h (demo).",
    variant: "secondary",
  },
  {
    id: "svc2",
    title: "Field services",
    description:
      "Request vetted contractors for inspections, repairs, and handover checklists.",
    tone: "teal",
    actionLabel: "Create work order",
    toastMessage: "Work order #WO-2026-041 queued for dispatch (demo).",
    variant: "default",
  },
  {
    id: "svc3",
    title: "Diaspora hours",
    description:
      "Evening slots aligned to UK / US time zones for diaspora owners.",
    tone: "gold",
    actionLabel: "View slots",
    toastMessage: "Tue & Thu 18:00–21:00 EAT — added to your calendar (demo).",
    variant: "outline",
  },
];
