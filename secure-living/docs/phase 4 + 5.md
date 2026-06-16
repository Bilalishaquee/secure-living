# Phase 4 + 5 — Wallets, Ledgers, Escrow & Trust Account System

> **Scope note:** Phases 1–3 are fully implemented. This document covers the combined scope of Phase 4 (Wallets, Ledgers & Immutable Transactions) and Phase 5 (Escrow State Machine & Holds). Items already partially scaffolded in the codebase are marked **[EXISTS — EXTEND]**; everything else is net-new.

---

## What Already Exists (Do Not Rebuild)

The following financial primitives were laid down in earlier phases and must be built **on top of**, not replaced:

| Model / Route | What it does today |
|---|---|
| `Wallet` + `/wallets/[id]/balance` + `/ledger` | Basic wallet entity with balance read and ledger list |
| `Transaction` + `/transactions/[id]/reverse` | Transaction records with reversal support |
| `LedgerEntry` | Individual ledger lines (not yet double-entry enforced) |
| `EscrowAccount` + `/escrow/[id]/{hold,release,dispute}` | Basic escrow CRUD with three action endpoints |
| `FundHold` + `/fund-holds/[id]` | Hold records on wallets |
| `IdempotencyKey` | Table exists; not wired to all financial endpoints yet |
| `ReconciliationReport` + `/reconciliation/reports` | Reconciliation report scaffold |
| `AccountFreeze` + `FreezeAppeal` | Account-level freeze (for compliance, not escrow) |
| `DepositTransfer` + `/deposit-transfers` | Tenant deposit handover workflow |
| `RentInvoice` + `/rent-invoices/[id]/pay` | Rent billing and payment record |
| `RentReceipt` + `/rent-receipts` | Digital receipts after payment |
| `Expense` + `/expenses/[id]` | Property expense tracking |
| `/reports/noi` + `/reports/pnl` | Net Operating Income and P&L reports |
| `/rent-collection/dashboard` | Basic rent collection view |

---

## Phase 4 — Wallets, Ledgers & Immutable Transactions

**Goal:** Transform the existing wallet scaffold into a full trust-account-backed financial spine. Every shilling that moves through the platform must flow through a double-entry ledger, be tagged with a purpose, and be impossible to silently edit or delete.

---

### Module 4.1 — Property Payment Mode Configuration

Each property operates under exactly one of three payment modes. Admins configure it; the entire UX (tenant, supervisor, landlord) adapts to the active mode.

**Modes:**
- `MANUAL` — Staff logs payments manually; supervisor + admin approve.
- `HYBRID` — Tenant uploads payment proof (M-Pesa screenshot, bank slip); supervisor verifies; landlord confirms receipt.
- `FULL_ESCROW` — Tenant pays into the Secure Living trust account / wallet; system automates deductions and disbursement.

**To build:**
- Add `paymentMode` enum (`MANUAL | HYBRID | FULL_ESCROW`) and `paymentModeUpdatedAt` / `paymentModeUpdatedBy` fields to the `Property` model
- `PropertyPaymentModeHistory` table — log every mode change (who changed it, when, previous mode)
- `PATCH /api/v1/properties/[id]/payment-mode` — admin-only endpoint to switch modes (locks in-progress transactions before applying)
- Admin UI: property settings panel showing current mode, change history, and a mode-switch confirmation modal
- Tenant payment UI reads the property's mode and shows appropriate options
- Landlord and supervisor dashboards conditionally render workflows based on mode

---

### Module 4.2 — Hybrid Payment Proof Workflow

Covers the `HYBRID` mode end-to-end: tenant uploads proof → supervisor verifies → landlord confirms → receipt locks.

**Sub-flows:**
1. **Tenant uploads proof** — M-Pesa SMS text, bank transfer screenshot, or manual reference. Status: `PENDING_VERIFICATION`
2. **Supervisor verification** — Reviews authenticity, amount, and property match. Status: `VERIFIED_AWAITING_LANDLORD`
3. **Landlord confirmation** — Clicks "Confirm Receipt" or "Flag Discrepancy." Status: `CONFIRMED` or `DISPUTED`
4. **Receipt generation** — On both confirmations, system locks ledger entry and generates digital receipt

**To build:**
- `PaymentProof` model — fields: `tenantId`, `propertyId`, `unitId`, `leaseId`, `amount`, `proofType` (`MPESA | BANK_SLIP | MANUAL`), `proofUrl`, `mpesaCode`, `status`, `verifiedBy`, `verifiedAt`, `confirmedBy`, `confirmedAt`
- `POST /api/v1/payment-proofs` — tenant submits proof
- `GET /api/v1/payment-proofs` — supervisor queue view
- `POST /api/v1/payment-proofs/[id]/verify` — supervisor marks verified
- `POST /api/v1/payment-proofs/[id]/confirm` — landlord confirms
- `POST /api/v1/payment-proofs/[id]/dispute` — landlord flags discrepancy (freezes ledger entry)
- Notification triggers at each status transition (in-app + email)
- Supervisor dashboard: verification queue with proof image viewer
- Landlord dashboard: "Awaiting your confirmation" card with amount and property details

---

### Module 4.3 — Full-Service (Escrow) Payment Flow

Covers the `FULL_ESCROW` mode: tenant pays into trust account → finance reconciles → automated deductions → landlord approves disbursement.

**Stages:**
1. Tenant payment logged as `RECEIVED_PENDING_VERIFICATION`
2. Finance officer reconciles daily bank feed → `CLEARED_IN_TRUST_ACCOUNT`
3. Automated deduction engine applies → `DEDUCTIONS_APPLIED`
4. Landlord approves release (or auto-release fires on schedule) → `DISBURSED`

**To build:**
- `TrustAccountPayment` model — fields: `propertyId`, `tenantId`, `amount`, `reference` (property + tenant + month), `status` (enum above), `clearedBy`, `clearedAt`, `netAmount`, `disbursedAt`
- `POST /api/v1/trust-payments` — log incoming payment
- `POST /api/v1/trust-payments/[id]/clear` — finance officer marks cleared
- Automated deduction application on clear (see Module 4.5)
- Landlord alert: "KES 65,000 received for Apt 4B — Approve Release?"
- `POST /api/v1/trust-payments/[id]/approve-disbursement` — landlord approves
- `POST /api/v1/trust-payments/[id]/hold-disbursement` — landlord holds for review
- Finance dashboard: daily incoming payments view with bank-feed status

---

### Module 4.4 — Double-Entry Ledger Enforcement

Every financial event creates exactly two `LedgerEntry` rows — one debit, one credit. No mutable balance fields. Balances are always derived by summing entries.

**Rules:**
- Rent received: Debit `Trust Account`, Credit `Landlord Sub-Ledger`
- Management fee: Debit `Landlord Sub-Ledger`, Credit `Secure Living Revenue`
- Repair payout: Debit `Landlord Sub-Ledger`, Credit `Vendor Payable`
- Reversal: mirror entries with negative amounts and a `reversalOf` reference

**To build:**
- Extend `LedgerEntry` — add `debitAccountId`, `creditAccountId`, `amount`, `currency`, `entryType` (`DEBIT | CREDIT`), `reversalOf` (self-reference), `locked` (bool, true once posted)
- `LedgerAccount` model — named accounts: `TRUST_ACCOUNT`, `LANDLORD_SUB_LEDGER_[id]`, `SL_REVENUE`, `VENDOR_PAYABLE`, `DEPOSIT_HELD`, `ESCROW_HELD`
- Ledger posting service (server lib) — `postDoubleEntry(debitAccountId, creditAccountId, amount, metadata)` — atomic transaction, prevents partial writes
- All financial endpoints must call this service instead of writing `LedgerEntry` directly
- `GET /api/v1/ledger-accounts` — list accounts with derived balances
- `GET /api/v1/ledger-accounts/[id]/entries` — paginated entry list
- Admin balance-check endpoint — verifies sum of all debits equals sum of all credits (invariant check)

---

### Module 4.5 — Automated Deduction Engine

Applies contractual deductions automatically when a payment clears. Each deduction line appears in the landlord ledger.

**Standard deductions:**
- 8% management fee (configurable per landlord contract)
- Add-on module charges (e.g., inspections +1%, security +1%)
- Pre-approved expenses (repairs, utilities) — drawn from `Expense` records
- Repair coordination markup — 5–10% added to vendor payment amount

**To build:**
- `DeductionRule` model — fields: `organizationId`, `landlordId`, `type` (`MANAGEMENT_FEE | ADDON_MODULE | REPAIR_MARKUP | CUSTOM`), `ratePercent`, `flatAmount`, `description`, `active`
- `DeductionApplication` model — records which rules were applied to which payment, the computed amounts, and ledger entry references
- Deduction engine service — runs on payment clear, fetches applicable rules, computes amounts, posts double-entry pairs for each deduction
- `GET/POST/PATCH /api/v1/deduction-rules` — admin CRUD
- `GET /api/v1/deduction-applications?paymentId=` — audit trail for a specific payment
- Landlord ledger view shows each deduction line itemised (not a lump sum)

---

### Module 4.6 — Disbursement Scheduling Engine

Automates landlord payouts on a fixed schedule, with fallback to manual landlord approval.

**Two payout modes (per landlord contract):**
- **Auto-Release** — executes on fixed day of month (e.g., 5th) if no disputes are open
- **Manual Approval** — landlord reviews statement → clicks "Approve Payout"

**To build:**
- `DisbursementSchedule` model — fields: `landlordId`, `mode` (`AUTO | MANUAL`), `dayOfMonth`, `lastRunAt`, `nextRunAt`
- `DisbursementBatch` model — groups all payouts for a landlord in one batch, with status and totals
- Vercel Cron endpoint: `POST /api/v1/internal/run-disbursements` — fires on 1st of month, processes due auto-release schedules
- `POST /api/v1/disbursements/[id]/approve` — manual approval trigger
- `POST /api/v1/disbursements/[id]/hold` — landlord holds a batch
- `GET /api/v1/disbursements` — landlord views upcoming and past payouts
- Net payout calculation: gross rent − all deductions = `netAmount`
- Guard: batch must not run if any payment in it is in `DISPUTED` status

---

### Module 4.7 — Transaction Tagging System

Every ledger entry and transaction is tagged with a human-readable purpose. Tags are searchable and filterable.

**Tag structure:** `[TYPE] — [DESCRIPTOR] — [PERIOD]`
Examples: `Rent — Apt 4B — March 2026`, `Repair — Plumbing Leak — Unit 3A`, `Fee — Management — April 2026`

**To build:**
- Add `tag` (string), `tagType` enum (`RENT | REPAIR | ESCROW | FEE | DEPOSIT | UTILITY | OTHER`), and `period` (date) to `Transaction` and `LedgerEntry`
- Tag auto-population rules — engine applies standard tag based on transaction context (rent invoice → `RENT`, service request payout → `REPAIR`, etc.)
- `GET /api/v1/transactions?tagType=&period=&propertyId=` — filterable transaction list
- Landlord dashboard: transaction list grouped by tag type with period selector
- CSV/PDF export of tagged transaction history

---

### Module 4.8 — Sub-Ledger System

Each landlord and each property has a dedicated virtual sub-ledger. Balances are fully isolated — no pooled confusion.

**Sub-ledger hierarchy:**
```
Secure Living Master Trust Account
  └── Landlord Sub-Ledger [landlordId]
        └── Property Sub-Ledger [propertyId]
              └── Purpose Ledgers (rent, deposit, reserve, escrow)
```

**To build:**
- `SubLedger` model — fields: `ownerType` (`LANDLORD | PROPERTY | ESCROW | RESERVE`), `ownerId`, `purpose`, `currency`, `balance` (derived — NOT a stored field, computed from entries)
- Sub-ledger creation on property onboarding (rent, deposit, reserve buckets auto-created)
- `GET /api/v1/sub-ledgers?ownerId=` — list sub-ledgers for a landlord or property
- `GET /api/v1/sub-ledgers/[id]/balance` — computed balance with as-of-date support
- `GET /api/v1/sub-ledgers/[id]/statement` — full entry history
- Landlord dashboard: wallet card showing balance across all their sub-ledgers
- Reserve fund auto-allocation: configurable % of rent auto-posted to reserve sub-ledger

---

### Module 4.9 — Monthly PDF Statement Generator

Auto-generated statements emailed to every landlord on a fixed schedule. Each PDF itemises every movement.

**Statement contents:**
- Rent received (per unit)
- Deductions applied (management fee, add-ons, pre-approved repairs)
- Disbursement amount and date
- Opening and closing balance
- Any holds or disputes during the period

**To build:**
- PDF generation service (server-side, e.g., using `pdf-lib` or `@react-pdf/renderer`)
- `FinancialStatement` model — stores generated statement metadata (landlordId, period, pdfUrl, sentAt)
- `POST /api/v1/internal/generate-statements` — monthly cron trigger
- `GET /api/v1/statements` — landlord fetches their statements
- `GET /api/v1/statements/[id]/download` — returns PDF stream
- Email delivery on generation
- Landlord dashboard: "Statements" tab with period selector and download button

---

### Module 4.10 — Daily Reconciliation Screen

Finance officers match bank feeds to ledger entries daily. Mismatches trigger alerts.

**To build:**
- `BankFeedEntry` model — imported bank statement lines (date, amount, reference, matched status)
- `POST /api/v1/bank-feed/import` — finance officer uploads bank statement (CSV/Excel)
- Matching engine — auto-matches bank entries to `TrustAccountPayment` records by amount + reference
- `POST /api/v1/bank-feed/[id]/match` — manual match override
- `GET /api/v1/bank-feed/unmatched` — list of unreconciled entries
- Admin reconciliation dashboard: side-by-side view of bank entries vs ledger, match/unmatch controls, mismatch alerts
- Daily cron: `POST /api/v1/internal/run-reconciliation` — flags stale unmatched entries

---

### Module 4.11 — Admin Financial Override Panel

Admins can freeze, release, or refund any transaction from a central panel with full audit logging.

**To build:**
- `POST /api/v1/admin/transactions/[id]/freeze` — freeze a transaction (blocks further action)
- `POST /api/v1/admin/transactions/[id]/unfreeze` — unfreeze
- `POST /api/v1/admin/transactions/[id]/force-release` — admin override release
- `POST /api/v1/admin/transactions/[id]/refund` — initiate full or partial refund (creates reversal ledger entries)
- Admin UI: transaction search, detail view, action buttons with reason field, confirmation modal
- Every override action appended to `AuditLog` with admin userId, reason, and before/after state

---

### Module 4.12 — M-Pesa & Banking API Integration Layer

Stubs and integration points for real payment rails. Phase 4 ships the architecture; live API keys activate it.

**To build:**
- `PaymentGatewayConfig` model — stores gateway type (`MPESA | FLUTTERWAVE | STRIPE | BANK`), credentials (encrypted), active status, per-org
- M-Pesa Daraja API client (STK Push, C2B, B2C) — abstracted behind a `PaymentGateway` interface
- Webhook handler: `POST /api/v1/webhooks/mpesa` — receives Daraja callbacks, auto-matches to `TrustAccountPayment`
- Flutterwave/Stripe handlers for diaspora payments
- `POST /api/v1/admin/payment-gateways` — configure gateway credentials per org
- Gateway selection logic — property payment mode + tenant location determines which gateway is offered
- All gateway calls are idempotency-key protected (see Phase 5, Module 5.3)

---

## Phase 5 — Escrow State Machine & Holds

**Goal:** Make the existing escrow scaffold airtight. Every escrow account must move through a strict finite-state machine. Illegal transitions are blocked at the database level. No payment can disappear. Duplicate API calls are safe by default.

---

### Module 5.1 — Escrow Finite State Machine (FSM)

The core of Phase 5. Every `EscrowAccount` has a `state` field. Only valid transitions are permitted.

**State graph:**
```
CREATED → PENDING → HELD → RELEASED
                  ↘ DISPUTED → RESOLVED → RELEASED
                                        ↘ REFUNDED
                  ↘ EXPIRED
```

**Illegal transitions (must be blocked):**
- `RELEASED → HELD` (no re-holding after release)
- `DISPUTED → RELEASED` (cannot release without resolution)
- `EXPIRED → HELD` (expired escrow cannot be revived without admin reset)
- Any transition from `RELEASED` or `REFUNDED`

**To build:**
- Add `state` enum to `EscrowAccount`: `CREATED | PENDING | HELD | RELEASED | DISPUTED | RESOLVED | EXPIRED | REFUNDED`
- `EscrowTransition` model — append-only log of every state change: `from`, `to`, `triggeredBy`, `reason`, `transitionedAt`
- FSM enforcement service (server lib) — `transitionEscrow(escrowId, targetState, actor, reason)` — validates transition, posts ledger entries, appends transition log, all in one atomic transaction
- Refactor all four existing escrow action endpoints (`/hold`, `/release`, `/dispute`) to go through the FSM service instead of direct DB writes
- New endpoint: `POST /api/v1/escrow/[id]/expire` — admin marks abandoned escrow as expired
- New endpoint: `POST /api/v1/escrow/[id]/resolve` — admin resolves dispute (routes to release or refund)
- `GET /api/v1/escrow/[id]/transitions` — full state history for an escrow account
- Admin escrow monitor: list all escrow accounts by state with age indicators

---

### Module 5.2 — Property Purchase Milestone Escrow

Handles the property-purchase flow: buyer deposits full amount → funds released in three tranches as milestones are verified.

**Milestone schedule (configurable per deal):**
- 30% after title deed verification
- 40% after signed sale agreement
- 30% after transfer registration

**To build:**
- `PropertyPurchaseEscrow` model — links to `EscrowAccount`, stores `buyerId`, `sellerId`, `propertyId`, `totalAmount`, `milestones` (JSON array of `{ name, triggerPercent, status, verifiedBy, verifiedAt, releaseAmount, releasedAt }`)
- `EscrowMilestone` table (alternative to JSON) — normalised milestone rows
- `POST /api/v1/escrow/purchase` — create purchase escrow with milestone schedule
- `POST /api/v1/escrow/purchase/[id]/verify-milestone` — professional/admin marks milestone complete → triggers partial release via FSM
- Partial release logic: releases `triggerPercent` of total into seller's wallet, updates ledger
- Guard: total released can never exceed total held
- Buyer dashboard: "Property Purchase Status" card — how much held, which milestones are done, release schedule
- Seller dashboard: shows received tranches and pending amounts
- Email/notification on each milestone verification and release

---

### Module 5.3 — Idempotency Enforcement (All Financial Endpoints)

The `IdempotencyKey` table already exists. Phase 5 wires it to every endpoint that moves money so duplicate API calls are safe.

**To build:**
- Idempotency middleware (`lib/server/idempotency.ts`) — reads `Idempotency-Key` header, checks table, returns cached response if key seen within 24h, stores response after first successful call
- Apply middleware to: all `POST` endpoints under `/wallets`, `/escrow`, `/transactions`, `/trust-payments`, `/disbursements`, `/payment-proofs`, `/escrow/purchase`
- `IdempotencyKey` table: add `expiresAt` (24h), `endpoint`, `requestHash`, `responseBody`, `responseStatus`
- Client-facing error: `409 Duplicate Request — use a new Idempotency-Key for a different operation`
- Dev tooling: log when an idempotency key is replayed so it's visible in Vercel function logs

---

### Module 5.4 — Construction Funding Milestones

Handles property development funding: client deposits full build cost → tranches released as engineer signs off on each construction stage.

**Stages (configurable):**
- Foundation completion
- Structural frame
- Roofing
- Finishing & fixtures
- Handover inspection

**To build:**
- `ConstructionEscrow` model — links to `EscrowAccount`, stores `clientId`, `contractorId`, `propertyId`, `totalBudget`, construction stages as milestone rows
- Reuse `EscrowMilestone` table from Module 5.2 (polymorphic `escrowType`)
- `POST /api/v1/escrow/construction` — create construction escrow
- `POST /api/v1/escrow/construction/[id]/approve-stage` — engineer/admin approves stage → triggers tranche release
- Professional sign-off requirement — milestone cannot be approved without a linked professional approval record
- Progress dashboard for client: stages completed, funds released, remaining budget held

---

### Module 5.5 — Dispute Resolution Workflow

When an escrow is disputed, funds are frozen and an admin-mediated resolution process begins.

**Resolution outcomes:**
- Release to original beneficiary (dispute rejected)
- Full refund to payer (dispute upheld)
- Partial split (negotiated)

**To build:**
- `EscrowDispute` model — fields: `escrowId`, `raisedBy`, `reason`, `evidence` (URLs), `status` (`OPEN | UNDER_REVIEW | RESOLVED`), `resolution` (`RELEASE | REFUND | SPLIT`), `splitPercent`, `resolvedBy`, `resolvedAt`
- `POST /api/v1/escrow/[id]/dispute` — refactored to create `EscrowDispute` record + freeze escrow via FSM
- `POST /api/v1/admin/escrow-disputes/[id]/review` — admin assigns dispute to reviewer
- `POST /api/v1/admin/escrow-disputes/[id]/resolve` — admin selects resolution type, inputs split % if applicable → FSM transitions to RESOLVED → triggers release or refund ledger entries
- Admin dispute queue dashboard — open disputes with age, amount, parties involved
- Notification to both parties on resolution with breakdown

---

### Module 5.6 — Airbnb / Short-Stay Revenue Split Engine

After a guest checks out and the post-checkout inspection clears, revenue is automatically split between the landlord and Secure Living.

**Split logic (configurable per property):**
- Default: 80% landlord / 20% Secure Living
- Admin can configure custom split per `ShortStayProperty`

**To build:**
- Add `revenueSplitPercent` (landlord's share) to `ShortStayProperty`
- `ShortStayRevenueSplit` model — records the split computation for each booking: `bookingId`, `grossAmount`, `landlordAmount`, `platformAmount`, `status`, `splitAt`
- Split trigger: `POST /api/v1/short-stay/bookings/[bookingId]/check-out` — already exists; extend to compute split after inspection clears
- Post double-entry: gross → Trust Account, landlord share → Landlord Sub-Ledger, platform share → SL Revenue
- `GET /api/v1/short-stay/revenue-splits` — landlord views split history per booking
- Short-stay dashboard: revenue tile shows gross, net after split, and platform fee

---

### Module 5.7 — Rent-to-Own Credit Tracking

A portion of each monthly "rent" payment is credited toward the tenant's purchase target. Tenant can see their ownership progress.

**To build:**
- `RentToOwnContract` model — fields: `tenantId`, `propertyId`, `purchasePrice`, `creditRatePercent` (% of rent credited toward purchase), `totalCredited`, `startDate`, `targetDate`
- `RentToOwnCreditEntry` model — one row per rent payment: `contractId`, `rentInvoiceId`, `rentAmount`, `creditAmount`, `cumulativeCredit`
- Credit application hook on `RentInvoice` payment — if tenant's lease is rent-to-own, automatically compute and record credit entry
- `GET /api/v1/rent-to-own/[contractId]` — contract summary with progress
- `GET /api/v1/rent-to-own/[contractId]/credits` — credit history
- Tenant dashboard: "Ownership Progress" card — purchase price, total credited, remaining, projected completion date
- Admin CRUD: `POST /api/v1/rent-to-own` — create/configure contract

---

### Module 5.8 — Commercial Lease Compliance Holds

Funds for commercial leases can be held until specific compliance conditions are met (health permits, fire safety certificates, etc.).

**To build:**
- `ComplianceHold` model — fields: `escrowId`, `leaseId`, `condition` (description), `conditionType` (`HEALTH_PERMIT | FIRE_CERT | ZONING | CUSTOM`), `evidenceUrl`, `verifiedBy`, `verifiedAt`, `status` (`PENDING | VERIFIED | WAIVED`)
- `POST /api/v1/compliance-holds` — create a hold condition on an escrow
- `POST /api/v1/compliance-holds/[id]/verify` — admin/professional marks condition met → releases the hold
- All conditions must be verified before the escrow can transition to RELEASED
- FSM guard: escrow release endpoint checks for any open `ComplianceHold` records
- `GET /api/v1/compliance-holds?escrowId=` — list conditions for an escrow

---

### Module 5.9 — Escrow Expiry & Abandonment Handling

Escrow accounts that have been idle for a configurable period are automatically flagged, then escalated for admin review.

**To build:**
- Add `expiresAt` (optional) to `EscrowAccount`
- Cron: `POST /api/v1/internal/expire-escrow` — runs daily, transitions escrow past `expiresAt` with no activity to `EXPIRED` state via FSM
- `ExpiryAlert` — notify both parties when escrow approaches expiry (7-day and 1-day warnings)
- Admin panel: "Expiring Soon" and "Expired" escrow queues
- `POST /api/v1/admin/escrow/[id]/reset-expiry` — admin extends or clears expiry on legitimate accounts
- Audit log entry on every expiry

---

### Module 5.10 — Buyer / Seller Escrow Dashboard (Frontend)

Dedicated dashboard views for property buyers and sellers tracking their purchase escrow in real time.

**To build:**
- `/(authenticated)/escrow/purchase` — buyer view: total held, milestones completed (with checkmarks), next milestone, release schedule, contact admin button
- `/(authenticated)/escrow/construction` — client view: construction stages, fund released per stage, remaining budget
- `/(authenticated)/escrow/sell` — seller view: expected tranches, received amounts, pending milestone verification
- Shared `EscrowTimeline` component — visual step-by-step state progression with dates and amounts at each step
- Mobile-friendly card layout; amounts in KES with clear labels

---

## Database Changes Summary

| New Model | Purpose |
|---|---|
| `PropertyPaymentModeHistory` | Tracks every mode change on a property |
| `PaymentProof` | Tenant-uploaded payment evidence (hybrid mode) |
| `TrustAccountPayment` | Payment received into Secure Living trust account |
| `LedgerAccount` | Named accounts for double-entry system |
| `DeductionRule` | Configurable deduction rates per landlord/org |
| `DeductionApplication` | Record of which rules were applied to which payment |
| `DisbursementSchedule` | Landlord payout schedule (auto or manual) |
| `DisbursementBatch` | Groups payouts in one batch per period |
| `FinancialStatement` | Generated PDF statement metadata |
| `BankFeedEntry` | Imported bank statement lines for reconciliation |
| `PaymentGatewayConfig` | Payment gateway credentials per org |
| `EscrowTransition` | Append-only FSM state change log |
| `PropertyPurchaseEscrow` | Property purchase deal linked to escrow |
| `EscrowMilestone` | Individual milestone row for purchase or construction |
| `ConstructionEscrow` | Construction funding deal linked to escrow |
| `EscrowDispute` | Dispute record with resolution tracking |
| `ShortStayRevenueSplit` | Revenue split computation per short-stay booking |
| `RentToOwnContract` | Rent-to-own agreement per tenant/property |
| `RentToOwnCreditEntry` | Monthly credit toward purchase |
| `ComplianceHold` | Condition that must clear before escrow releases |
| `SubLedger` | Named sub-ledger per landlord/property/purpose |

**Schema extensions on existing models:**
- `Property` → add `paymentMode`, `paymentModeUpdatedAt`, `paymentModeUpdatedBy`
- `EscrowAccount` → add `state` (FSM enum), `expiresAt`, `escrowType` (`RENT | PURCHASE | CONSTRUCTION | DEPOSIT`)
- `Transaction` → add `tag`, `tagType`, `period`
- `LedgerEntry` → add `debitAccountId`, `creditAccountId`, `entryType`, `reversalOf`, `locked`
- `IdempotencyKey` → add `expiresAt`, `endpoint`, `requestHash`, `responseBody`, `responseStatus`
- `ShortStayProperty` → add `revenueSplitPercent`

---

## New API Endpoints Summary

| Method | Path | Module |
|---|---|---|
| `PATCH` | `/api/v1/properties/[id]/payment-mode` | 4.1 |
| `GET/POST` | `/api/v1/payment-proofs` | 4.2 |
| `POST` | `/api/v1/payment-proofs/[id]/verify` | 4.2 |
| `POST` | `/api/v1/payment-proofs/[id]/confirm` | 4.2 |
| `POST` | `/api/v1/payment-proofs/[id]/dispute` | 4.2 |
| `GET/POST` | `/api/v1/trust-payments` | 4.3 |
| `POST` | `/api/v1/trust-payments/[id]/clear` | 4.3 |
| `POST` | `/api/v1/trust-payments/[id]/approve-disbursement` | 4.3 |
| `POST` | `/api/v1/trust-payments/[id]/hold-disbursement` | 4.3 |
| `GET` | `/api/v1/ledger-accounts` | 4.4 |
| `GET` | `/api/v1/ledger-accounts/[id]/entries` | 4.4 |
| `GET/POST/PATCH` | `/api/v1/deduction-rules` | 4.5 |
| `GET` | `/api/v1/deduction-applications` | 4.5 |
| `GET/POST` | `/api/v1/disbursements` | 4.6 |
| `POST` | `/api/v1/disbursements/[id]/approve` | 4.6 |
| `POST` | `/api/v1/disbursements/[id]/hold` | 4.6 |
| `GET` | `/api/v1/statements` | 4.9 |
| `GET` | `/api/v1/statements/[id]/download` | 4.9 |
| `GET` | `/api/v1/bank-feed/unmatched` | 4.10 |
| `POST` | `/api/v1/bank-feed/import` | 4.10 |
| `POST` | `/api/v1/bank-feed/[id]/match` | 4.10 |
| `POST` | `/api/v1/admin/transactions/[id]/freeze` | 4.11 |
| `POST` | `/api/v1/admin/transactions/[id]/unfreeze` | 4.11 |
| `POST` | `/api/v1/admin/transactions/[id]/force-release` | 4.11 |
| `POST` | `/api/v1/admin/transactions/[id]/refund` | 4.11 |
| `POST` | `/api/v1/webhooks/mpesa` | 4.12 |
| `GET/POST` | `/api/v1/admin/payment-gateways` | 4.12 |
| `POST` | `/api/v1/internal/run-disbursements` | 4.6 |
| `POST` | `/api/v1/internal/generate-statements` | 4.9 |
| `POST` | `/api/v1/internal/run-reconciliation` | 4.10 |
| `POST` | `/api/v1/escrow/[id]/expire` | 5.1 |
| `POST` | `/api/v1/escrow/[id]/resolve` | 5.1 |
| `GET` | `/api/v1/escrow/[id]/transitions` | 5.1 |
| `POST` | `/api/v1/escrow/purchase` | 5.2 |
| `POST` | `/api/v1/escrow/purchase/[id]/verify-milestone` | 5.2 |
| `POST` | `/api/v1/escrow/construction` | 5.4 |
| `POST` | `/api/v1/escrow/construction/[id]/approve-stage` | 5.4 |
| `GET` | `/api/v1/admin/escrow-disputes` | 5.5 |
| `POST` | `/api/v1/admin/escrow-disputes/[id]/review` | 5.5 |
| `POST` | `/api/v1/admin/escrow-disputes/[id]/resolve` | 5.5 |
| `GET` | `/api/v1/short-stay/revenue-splits` | 5.6 |
| `GET/POST` | `/api/v1/rent-to-own` | 5.7 |
| `GET` | `/api/v1/rent-to-own/[id]` | 5.7 |
| `GET` | `/api/v1/rent-to-own/[id]/credits` | 5.7 |
| `GET/POST` | `/api/v1/compliance-holds` | 5.8 |
| `POST` | `/api/v1/compliance-holds/[id]/verify` | 5.8 |
| `POST` | `/api/v1/internal/expire-escrow` | 5.9 |
| `POST` | `/api/v1/admin/escrow/[id]/reset-expiry` | 5.9 |

---

## New Frontend Pages Summary

| Route | Module |
|---|---|
| `/(authenticated)/payments/proof` | 4.2 — Tenant proof upload |
| `/(authenticated)/payments/verify-queue` | 4.2 — Supervisor verification queue |
| `/(authenticated)/payments/landlord-confirm` | 4.2 + 4.3 — Landlord confirmation queue |
| `/(authenticated)/financials/ledger-accounts` | 4.4 — Double-entry account view |
| `/(authenticated)/financials/deduction-rules` | 4.5 — Admin deduction config |
| `/(authenticated)/financials/disbursements` | 4.6 — Payout schedule and history |
| `/(authenticated)/financials/statements` | 4.9 — Statement list + PDF download |
| `/(authenticated)/financials/bank-reconciliation` | 4.10 — Daily bank feed matching |
| `/(authenticated)/admin/payment-gateways` | 4.12 — Gateway configuration |
| `/(authenticated)/escrow/purchase` | 5.2 — Buyer purchase tracking |
| `/(authenticated)/escrow/construction` | 5.4 — Construction funding progress |
| `/(authenticated)/escrow/sell` | 5.2 — Seller tranche tracking |
| `/(authenticated)/escrow/disputes` | 5.5 — Admin dispute queue |
| `/(authenticated)/short-stay/revenue-splits` | 5.6 — Revenue split history |
| `/(authenticated)/rent-to-own` | 5.7 — Tenant ownership progress |

---

## Implementation Order

Phase 4 and 5 modules have dependencies. Build in this sequence:

```
4.4 (Double-Entry Ledger)       ← foundation for everything financial
  → 4.8 (Sub-Ledger System)
    → 4.1 (Payment Mode Config)
      → 4.2 (Hybrid Proof Workflow)
      → 4.3 (Full-Service Flow)
        → 4.5 (Deduction Engine)
          → 4.6 (Disbursement Scheduling)
            → 4.9 (PDF Statements)
4.7 (Transaction Tagging)       ← can run in parallel with 4.2–4.6
4.10 (Reconciliation Screen)    ← after 4.3 is live
4.11 (Admin Override Panel)     ← after 4.4 is live
4.12 (M-Pesa Integration)       ← last in Phase 4; needs all flows stable
5.3 (Idempotency Enforcement)   ← wire early in Phase 5, before any live gateway
  → 5.1 (Escrow FSM)            ← refactors existing escrow
    → 5.5 (Dispute Resolution)
    → 5.2 (Purchase Milestones)
    → 5.4 (Construction Milestones)
    → 5.8 (Compliance Holds)
    → 5.9 (Expiry & Abandonment)
5.6 (Revenue Split)             ← after 5.1 FSM is live
5.7 (Rent-to-Own)               ← independent, can run parallel
5.10 (Buyer/Seller Dashboards)  ← after 5.2 and 5.4 are live
```

---

## Key Constraints

- **No UPDATE/DELETE on posted ledger entries.** Corrections use reversal entries only.
- **Escrow transitions must be atomic.** Ledger entries and state changes happen in a single `$transaction`.
- **All money-moving endpoints must accept `Idempotency-Key`** header from Phase 5 onwards.
- **Balances are derived, never stored.** `Wallet.balance` and `SubLedger.balance` must be computed from `LedgerEntry` sums, not mutable fields.
- **Admin override always writes to `AuditLog`.** No financial override without a paper trail.
- **M-Pesa integration is an activation layer.** The internal ledger logic must be identical whether payment comes from a Daraja callback or a manual admin entry.
