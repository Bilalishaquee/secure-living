# Secure Living — Backend

Next.js 14 API-only application providing the REST API, business logic, authentication, and data layer for the Secure Living platform. Runs on **port 4000**.

---

## Getting Started

```bash
npm install
npx prisma db push    # initialise SQLite database from schema
npm run db:seed       # seed roles and permissions
npm run dev           # start on port 4000
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 4000 with hot reload |
| `npm run dev:clean` | Clear `.next` cache then start dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Serve production build (run `build` first) |
| `npm run lint` | ESLint via Next.js |
| `npm run clean` | Delete `.next` output directory |
| `npm run db:migrate` | Run Prisma migrate dev (create migration) |
| `npm run db:seed` | Seed roles and permissions |

---

## Project Structure

```
Secure-Living-Backend/
├── app/
│   └── api/v1/                     # All REST route handlers
│       ├── auth/
│       │   ├── login/route.ts       # POST — email/password → JWT
│       │   ├── register/route.ts    # POST — create account
│       │   └── me/route.ts          # GET — current user profile
│       ├── properties/route.ts      # GET, POST — property list/create
│       ├── properties/[id]/
│       │   ├── route.ts             # GET, PATCH, DELETE
│       │   ├── units/route.ts       # GET, POST — units for property
│       │   ├── units/bulk/route.ts  # POST — bulk unit creation
│       │   └── management-mode/route.ts  # PATCH — self_managed ↔ full_service
│       ├── units/route.ts           # GET — all units
│       ├── leases/route.ts          # GET, POST
│       ├── rent-invoices/route.ts   # GET, POST
│       ├── wallets/route.ts         # GET, POST
│       ├── wallets/[id]/
│       │   ├── balance/route.ts
│       │   └── ledger/route.ts
│       ├── escrow/route.ts          # GET, POST
│       ├── escrow/[id]/
│       │   ├── hold/route.ts
│       │   ├── release/route.ts
│       │   └── dispute/route.ts
│       ├── service-requests/        # Maintenance request CRUD
│       ├── kyc/documents/route.ts
│       ├── team/route.ts            # GET, POST — invitations
│       ├── team/[id]/route.ts       # GET, DELETE — single invitation
│       ├── import/route.ts          # POST — bulk CSV import
│       ├── dashboard/stats/route.ts # GET — KPI summary
│       ├── rbac/                    # Roles, permissions management
│       ├── organizations/           # Org and branch management
│       ├── audit-logs/route.ts
│       └── health/route.ts          # GET — liveness check
│
├── lib/server/
│   ├── db.ts           # Prisma client singleton
│   ├── authz.ts        # Actor type, token parsing, permission helpers
│   ├── http.ts         # requireActor, requirePermission, parseBody, jsonError
│   ├── token.ts        # HMAC-SHA256 JWT create/parse
│   ├── password.ts     # scrypt hash and verify
│   ├── identity.ts     # buildUserAccess — resolves role + permissions from DB
│   ├── audit.ts        # appendAudit — write to AuditLog table
│   ├── validation.ts   # Zod schemas for all request bodies
│   └── service-fsm.ts  # Service request state machine
│
├── prisma/
│   ├── schema.prisma   # Full data model (40+ models)
│   ├── migrations/     # SQL migration history
│   ├── seed.js         # Roles and permissions seed (no users)
│   └── dev.db          # SQLite database file (git-ignored in production)
│
├── types/              # Shared backend TypeScript types
├── next.config.mjs     # serverComponentsExternalPackages for Prisma
└── tsconfig.json
```

---

## Authentication

The backend uses a **custom HMAC-SHA256 JWT** implementation (no third-party JWT library):

1. `POST /api/v1/auth/login` verifies the password with `scryptSync`, then calls `createAuthToken` to produce a signed token.
2. The token is stored in the `ApiSession` table with an expiry timestamp.
3. Every protected route calls `requireActor(req)` which extracts and validates the `Authorization: Bearer <token>` header via `parseAuthToken`.
4. The resolved `ApiActor` carries `userId`, `role`, `permissions[]`, `orgIds[]`, and `branchIds[]` — used for all permission and scope checks.

**Key helpers in `lib/server/`:**

| Helper | Description |
|--------|-------------|
| `requireActor(req)` | Returns `ApiActor` or `401 Response` |
| `requirePermission(actor, code)` | Returns `403 Response` or `null` |
| `requireScope(actor, orgId, branchId)` | Returns `403 Response` or `null` |
| `parseBody(req, schema)` | Zod-validates request body |
| `appendAudit(...)` | Writes an `AuditLog` row |

---

## Database

SQLite via **Prisma 5**. Key models:

| Model | Description |
|-------|-------------|
| `AppUser` | User accounts |
| `ApiSession` | Active JWT sessions |
| `Organization` / `Branch` | Org hierarchy |
| `Role` / `Permission` / `RolePermission` | RBAC |
| `UserRoleAssignment` | User ↔ role per org/branch |
| `Property` / `Unit` | Portfolio |
| `Lease` / `RentInvoice` | Leasing and billing |
| `EscrowAccount` / `Wallet` / `Transaction` / `LedgerEntry` | Finance |
| `ServiceRequest` / `JobAssignment` | Maintenance |
| `KycDocument` | Identity verification |
| `TeamInvitation` | Sub-user invitations |
| `AuditLog` | Immutable activity log |

### Common database commands

```bash
# Apply schema changes without creating a migration file
npx prisma db push

# Create and apply a named migration
npm run db:migrate

# Re-seed roles and permissions (does not delete users)
npm run db:seed

# Open Prisma Studio (browser-based DB GUI)
npx prisma studio
```

---

## Permissions

Permissions are seeded into the `Permission` table and assigned to roles via `RolePermission`. The full set:

```
properties:view  property:view   property:create  property:edit
unit:view        unit:create
maintenance:view maintenance:create maintenance:update maintenance:assign maintenance:approve maintenance:escalate
finance:view     finance:approve
leases:view      leases:manage   lease:view  lease:create  lease:edit
screening:view   screening:review
rent:collect     rent_collection:manage
services:view    services:contractor_admin
tenant:view      tenant:create
org:manage       rbac:manage     audit:view  kyc:upload
job-assignments:manage
*                               (super_admin only — grants all access)
```

If you add a new route that requires a new permission code, also add it to the `fix-permissions.mjs` pattern or re-run the seed after updating `prisma/seed.js`.

---

## Important Configuration Note

`next.config.mjs` must include:

```js
experimental: {
  serverComponentsExternalPackages: ["@prisma/client", "prisma"],
}
```

Without this, webpack attempts to bundle Prisma's native binary (`query_engine-windows.dll.node` on Windows) and **all API routes hang indefinitely**. This is already set correctly.

---

## Environment Variables

Create `Secure-Living-Backend/.env`:

```env
# Required
DATABASE_URL="file:./prisma/dev.db"

# Optional — change in production
APP_AUTH_SECRET=your-secret-here

# Frontend URL (for CORS headers if added later)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```
