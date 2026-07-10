# Secure Living — Platform Context: Completed Work

> **Purpose**: Grounding reference for humans and LLMs working on this codebase. Describes what has already been built so future work does not duplicate or contradict existing decisions. Verified against source code, Prisma schema, and git history as of 2026-07-10 (last updated after commits `ef67352` and `d7b3893`).

## 1. Repository Layout

| Path | Role |
|---|---|
| `Secure-Living-Frontend/` | Next.js 14 (App Router) application — actual frontend source |
| `Secure-Living-Backend/` | Next.js 14 API-only app (port 4000) — backend source |
| `secure-living/` | Documentation workspace only (no app source) |

## 2. Tech Stack

- **Frontend**: Next.js 14.2, React 18, TypeScript, Tailwind CSS, Radix UI, Framer Motion/GSAP, Recharts, Zod, `react-qr-code`.
- **Backend**: Next.js 14 (API routes), Prisma ORM 5.22 on **PostgreSQL** via Neon serverless adapter (`@neondatabase/serverless` + `@prisma/adapter-neon`), Vitest for testing. ~110 Prisma models, 34 migrations.
- **Auth**: Custom-built (no NextAuth) — password hashing, bearer/JWT-style tokens, and a full RBAC engine (`Organization → Branch → Role → Permission → UserRoleAssignment`).
- **Payments**: No third-party gateway. A homegrown **wallet/ledger/escrow accounting engine** (`Wallet`, `LedgerEntry`, `Transaction`, `EscrowAccount`, `IdempotencyKey`) underlies all money movement.

## 3. Roles / Portals

Five roles with dedicated dashboards and RBAC-scoped permissions: **Landlord, Tenant, Professional (service provider), Staff, Super Admin**.

## 4. Completed Modules

### 4.1 Property & Leasing
- Properties (CRUD, media, party assignment, ownership transfers)
- Units, unit readiness, commercial readiness
- Listings (public + management)
- Leasing: lease list/detail, **lease templates**, **e-signature workflow (`esign-requests`)**, **Lease Offer & Signing workflow**
- Lease renewals + renewal alerts
- Rental applications
- Tenants (list/create/detail)

**Tenant Portal — My Lease** (reference detail, confirmed shipped):
- *Active Lease view*: status, property, unit, rent, deposit, start/end dates. Actions — View, Download, View Payment Schedule, Request Renewal, Report Issue.
- *Pending Lease Offer view*: status "Awaiting Your Signature". Actions — Review, Download Draft, Ask Questions, Accept & Sign, Decline.
- **Ownership model** (binding constraint for all future work): the property manager authors and controls lease creation, pricing, dates, terms, renewals, and compliance. The tenant only responds (review/sign/decline/request-renewal) — tenants must never get direct edit access to lease terms.

### 4.2 Tenant Lifecycle
- Move-in/move-out checklists (templates + entries)
- Vacating notices, move-out inspections, inspection deductions
- Deposit escrow, deposit refunds, deposit top-up requests, deposit transfer
- Landlord refund scoring

### 4.3 Financial
- Wallets, ledger entries, transactions (with idempotency + reversal)
- Escrow accounts (hold/release/dispute), fund holds
- Rent invoices, rent receipts, rent collection
- Reconciliation engine, monthly rent summaries
- Accounting, banking, expenses UI
- **Phase 4 (planned, not confirmed complete)**: formal double-entry ledger rules — current wallet/ledger/escrow/invoice/receipt primitives already exist and are live; Phase 4 tightens accounting correctness on top of them.

### 4.4 CRM & Screening
- CRM (leads, applications, custom fields) — demo-verified with 5 application statuses (Pending, Reviewing, Shortlisted, Accepted, Rejected)
- Tenant screening, rent score, move score, past rent records

### 4.5 Maintenance & Service Marketplace
- Full **service request state-machine engine**: assign, start, submit, approve, reject, resubmit, complete, cancel, dispute, escalate/resolve, block/unblock, quotes (request/approve/reject), evidence upload
- Provider management, provider audit log & performance tracking
- SLA policies, service categories, service type configs, service access restrictions, service enquiries
- **Done — Services/Marketplace reorganization (client feedback in `UPDATE.md`, implemented in `ef67352`)**:
  - Nav merged into one parent group **"Services & Marketplace"**, split into **"Maintenance Services"** (renamed from "Service Requests" — plumbing, electrical, security, interior, etc.) and **"Professional Services"** (surveying, legal, advisory, valuation, etc.)
  - "Manager Queue"/"My Job Queue" renamed to **"My Requests"**; sub-modules (Providers, My Requests) re-nested under the correct category
  - Live at: `/service-requests` (Maintenance Services), `/services` (Professional Services)
  - `ServiceCategory` model extended with `categoryType` ("MAINTENANCE" | "PROFESSIONAL") and a flexible `config` JSON field (migration `20260710000000_service_category_config`); existing categories backfilled per the Maintenance/Professional split
  - Admin **Service Category configurator** (`/admin/service-categories`) rebuilt into an 11-section Add/Edit form: Basic Info, Delivery Strategy (Internal/Managed/Marketplace + revenue-share), Visibility Rules (per role), Availability Rules (time windows + provider override), Priority/Routing, Approval Rules, Quotation Rules, Payment Rules (escrow/invoice/subscription), Assignment Strategy, SLA/Requirements, Automation Rules (auto-rating, notifications, invoicing). Category list shows a Maintenance/Professional badge + filter.
  - Known scope-limit: "Managed Partner" is currently a free-text field, not yet linked to a real Provider/Organization record.

### 4.6 Utilities
- Utility meters, readings, disputes, household charges, other/service charges

### 4.7 Access Control & Hospitality
- QR applications, QR access logs (functional scannable QR codes with download + public landing page)
- Short-stay bookings, stock/inventory usage
- Visitor management + visitor logs
- Container/storage management

### 4.8 Compliance & Trust
- KYC documents (upload, review workflow, **document viewer**), verification tiers, trusted personnel
- Compliance records, compliance numbers, micro-behavior tracking
- Account freeze, freeze appeals, blacklist entries (trust & safety)

### 4.9 Admin / Platform
- Admin console: dashboard, audit logs, disputes, feature flags, KYC review, management inquiries, organizations, RBAC config, service categories/enquiries/restrictions, taxonomies, support tickets
- Team management, team invitations
- Subscriptions & billing (plans, packages, billing history)
- Referral program (codes, referrals, activity)
- Notifications (incl. mark-all-read, per-notification read state)
- Reports, intelligence/live-intelligence, data import jobs
- Role-aware dashboard with widgets (occupancy, rent collected, open tickets, renewals, vacancy, revenue trend, expense breakdown)

### 4.10 Public / Marketing Site
About, pricing (recently matched to client plan comparison), blog, careers, contact, demo, affiliate program, API access, legal pages (privacy/terms/cookies/security), role-specific help centers (admin/landlord/professional/staff/tenant), public listings search, public QR apply page, public service pages.

### 4.11 Production Bug Fixes (2026-07-10)
- Root cause: `leases.map(l => l.unitId)` / `.map(l => l.tenantId)`-style arrays included `null` (leases with no unit assigned), which Prisma's `{ id: { in: [...] } }` filter rejects, causing 500s.
- Fixed in `/api/v1/tenants` and `/api/v1/leases` (filter out falsy ids before building the `in` array).
- Follow-on frontend crash on `/leasing` (`Cannot read properties of null (reading 'slice')`) — pages called `.slice()` on `unitId` unconditionally; fixed to fall back to "No unit" when absent (`app/(authenticated)/leasing/page.tsx`, `leasing/[id]/page.tsx`).
- Both confirmed fixed on production after deploy (commits `ef67352`, `d7b3893`).

## 5. Delivery Status Summary

**Done / stable**: Auth + RBAC, Properties/Units/Leases/Listings, Tenants/CRM, KYC (upload/review/viewer), Service Request engine, Services/Marketplace reorg (Maintenance vs Professional) with full category configurator, Wallet/Ledger/Escrow/Deposit primitives, Rent collection/receipts, Utilities, QR access control, Short-stay/hospitality, Visitor management, Vacate/move-out + deposit deduction flow, Admin console, Notifications, Compliance tracking, public marketing site.

**In progress / planned**:
1. Phase 4 — formal double-entry ledger tightening (see `Phase-4.md`).
2. Linking "Managed Partner" delivery-strategy field to real Provider/Organization records (currently free text).

## 6. Source Docs Referenced
- `secure-living/New docs alex dend/UPDATE.md` — client feedback transcript + to-do list (Services/Marketplace reorg — implemented)
- `Phase-4.md` — ledger formalization plan
- `Entries-created.md` (repo root) — demo seed-data log corroborating CRM/dashboard/role accounts
- Git history (63 commits) — iterative Phase 1–3 delivery, stabilized via subsequent bug-fix commits; latest: `ef67352` (services reorg + category configurator + tenants/leases fix), `d7b3893` (leasing crash follow-up fix)
