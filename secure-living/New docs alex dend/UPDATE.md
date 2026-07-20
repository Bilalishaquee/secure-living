SECURE LIVING
Phase 4 — Detailed Implementation Plan
Provider-Agnostic Wallets, Ledgers & Merchant Integration
v5 — adds Guiding Principle
GUIDING PRINCIPLE
Phase 4 establishes Secure Living as a financial platform rather than merely a payment-enabled property management system. Every monetary event — including subscriptions, rent, deposits, escrow, marketplace services, referral rewards, listing credits, verification services, and future financial products — must pass through the same immutable Posting Service and double-entry ledger. This ensures consistency, auditability, scalability, and seamless expansion into new revenue streams without redesigning the financial architecture.

1. Purpose of This Document
This plan turns the Phase 4 Financial Architecture Specification into a build-ready sequence. It defines the payment tools actually available for the pilot, requires a provider-agnostic gateway abstraction so future integrations don't force a redesign, and adds the wallet, merchant management, subscription, marketplace, referral, and listing-credit detail that the original spec left implicit.
2. Current Status
The Phase 4 pilot will proceed using available integrations. Safaricom Daraja credentials are being provisioned and are not yet in hand. Other third-party integrations — Intersend, Stripe, QuickBooks, Xero, and advanced KYC providers — are deferred until later phases: Intersend cannot be integrated until the production website is live, and Stripe is planned for a much later stage.
The financial architecture must therefore be implemented in a provider-agnostic manner so these services can be connected later without redesigning the finance module. Development is not blocked on this: schema hardening and the Posting Service (Milestones 1–2) proceed independently of any credential.
3. Payment Tools — Confirmed Scope
Daraja is the only live payment integration for the pilot. Every other gateway is a future integration, designed for but not built.
Tool
Role
Status
Safaricom Daraja API
Primary — and for the pilot, only — live payment rail (STK Push / PayBill collection)
IN PROGRESS — credentials being provisioned
Intersend
Alternate local payment aggregator
FUTURE — blocked until production website is live
Stripe
International / diaspora card payments
FUTURE — later stage
PayPal
International payments
FUTURE
Airtel Money / T-Kash
Secondary local mobile money rails
FUTURE
QuickBooks / Xero
Accounting export integration
FUTURE
4. Payment Gateway Adapter
Rather than coding directly against Daraja, the finance module requires a gateway abstraction. Every payment request — inbound or outbound — passes through a single Payment Gateway Interface; each provider is a swappable adapter behind it.
Payment Gateway Interface
↓
Daraja Adapter (Pilot — live)
↓
Intersend Adapter (Future)
↓
Stripe Adapter (Future)
↓
PayPal Adapter (Future)

Practically: the Posting Service, wallet logic, and reconciliation engine never reference "Daraja" directly — they call the interface. Adding a new provider later means writing a new adapter, not touching ledger logic.
5. Merchant Management
Missing from the original spec entirely. Super Admin needs a Financial Configuration module for managing merchant providers as data, not hard-coded integrations.
Provider
Configurable Fields
Daraja
Status, Sandbox/Production mode, Webhook URL, Default currency, Settlement Account, Settlement Currency, Settlement Method, Enable/Disable
Intersend
Status (Disabled), same fields once activated
Stripe
Status (Disabled), same fields once activated
Future adapters
Same schema — new row, no code change to ledger

Settlement Account, Settlement Currency, and Settlement Method are included from day one even though the pilot only settles through one account — reconfiguring settlement routing later without this field would require a schema change, not just a config update.
The finance module should never assume only one gateway exists — even during the pilot, with only Daraja live, the Merchant Providers table should already model multiple providers so enabling the next one is a configuration change, not a development task.
6. Wallet Architecture
Seven wallet types, each with a distinct purpose:
Wallet
Holds
Platform Wallet
Subscription revenue, marketplace commissions, listing revenue, verification revenue
Organisation Wallet
Rent income, deposits, owner reserves
Tenant Wallet
Refunds, credits, wallet balance
Provider Wallet
Service earnings, pending payouts
Escrow Wallet
Funds awaiting release (marketplace jobs, conditional payments)
Trust Wallet
Holds all client funds — the pooled account reconciliation is measured against
Referral Wallet
Temporary holding account for referral rewards before redemption — keeps referral credits from mixing with subscription revenue
7. Wallet-to-Merchant Mapping (via Gateway Adapter)
7.1 Inbound flow (collection)
	•	Payer initiates payment through whichever adapter is active (Daraja for the pilot).
	•	Adapter normalises the provider's callback into a standard internal event and forwards it to the webhook handler.
	•	Handler validates signature and idempotency key before touching the ledger — this check is identical regardless of which adapter fired it.
	•	Posting Service creates a balanced transaction: debit Clearing, credit the relevant sub-ledger (Rent, Deposit, Service, Subscription) under the payer's wallet.
	•	Funds move from Clearing into the correct wallet (Tenant → Organisation pending, or Escrow).
	•	Duplicate callbacks return the original transaction response — no new ledger lines are created, regardless of provider.
7.2 Outbound flow (payout)
	•	A payout is requested against a wallet (organisation payout, provider payout, tenant refund).
	•	Request passes role-based approval per the Phase 4 spec's approval thresholds (Super Admin, Admin, Landlord, Tenant scopes).
	•	Banking Adapter reads the organisation's configured settlement profile (Section 14 — Payout Settings) to determine destination and method.
	•	Approved request calls the active banking adapter's disbursement endpoint with an idempotency key (see Section 13 — banking layer is configurable and optional for the pilot).
	•	Posting Service creates the balanced entry: debit the source wallet/sub-ledger, credit Payout.
	•	Confirmation callback marks the transaction as settled; failure triggers an automatic reversal entry, never a manual edit.
8. Subscription Payments
Subscriptions are part of the pilot per the Commercial Readiness (Piloting Addition) document. The payment flow below connects that module to the ledger:
Organisation
↓
Subscription Selected
↓
Daraja Payment
↓
Posting Service
↓
Platform Wallet
↓
Subscription Activated
↓
Invoice Generated

This uses the same Posting Service and idempotency rules as any other transaction — subscription billing is not a parallel system.
9. Marketplace Payments
As Secure Living becomes a full property ecosystem, marketplace payments (service provider jobs, professional services) need to be documented now, even though volume will be low during the pilot. Commission is deducted after successful completion, not before:
Customer
↓
Marketplace Service
↓
Daraja
↓
Escrow Wallet
↓
Service Completed
↓
Platform Commission
↓
Provider Wallet
↓
Provider Payout
10. Referral Rewards
The Commercial Readiness document already includes Referral Management, even though cash payouts are disabled for the pilot. Phase 4 must still prepare the finance layer for referrals so the ledger supports referral credits from day one.
10.1 Supported reward types
	•	Listing Credits
	•	Subscription Discounts
	•	Wallet Credits (future)
	•	Cash Rewards (future)
10.2 Flow
Referral Completed
↓
Reward Engine
↓
Platform Wallet
↓
Referral Ledger
↓
Credit Applied

Even with cash payouts disabled, the Referral Wallet (Section 6) and Referral Ledger must exist and post correctly through the standard Posting Service — enabling cash rewards later should be a configuration change, not new ledger logic.
11. Listing Credits
The pricing model introduced listing capacity and paid listing upgrades, so the finance module must support listing credits as a ledger account — not necessarily a separate wallet, but a tracked balance with its own transaction types:
	•	Purchase Listing Credits
	•	Consume Listing Credits
	•	Refund Listing Credits (future)

Listing credit purchases post through the Posting Service exactly like any other transaction (debit Clearing, credit Platform Wallet), with consumption tracked as a separate ledger movement against the organisation's listing credit balance.
12. Revenue Sources
12.1 Current pilot
	•	Subscription plans
	•	Listing upgrades
	•	Marketplace commissions
	•	QR Listing Unlock Fees (KES 50 / 100)
	•	Verification services
	•	Due diligence
	•	Property valuation
	•	Legal advisory
	•	Compliance services
12.2 Future
	•	Advertising
	•	Featured listings
	•	Insurance commissions
	•	API access
	•	Financial services

QR Listing Unlock Fees are now part of the business model and must be represented in Phase 4 as a Platform Wallet revenue line, posted through the same Daraja adapter as any other small-value collection.
13. Supported Banking API
The original plan assumed Equity Jenga API was already confirmed for outbound payouts. Unless Equity Bank is a committed decision, the platform should not be locked into one banking provider.
The banking layer shall support a configurable bank integration. The pilot may use Equity Jenga API if available. The architecture must allow future support for other Kenyan banking APIs without changes to the ledger model — the same adapter pattern used for payment gateways in Section 4 applies here.
Banking integrations are optional for the pilot. The pilot can launch using Daraja only for both collection and, where possible, disbursement; a dedicated banking adapter is not a hard prerequisite for go-live.
Future banking adapters to design for:
	•	Equity
	•	KCB
	•	Co-op
	•	NCBA
14. Organisation / Landlord Payout Settings
Added explicitly to scope before development starts: the Banking Adapter architecture (Sections 4 and 13) only works end-to-end if each organisation/landlord can choose how they get paid. Without this screen, payout routing has no source to read from.
Add an Organisation/Landlord "Payout Settings" screen to select a preferred settlement method and store the corresponding details, which the Banking Adapter reads during outbound payout processing.
14.1 Supported settlement methods (pilot)
	•	M-Pesa (payout to registered phone number, via Daraja B2C)
	•	Bank Transfer (account number, bank name, branch — routed through whichever banking adapter is active, or held pending if none is enabled)
	•	eWallet (future — placeholder method, disabled until an eWallet adapter exists)
14.2 Behaviour
	•	Landlord selects a preferred method and enters the required details once; the record is stored against the Organisation Wallet, not against individual transactions.
	•	Sensitive details (bank account numbers, M-Pesa registration) are stored encrypted at rest and are never exposed in plaintext to the ledger, audit log, or reporting layer — the Posting Service references a settlement profile ID, not raw credentials.
	•	When a payout is approved (Section 7.2, step 3), the Banking Adapter reads the organisation's active settlement profile to determine which adapter and destination to use — no payout is processed without a configured profile.
	•	If no settlement method is configured, payouts queue in a "Pending Settlement Setup" state rather than failing silently; the landlord is notified via the Communication Integrations layer (Section 15) to complete setup.
	•	Switching settlement methods does not alter historical ledger entries — only future payouts route through the newly selected method.

This closes the loop between the provider-agnostic adapter architecture and the actual landlord experience: landlords choose how they get paid, and the ledger stays untouched by which method they picked.
15. Communication Integrations
Phase 4 has focused on money, but receipts and payment notifications are part of the payment lifecycle and belong in this plan, even as lightweight integrations.
Timeline
Providers
Pilot
Brevo, Africa's Talking
Future
WhatsApp Business, Push Notifications

Every payment confirmation, receipt, and reversal/adjustment notice (Section 6.6 of the base spec) routes through these providers — the Posting Service should trigger notifications as a side effect of posting, not as a separate manual step.
16. PDF Generation
PDF generation is an internal service, not a third-party dependency. It is used for:
	•	Receipts
	•	Statements
	•	Invoices

Because it is internal, PDF generation is not blocked on any credential and can be built and tested alongside the Posting Service from Milestone 1.
17. Implementation Sequence & Milestones
Milestone
Scope
Exit Criteria
M1 — Schema Hardening
Wallet model (7 wallet types per Section 6), sub-ledger tables incl. Listing Credits and Referral Ledger, transaction journal schema
Schema reviewed and migrated in staging; no orphan-entry paths possible
M2 — Posting Service & PDF Service
Single controlled service for all ledger writes; idempotency + permission validation; internal PDF generation service
Unit tests pass for balanced posting, rejection of unbalanced/duplicate requests; sample receipt PDF generated
M3 — Gateway & Banking Adapters
Payment Gateway Interface + Daraja Adapter (live); stub adapters for Intersend/Stripe/PayPal; optional, configurable Banking API interface
Daraja adapter passes sandbox test; stub adapters registered but disabled
M4 — Merchant Management
Financial Configuration module: Merchant Providers table with status/mode/webhook/currency/settlement account/settlement method/enable-disable
Super Admin can toggle a provider and configure settlement routing without a code deploy
M5 — Data Migration
Migrate existing wallet/transaction/escrow/rent/deposit records into new ledger model; opening balance import workflow
Opening balances reconciled against pre-migration totals; migration fully audit-logged
M6 — Subscription, Marketplace, Referral & Listing Credit Wiring
Wire Subscription (Sec. 8), Marketplace (Sec. 9), Referral Rewards (Sec. 10), and Listing Credits (Sec. 11) flows onto the Posting Service
Subscription activation, a test marketplace job, a referral credit, and a listing credit purchase all post correctly to ledger
M7 — API & UI Updates
Refactor wallet/transaction routes onto Posting Service; ledger-backed Banking, Transactions, Accounting, Reports, and Merchant Providers screens; role-scoped visibility; add Organisation/Landlord "Payout Settings" screen (Section 14) to select preferred settlement method (M-Pesa, Bank Transfer, eWallet) and store credentials, which the Banking Adapter reads during outbound payout processing
No API path writes ledger entries directly; each role sees only their scoped data; a test payout correctly routes through the landlord's selected settlement method
M8 — Communication Layer
Brevo / Africa's Talking wired to Posting Service events (confirmations, receipts, reversal notices)
Test payment triggers SMS/email notification automatically
M9 — Reconciliation
Reconciliation report vs. bank/Daraja references; discrepancy alerting; payout blocking on mismatch
Test discrepancy correctly blocks payout and raises alert
M10 — Tests & Acceptance
Double-entry, idempotency, reversal, scoping, and immutability test suite across all ledger types including referral and listing credits
All acceptance checks in Section 21 pass in staging
18. Roles, Approvals & Visibility
Role
Visibility
Super Admin
Platform-wide trust totals, reconciliation status, reversal history, high-risk discrepancies, Merchant Providers configuration
Admin
Organisation-scoped wallets, ledgers, approvals
Landlord / Organisation
Own property wallets, rent/deposit ledgers, payouts, statements, listing credit balance
Tenant
Own rent payments, receipts, deposit status, refunds
Provider
Job-related funds, approved payments, pending payouts
19. Non-Negotiable Rules (Reaffirmed)
	•	Every transaction links to organisation, property, user, wallet, ledger, and reference record — no orphan entries.
	•	Transactions are append-only, posted only through the Posting Service.
	•	All money-moving actions require idempotency keys, enforced at the adapter boundary regardless of provider.
	•	No application API may update or delete a posted transaction or ledger line — corrections are reversal/adjustment entries only.
	•	No ledger, wallet, or reconciliation logic may reference a specific provider (Daraja, Equity, etc.) by name — only through the adapter interface.
	•	The ledger remains the single source of truth. External payment providers, banks, and merchants are transport layers only and must never be treated as accounting records.
20. Future Integrations
Designed for, not built, in this phase:
	•	Intersend
	•	Stripe
	•	PayPal
	•	Airtel Money
	•	T-Kash
	•	QuickBooks
	•	Xero
	•	Smile ID
	•	Sumsub
	•	Equity / KCB / Co-op / NCBA banking adapters
	•	WhatsApp Business / Push Notifications
	•	Multi-currency wallets
	•	International settlements
	•	Referral cash payouts
21. Acceptance Checklist
	•	Wallet model implements all seven wallet types (Platform, Organisation, Tenant, Provider, Escrow, Trust, Referral).
	•	Payment Gateway Interface exists and Daraja Adapter is the only enabled adapter; stub adapters registered for future providers.
	•	Merchant Providers configuration screen includes settlement account, currency, and method fields.
	•	Banking API is configurable and optional — pilot functions with Daraja only.
	•	Double-entry posting verified — every transaction has balanced debit/credit lines.
	•	Idempotency confirmed on Daraja callback replay tests.
	•	Reversal-only correction flow tested — no direct edits possible at the database or API layer.
	•	Subscription activation, marketplace job, referral credit, and listing credit purchase all trace correctly through the Posting Service.
	•	Referral Ledger and Referral Wallet support Listing Credit and Subscription Discount rewards; cash rewards remain disabled but structurally supported.
	•	Reconciliation report correctly flags and blocks payouts on discrepancy.
	•	Role-based visibility confirmed for all roles, including Super Admin's Merchant Providers access.
	•	Payment confirmations trigger notifications via Brevo/Africa's Talking automatically.
	•	Organisation/Landlord Payout Settings screen allows selection of M-Pesa, Bank Transfer, or eWallet, with credentials stored encrypted and referenced only by settlement profile ID.
	•	A payout with no configured settlement profile queues as "Pending Settlement Setup" rather than failing silently, and triggers a landlord notification.
22. Immediate Next Steps
	•	Confirm this v3 scope (Daraja-only pilot, adapter architecture, referral/listing credit support, optional banking) — sign-off before M3.
	•	Development begins M1 (Schema Hardening) and M2 (Posting Service & PDF Service) immediately — not blocked by Daraja credentials.
	•	Daraja credentials handed off as soon as provisioning completes; M3 (adapters) starts as soon as sandbox keys are confirmed.
	•	Weekly milestone check-ins against Section 17 through to M10 sign-off.
