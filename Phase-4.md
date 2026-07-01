# Phase 4 - Wallets, Ledgers & Immutable Transactions

## Purpose

Phase 4 creates the financial spine of Secure Living. Based on `MASTERPIECE.txt` and `12 phases for secure living system.txt`, this phase must convert the existing wallet, transaction, escrow, rent, receipt, and deposit foundation into a strict trust-accounting layer where every shilling is traceable, every balance is derived, and financial records cannot be edited after posting.

## Current Baseline

The platform already has early finance primitives: `Wallet`, `LedgerEntry`, `Transaction`, `EscrowAccount`, `RentInvoice`, `RentReceipt`, `DepositEscrow`, rent collection APIs, receipt APIs, transaction reversal APIs, banking UI, dashboard finance metrics, and deposit health indicators. Phase 4 should not discard this work; it should formalize it into a double-entry accounting model with strict posting rules, immutable journals, reconciliation controls, and role-based finance visibility.

## Phase 4 Core Outcome

By the end of Phase 4, Secure Living must have a reliable ledger system for user wallets, property wallets, service wallets, rent ledgers, deposit ledgers, escrow ledgers, reserve ledgers, OPEX ledgers, and platform fee ledgers. All balances must be calculated from posted ledger entries, never manually edited, and every correction must be made through reversal or adjustment entries with audit reasons.

## Non-Negotiable Financial Rules

Every transaction must be linked to the correct organisation, property, user, wallet, ledger, and reference record where applicable. No financial entry should exist as an orphan. Transactions must be append-only, posted through a controlled service layer, protected by idempotency keys, and impossible to update or delete through normal application APIs.

## Trust Accounting Principle

Secure Living’s escrow concept is a trust-account-backed wallet system. The platform must behave as a neutral financial facilitator that holds funds, rights, reserves, and liabilities until predefined conditions are met. Phase 4 focuses on the ledger foundation; later phases can add deeper escrow state machines, reconciliation automation, rent collection automation, professional milestone payouts, and advanced financing products.

## Required Ledger Types

Create or formalize ledgers for `rent`, `deposit`, `escrow`, `reserve`, `opex`, `service`, `platform_fee`, `payout`, `refund`, `adjustment`, and `clearing`. Each ledger must have an owner context such as landlord, tenant, property, lease, service request, provider, organisation, or platform. This allows the same accounting engine to support rent, deposits, repairs, property purchases, construction milestones, and future capital products.

## Wallet Model

Wallets should represent financial containers for users, properties, services, and the platform. Wallets must support owner type, owner ID, organisation, currency, wallet type, freeze state, and status. A wallet balance should not be stored as a source of truth; the UI may cache or display a derived balance, but the authoritative value must come from summing posted ledger entries.

## Sub-Ledger Model

Sub-ledgers must sit below wallets and identify the exact purpose of funds. For example, a landlord may have a trust wallet with rent, deposit, reserve, and payout sub-ledgers, while a property may have rent receivable, repairs reserve, and utility clearing sub-ledgers. This enables clean segregation of client funds and prevents rent, deposits, service funds, and platform fees from being mixed.

## Immutable Transaction Journal

Implement a transaction journal that records each financial event once. A journal transaction should include organisation, property, unit, lease, service request, payer, payee, amount, currency, transaction type, payment method, status, idempotency key, external reference, metadata, created by, approved by, and reason. After posting, the core transaction payload must be locked.

## Double-Entry Posting

Every posted transaction must create balanced debit and credit ledger lines. The sum of all debit lines must equal the sum of all credit lines for the same journal transaction. Single-sided ledger entries should be disallowed except for migration import records that are explicitly marked as opening balances and approved by an administrator.

## Derived Balances

Wallet, ledger, property, landlord, tenant, service, and platform balances must be derived from ledger lines. If performance requires cached balance tables, they must be treated as projections and rebuilt from the journal. The source of truth remains the immutable transaction and ledger-line history.

## Reversals And Corrections

Financial mistakes must never be fixed by editing or deleting transactions. Corrections must use reversal entries, adjustment entries, or refund entries linked to the original transaction. The UI must show the original transaction, the reversal transaction, who authorized it, the reason, and the net effect.

## Idempotency And Duplicate Protection

All money-moving APIs must require idempotency keys for create, payment, receipt, payout, refund, reversal, and adjustment actions. If the same request is submitted twice, the system must return the original response rather than creating duplicate ledger entries. This is critical for M-Pesa, bank callbacks, manual payment recording, and unstable network conditions.

## Freeze And Hold Readiness

Although the full escrow state machine belongs to Phase 5, Phase 4 must prepare wallet and ledger structures for freeze, hold, and dispute behavior. Wallets and sub-ledgers need flags or related hold records so later phases can block payouts without breaking ledger integrity.

## Opening Balances

Imported balances must be handled as controlled opening balance transactions. Each opening balance needs a source file, migration batch ID, importing user, approval user, timestamp, and audit reason. Imported balances should be visible in ledger history so there is no hidden starting point.

## Rent Ledger Foundation

Rent invoices and receipts must post into the ledger instead of remaining only operational records. Invoice creation should create receivable-side accounting where applicable, and payment recording should post cash or clearing entries against tenant and landlord ledgers. The rent collection UI should use ledger-backed status to show paid, partially paid, overdue, and overpaid states.

## Deposit Ledger Foundation

Deposit escrow and landlord reserve models must be represented in sub-ledgers. Model A landlord reserve should record the landlord’s reserve obligation and reserve capture events, while Model B2 deposit escrow should record tenant-funded escrow balances, top-ups, deductions, and refunds. Deposit health should be calculated from ledger-backed values.

## Service Ledger Foundation

Service requests should be ready to hold funds for repairs, inspections, legal work, proxy services, construction tasks, or professional jobs. Phase 4 does not need full milestone payouts, but it must provide ledger categories and references so Phase 8 can release funds to providers based on approval and completion.

## OPEX Reserve Foundation

Create a clear OPEX reserve structure for company funds, platform fees, coordination fees, escrow fees, management fees, and petty cash. Secure Living must be able to separate client trust money from company operating money and prove that separation in reports.

## Platform Fee Structure

Add configurable fee categories such as management fee, escrow fee, coordination fee, listing fee, provider commission, and service fee. Fees should be ledger-posted as separate lines, not silently deducted. Any fee override or reduction must require a reason and appropriate approval.

## Approval Rules For Sensitive Finance Actions

Reversals, fee overrides, opening balances, manual adjustments, and high-value payouts must require role-based approval. Super Admins may oversee the full platform; Admins should handle organisation-level finance actions; landlords should only see and request actions within their own portfolios; tenants should only see their own payment and deposit records.

## Audit Log Requirements

Every financial action must create an immutable audit log entry with timestamp, user ID, role, action, old value if applicable, new value if applicable, reason, authorizing officer, IP/device context where available, and linked resource. Audit logs should be visible to finance and admins, non-editable, and retained for long-term compliance.

## API-First Requirement

All Phase 4 functionality must be available through APIs consumed by the frontend. Required APIs include wallet listing, wallet detail, ledger lines, transaction posting, transaction reversal, transaction detail, derived balance, opening balance import, reconciliation summary, fee configuration, and finance audit logs.

## API Endpoint Plan

Create or harden endpoints under `/api/v1/wallets`, `/api/v1/ledgers`, `/api/v1/transactions`, `/api/v1/accounting`, `/api/v1/reconciliation`, `/api/v1/fees`, and `/api/v1/finance-audit`. Existing wallet and transaction routes should be reviewed and refactored to call a shared posting service instead of writing ledger entries directly.

## Posting Service

Build a backend posting service that is the only allowed path for creating ledger-backed transactions. This service must validate idempotency, check wallet status, check permissions, create the transaction, create balanced ledger lines, create audit logs, return derived balances, and reject any unbalanced or incomplete posting request.

## Database Constraints

Add constraints that support financial integrity: unique idempotency keys, valid positive amounts, required transaction type, required ledger type, required organisation where applicable, required reason for adjustments, and indexes by wallet, sub-ledger, property, lease, tenant, landlord, service request, provider, status, and created date.

## Immutability Enforcement

Application code must not expose update or delete routes for posted transactions or ledger lines. Where database-level protection is feasible, use triggers, restricted permissions, or append-only tables to block mutation. If Prisma constraints make this difficult, enforce immutability through service-layer policy and add tests that prove mutation APIs do not exist.

## Reconciliation Model

Create a reconciliation report that compares ledger totals against expected balances, clearing accounts, external references, and bank or M-Pesa statements when available. Phase 4 should support manual reconciliation and discrepancy tracking; automated bank integration can be expanded later.

## Reconciliation Formula

At minimum, the platform must support checks such as total trust ledger balance equals sum of rent escrow plus deposit escrow plus reserve balances plus clearing balances. Any discrepancy must generate an alert and mark affected payout actions as blocked until reviewed.

## Financial Dashboard Updates

Update the Banking, Transactions, Accounting, and Financial Reports screens to show ledger-backed values. The UI should include wallet accounts, sub-ledger balances, latest ledger activity, transaction details, reversal links, reconciliation status, trust balance, rent received, deposits held, reserves, OPEX, fees, and discrepancy alerts.

## Super Admin Finance UI

Super Admin should see platform-level trust totals, organisation totals, active wallets, frozen wallets, reconciliation status, platform fee income, OPEX reserve, pending approvals, reversal history, and high-risk discrepancies. The UI should be dense, table-oriented, and built for audit review rather than marketing.

## Admin Finance UI

Admin should see organisation-scoped wallets, ledgers, rent movement, deposits, provider payments, service funds, reconciliation issues, and approval tasks. Admins should not see unrelated organisations unless granted global permissions.

## Landlord Finance UI

Landlords should see their property wallets, rent ledger, deposit ledger, reserves, payouts, receipts, fees, deductions, and statements. The UI should make it clear what is held, what is available, what is pending, and what has been paid out.

## Tenant Finance UI

Tenants should see their rent payments, receipts, deposit protection status, top-up requests, refunds, deductions, and wallet-related history only for their own lease. They should not see landlord, provider, platform, or organisation financial records.

## Provider Finance UI

Providers and professionals should see job-related funds, quotes, approved payments, pending payouts, completed work, clawback status when later enabled, and payment history. This prepares the system for milestone payouts in Phase 8.

## Monthly Statements

Generate downloadable monthly statements for landlords and relevant clients. Statements should show opening balance, all ledger-backed transactions, fees, deposits, rent receipts, service costs, reversals, closing balance, and reconciliation status.

## Receipts And Proof

Receipts should be generated from posted ledger transactions, not from standalone UI form data. Each receipt must reference the transaction, invoice, tenant, landlord, property, unit, amount, payment method, date, and balance after payment.

## Data Type Enforcement

Manual finance entry must enforce data types strictly. Amounts must be numeric and positive, dates must be valid dates, references must follow configured patterns, wallet and ledger IDs must come from searchable selectors, and free-text reasons should be required for adjustments.

## Search And Filtering

Finance screens must support search by transaction ID, wallet ID, ledger ID, property code, unit number, tenant name, tenant ID, landlord name, invoice number, receipt number, M-Pesa reference, bank reference, service request ID, status, and date range.

## Notifications

Create notification hooks for payment posted, receipt generated, wallet frozen, reversal requested, reversal approved, discrepancy detected, reconciliation completed, payout blocked, payout released, deposit top-up posted, and monthly statement ready.

## Security Requirements

All finance APIs must enforce authentication, RBAC, organisation scope, branch scope where applicable, and resource ownership. Sensitive financial data must be encrypted in transit and protected at rest according to the project’s security posture. Admin and finance-level actions should be ready for 2FA enforcement.

## Compliance Requirements

Phase 4 should support Kenya Data Protection Act and GDPR-style principles by limiting financial visibility to authorized users, preserving audit trails, recording purpose and reason for sensitive actions, and retaining immutable logs. The design should also remain ready for future SOC 2-style evidence collection.

## AI-Ready Data Requirements

Financial records should be structured, queryable, and machine-readable without exposing private data publicly. Transaction types, ledger types, service references, fee categories, and reconciliation states must use controlled values so future AI tools can summarize portfolio health, detect anomalies, and explain cash movement accurately.

## Taxonomy And Dynamic Configuration

Ledger categories, transaction types, fee categories, statement sections, and reconciliation rules should be configurable where possible. New finance categories should not require schema migrations unless they introduce a new accounting primitive.

## Event Tracking

Emit structured events for finance activity: wallet created, ledger created, transaction posted, reversal posted, fee applied, hold created, hold released, reconciliation run, discrepancy found, statement generated, payout requested, payout approved, payout rejected, and balance projection rebuilt.

## Migration Plan

First, map existing `Wallet`, `LedgerEntry`, `Transaction`, `EscrowAccount`, `RentInvoice`, `RentReceipt`, and `DepositEscrow` data to the Phase 4 ledger structure. Second, create opening balances where needed. Third, backfill references for property, unit, lease, tenant, landlord, and organisation. Fourth, lock new writes behind the posting service.

## Backward Compatibility

Existing dashboard, banking, rent collection, receipt, deposit, and transaction pages should keep working while their data source is hardened. Where older records are missing double-entry lines, show them as imported or legacy records until migration entries normalize them.

## Testing Requirements

Add tests for balanced posting, unbalanced rejection, idempotency replay, reversal creation, mutation prevention, derived balance calculation, organisation scoping, tenant scoping, landlord scoping, reconciliation discrepancy detection, fee posting, and receipt generation from posted transactions.

## Acceptance Criteria

Phase 4 is complete only when ledger math checks out, all posted transactions are immutable, no update or delete path exists for posted finance records, balances are derived from ledger entries, reversal entries are used for corrections, idempotency prevents duplicate posting, and finance dashboards display ledger-backed values.

## Out Of Scope For Phase 4

Do not implement the full escrow state machine, automatic bank reconciliation, professional milestone payout automation, commission clawbacks, financing products, AI anomaly detection, bank API integrations, or multi-country tax automation in this phase. These features must be prepared for architecturally but belong to later phases.

## Relationship To Phase 5

Phase 5 will build the escrow state machine and holds on top of Phase 4. That means Phase 4 must provide accurate wallets, sub-ledgers, posted transaction history, idempotency, and freeze-ready structures so Phase 5 can enforce pending, held, released, disputed, frozen, and reversed states safely.

## Relationship To Later Phases

Phase 6 rent collection will depend on Phase 4 ledgers for payment verification and reconciliation. Phase 8 professional payouts will depend on Phase 4 service ledgers. Phase 9 dashboards will depend on Phase 4 derived financial metrics. Phase 12 AI readiness will depend on Phase 4 structured finance events and clean taxonomies.

## Implementation Order

Start with schema hardening, then build the posting service, then migrate existing records, then update APIs, then update UI, then add reconciliation, then add statements, then add tests and acceptance checks. This order prevents UI work from hiding weak ledger logic.

## Deliverable Checklist

- Wallet model hardened for owner, organisation, type, currency, freeze state, and status.
- Sub-ledger model added or formalized for rent, deposit, escrow, reserve, OPEX, service, fee, payout, refund, adjustment, and clearing.
- Transaction journal hardened as append-only.
- Ledger lines created through double-entry posting only.
- Derived balance API implemented.
- Reversal-only correction workflow implemented.
- Idempotency enforced on money-moving actions.
- Opening balance workflow implemented for migrated finance data.
- Finance audit logs created for all sensitive actions.
- Reconciliation report implemented with discrepancy alerts.
- Banking, Transactions, Accounting, and Financial Reports UI updated to ledger-backed values.
- Role-scoped finance visibility implemented for Super Admin, Admin, Landlord, Tenant, Staff, Agency, and Provider contexts.
- Tests added for double-entry, idempotency, reversal, scoping, and immutability.

## Professional Standard For This Phase

This phase must be implemented with accounting discipline, not as simple CRUD. The system should always be able to answer: whose money is this, why is it here, what condition controls it, who approved the movement, what changed, and how can the balance be independently recalculated from immutable records.

## Client APIs And Credentials Needed

To implement Phase 4 properly, the client must provide confirmed access details for the external systems that will touch money, reconciliation, notifications, documents, and compliance. If any API is not available yet, the development team should implement a clean adapter interface and use sandbox or manual placeholders until the client supplies production access.

## Banking Or Trust Account API

The client needs to provide the banking partner API for the Secure Living trust account, including sandbox credentials, production credentials, account identifiers, statement endpoints, transaction feed endpoints, webhook details if available, reconciliation file format, bank reference format, and any rate limits. This is needed to compare platform ledger balances against actual bank-side movement.

## M-Pesa Daraja API

The client needs to provide M-Pesa Daraja sandbox and production credentials, including consumer key, consumer secret, shortcode, passkey, callback URLs, confirmation URL, validation URL, B2C/B2B permissions if required, STK Push access, C2B payment access, and reversal/refund capabilities. This is required for tenant rent payments, deposit top-ups, receipts, and mobile-money reconciliation.

## Payment Gateway APIs

If Secure Living will support Stripe, PayPal, card payments, remittances, Airtel Money, T-Kash, or any other payment channel, the client must provide sandbox credentials, production credentials, supported currencies, fee schedules, webhook signing secrets, settlement timing, refund rules, and transaction reference formats. These integrations should all plug into the same Phase 4 posting service.

## SMS And Email APIs

The client needs to provide SendGrid, Mandrill, Twilio, Africa's Talking, or equivalent communication API credentials for finance notifications. Required events include payment posted, receipt generated, reversal requested, wallet frozen, reconciliation mismatch, payout blocked, and monthly statement ready.

## PDF Or Document Generation API

If statements and receipts must be generated through a third-party service, the client should provide PDF generation API access, template storage details, branding assets, email delivery requirements, and signature or certificate requirements. If no external provider is supplied, the system can generate PDFs internally.

## KYC Or Identity Verification API

If finance actions require stronger identity controls, the client should provide KYC provider credentials, verification levels, webhook details, user matching rules, document verification API access, and approval callbacks. This is especially important for high-value payouts, landlord onboarding, provider payouts, and admin finance approvals.

## Currency And FX API

If diaspora clients will pay in foreign currencies or view converted balances, the client must provide a currency conversion API, supported currency list, exchange-rate source, update frequency, and rounding policy. Phase 4 can default to KES, but the architecture should be ready for multi-currency ledgers later.

## Accounting Or Export API

If the client uses external accounting tools, they should provide API access or export requirements for QuickBooks, Xero, Zoho Books, Sage, or their preferred accounting system. Required data includes chart of accounts mapping, ledger export format, statement format, tax categories, and sync frequency.

## Webhook And Domain Requirements

The client must provide final production domains, callback URLs, webhook destination rules, SSL expectations, allowed IP lists if any, and who owns DNS configuration. Payment and bank integrations cannot be completed reliably without stable callback URLs.

## API Approval Owner

The client should nominate one approval owner for each integration: banking, M-Pesa, payment gateways, SMS/email, KYC, PDF documents, accounting export, and domain/webhooks. This avoids delays where development is complete but blocked by missing credentials or unapproved production access.
