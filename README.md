# Secure Living

> Property management platform built for the Kenyan market — escrow-backed rent collection, digital leases, tenant screening, maintenance tracking, and portfolio analytics in one place.

---

## Architecture

This is a **monorepo** containing two independent Next.js 14 applications:

| App | Directory | Port | Purpose |
|-----|-----------|------|---------|
| Frontend | `Secure-Living-Frontend/` | 3000 | Marketing site, auth flows, full dashboard UI |
| Backend | `Secure-Living-Backend/` | 4000 | REST API, business logic, Prisma + SQLite database |

The frontend proxies all `/api/*` requests to the backend automatically via Next.js rewrites — no CORS configuration required.

---

## Prerequisites

- **Node.js** v18 or newer (tested on v24)
- **npm** v9+

---

## Quick Start

### 1. Install dependencies

```bash
cd Secure-Living-Frontend && npm install
cd ../Secure-Living-Backend && npm install
```

### 2. Set up the database

```bash
cd Secure-Living-Backend
npx prisma db push       # apply schema to SQLite
npm run db:seed          # seed roles and permissions
```

### 3. Start both servers

Open **two terminals**:

```bash
# Terminal 1 — Backend (port 4000)
cd Secure-Living-Backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd Secure-Living-Frontend
npm run dev
```

Or from the workspace root:

```bash
npm run dev:backend    # starts backend on :4000
npm run dev:frontend   # starts frontend on :3000
```

Open [http://localhost:3000](http://localhost:3000).

---

## Workspace Scripts

Run from the **repository root** (`ALEX01/`):

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run dev:frontend` | Start frontend on port 3000 |
| `npm run dev:backend` | Start backend on port 4000 |
| `npm run build` | Production build for both apps |
| `npm run build:frontend` | Build frontend only |
| `npm run build:backend` | Build backend only |
| `npm run lint` | ESLint across both apps |
| `npm run lint:frontend` | Lint frontend only |
| `npm run lint:backend` | Lint backend only |

---

## Platform Overview

### Core Modules

| Module | Description |
|--------|-------------|
| **Properties & Units** | Add properties, define units, bulk-create unit blocks |
| **Tenant Management** | Invite, screen, and onboard tenants with KYC |
| **Lease Management** | Digital leases, e-signature, automatic renewal alerts |
| **Rent Collection** | M-Pesa STK, invoicing, late fees, receipt generation |
| **Escrow & Banking** | Per-property wallets, escrow-backed deposits, instant payouts |
| **Maintenance** | Tenant-submitted requests, professional assignment, progress tracking |
| **Portfolio Acquisitions** | Yield, cap-rate, IRR, and cash-flow underwriting tools |
| **Team Management** | Invite sub-users with role and property-scoped access |
| **Data Import** | Bulk CSV import for properties, units, and tenants |
| **RBAC** | Role and permission management across the organisation |
| **Audit Log** | Immutable record of every mutation across the platform |
| **Dashboard** | Live KPIs, alert feed, and recent activity |

### User Roles

| Role | Access |
|------|--------|
| `super_admin` | Full platform access |
| `admin` | Org management, RBAC, all operational modules |
| `landlord` | Own portfolio — properties, units, leases, finance, tenants |
| `staff` | View and update assigned properties and maintenance |
| `tenant` | Own lease, maintenance requests, KYC documents |

---

## Repository Structure

```
ALEX01/
├── Secure-Living-Frontend/     # Next.js UI app (port 3000)
│   ├── app/
│   │   ├── page.tsx            # Landing page (hero + marketing sections)
│   │   ├── auth/               # Login, register pages
│   │   └── (authenticated)/    # Dashboard shell + all feature pages
│   ├── components/
│   │   ├── landing/            # Marketing sections, footer
│   │   ├── layout/             # Sidebar, TopBar, DashboardLayout
│   │   └── ui/                 # Reusable UI primitives (Button, Card, etc.)
│   ├── lib/                    # auth-context, toast-context, utils
│   ├── types/                  # Shared TypeScript types
│   └── next.config.mjs         # Rewrites /api/* → localhost:4000
│
├── Secure-Living-Backend/      # Next.js API-only app (port 4000)
│   ├── app/api/v1/             # REST route handlers
│   ├── lib/server/             # Auth, RBAC, Prisma client, validation, audit
│   ├── prisma/
│   │   ├── schema.prisma       # Full data model (40+ tables)
│   │   ├── migrations/         # SQL migration history
│   │   ├── seed.js             # Roles and permissions seed
│   │   └── dev.db              # SQLite database file
│   └── next.config.mjs         # Externalises Prisma from webpack bundling
│
├── package.json                # Workspace root scripts
└── README.md                   # This file
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3, Radix UI primitives |
| Motion | Framer Motion, GSAP |
| Charts | Recharts |
| Icons | Lucide React |
| ORM | Prisma 5 |
| Database | SQLite (development) |
| Auth | Custom HMAC-SHA256 JWT + `ApiSession` table |
| Validation | Zod |

---

## Environment Variables

### Frontend — `Secure-Living-Frontend/.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_ORIGIN` | No | `http://localhost:4000` | Backend base URL |
| `NEXT_PUBLIC_SITE_URL` | No | — | Canonical URL for SEO / Open Graph |
| `NEXT_PUBLIC_WHATSAPP_E164` | No | — | WhatsApp click-to-chat number |
| `NEXT_PUBLIC_CONSULTATION_EMAIL` | No | — | Contact email shown in CTAs |

### Backend — `Secure-Living-Backend/.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | Prisma connection string (`file:./prisma/dev.db`) |
| `APP_AUTH_SECRET` | No | Dev fallback | HMAC secret for JWT signing — **change in production** |

---

## License

Private project — `"private": true`. All rights reserved.
