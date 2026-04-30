# Secure Living — Frontend

Next.js 14 application serving the marketing site, authentication flows, and the full landlord/admin/tenant dashboard. Runs on **port 3000** and proxies all `/api/*` requests to the backend on port 4000.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The backend must also be running on port 4000 for authenticated pages to work — see the [root README](../README.md).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload on port 3000 |
| `npm run dev:clean` | Clear `.next` cache then start dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build (run `build` first) |
| `npm run lint` | ESLint via Next.js |
| `npm run clean` | Delete `.next` output directory |

---

## Project Structure

```
Secure-Living-Frontend/
├── app/
│   ├── layout.tsx                  # Root layout — fonts, viewport, providers
│   ├── globals.css                 # Global styles, CSS variables, Tailwind base
│   ├── page.tsx                    # Landing page (public)
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── (authenticated)/            # Protected dashboard shell
│       ├── layout.tsx              # DashboardLayout wrapper
│       ├── dashboard/page.tsx      # Mission-control KPI dashboard
│       ├── properties/             # Properties list + detail + units
│       ├── tenants/                # Tenant roster
│       ├── leases/                 # Lease list and management
│       ├── financials/             # Transactions, wallets, ledger
│       ├── maintenance/            # Service requests
│       ├── kyc/                    # KYC document queue
│       ├── lease-renewals/         # Renewal alerts
│       ├── team/                   # Team invitations
│       ├── import/                 # Bulk CSV import wizard
│       └── admin/                  # Admin-only section
│           ├── rbac/               # Role & permission matrix
│           ├── audit-logs/         # Audit log explorer
│           └── organizations/      # Org & branch management
│
├── components/
│   ├── landing/
│   │   ├── LandingNav.tsx          # Marketing nav bar
│   │   ├── HeroSection.tsx         # Hero (do not modify)
│   │   ├── StessaCloneSections.tsx # All non-hero marketing sections
│   │   └── LandingFooter.tsx       # Dark navy footer
│   ├── layout/
│   │   ├── DashboardLayout.tsx     # Sidebar + top bar shell
│   │   ├── Sidebar.tsx             # Nav groups per role
│   │   └── TopBar.tsx              # Header with user menu
│   ├── ui/                         # Button, Card, Badge, DataTable, Toast, etc.
│   ├── brand/
│   │   └── LogoShield.tsx          # Brand mark component
│   └── providers.tsx               # AuthProvider, ToastProvider
│
├── lib/
│   ├── auth-context.tsx            # Auth state, login, logout, register
│   ├── toast-context.tsx           # Global toast notifications
│   ├── profile-merge.ts            # Role normalisation helpers
│   └── utils.ts                    # cn(), formatting helpers
│
├── types/
│   └── auth.ts                     # AuthUser, UserRole, AUTH_STORAGE_KEY
│
├── public/
│   └── l1.png                      # Brand logo
│
├── next.config.mjs                 # Rewrites, image domains, optimizePackageImports
├── tailwind.config.ts
└── tsconfig.json
```

---

## Authentication

Auth state is managed client-side via `lib/auth-context.tsx`:

- On login the frontend calls `POST /api/v1/auth/login` (proxied to backend).
- The backend returns a signed JWT which is stored in `localStorage` under the key `sl_auth_user` (see `AUTH_STORAGE_KEY` in `types/auth.ts`).
- `AuthProvider` hydrates from `localStorage` on mount and exposes `user`, `login`, `logout`, and `registerUser`.
- Protected routes are wrapped in `RequireAuth` — unauthenticated users redirect to `/auth/login`.
- The `/admin/*` sub-tree is additionally guarded by `RequireAdmin`.

---

## API Proxy

`next.config.mjs` rewrites every `/api/:path*` request to the backend at runtime:

```js
{
  source: "/api/:path*",
  destination: `${process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:4000"}/api/:path*`,
}
```

Frontend pages call `/api/v1/...` as if the API were local — no CORS configuration needed.

---

## Styling Conventions

- **Tailwind CSS 3** for all layout and styling.
- Semantic colour tokens (`--text-primary`, `--text-muted`, `--bg-surface`, etc.) defined as CSS custom properties in `app/globals.css`.
- Brand colours (`brand-blue`, `brand-navy`) registered in `tailwind.config.ts`.
- Page-level layout helpers (`app-page-toolbar`, `app-page-title`, `app-page-lead`) defined in `globals.css`.
- **Framer Motion** for scroll-triggered animations across marketing sections and dashboard.
- **GSAP** used only in `HeroSection` — do not add GSAP to other sections.

---

## Landing Page

The marketing site is built from four composable components:

| Component | Description |
|-----------|-------------|
| `LandingNav` | Sticky navigation with login / register CTAs |
| `HeroSection` | Animated hero — **do not modify** |
| `StessaCloneSections` | Stats banner, feature grid, three feature spotlights (Lease Management, Portfolio Acquisitions, Landlord Banking), how-it-works, testimonials, CTA, newsletter |
| `LandingFooter` | Dark navy footer with links and contact details |

The three feature spotlight sections use **inline CSS mockups** — no external images or assets required.

---

## Environment Variables

Create `Secure-Living-Frontend/.env` (or `.env.local`) for local development:

```env
NEXT_PUBLIC_BACKEND_ORIGIN=http://localhost:4000
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_WHATSAPP_E164=254700000000
NEXT_PUBLIC_CONSULTATION_EMAIL=hello@secureliving.com
```

All variables are optional for local development. `NEXT_PUBLIC_BACKEND_ORIGIN` defaults to `http://localhost:4000` when omitted.
