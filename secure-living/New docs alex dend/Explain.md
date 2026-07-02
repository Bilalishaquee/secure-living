# What Changed & How to Check It Yourself

This is a plain-language guide to everything that was built. For each item you'll find:
- **What it does** — in normal words, no tech jargon
- **Where to look** — the exact page/link in the app
- **How to check it** — a simple click-by-click way to see it working

Log in at the app, then just add the page path shown (e.g. `/dashboard`) to the end of your site's web address. Some pages are only visible to certain roles (Landlord, Admin, Super Admin, Tenant, Manager) — that's noted next to each item.

---

## Part 1 — Move-In/Move-Out Inspection & Deposit Deduction System

### 1. Inspection checklist templates (Landlord/Admin)
**What it does:** You can build a reusable move-in/move-out checklist (Area, Item, Quantity) and even add your own extra columns like "Photo Evidence," "Tenant Initials," "Contractor Quote," etc. — no limit on what you add.
**Where to look:** `/checklists`
**How to check:** Click "New Template" or "Use Preset." Open a template and look for the "Custom Columns" section — click the quick-add buttons (Photo Evidence, Inspector Notes, etc.) or type your own column name.

### 2. Filling out a move-in/move-out checklist (Tenant/Inspector)
**What it does:** When a tenant moves in or out, someone fills in the condition of every item (Good, Damaged, Missing, etc.), attaches photos, and the system automatically flags anything that looks like it changed for the worse.
**Where to look:** `/tenant/checklist`
**How to check:** Open any checklist, change an item's "Status Out" to "Damaged" or "Missing" — you'll see a colored "Flag" badge appear (e.g. "POTENTIAL DEDUCTION") automatically, without anyone deciding it manually.

### 3. Deposit deduction workflow with evidence rules (Landlord/Manager)
**What it does:** When a landlord logs a move-out inspection with damage, missing items, cleaning charges, or unpaid utility bills, the system now **requires proof** before it lets you charge the tenant — e.g. a damage charge needs a "before" and "after" photo, a cleaning charge needs an inspector's note. You can't skip this.
**Where to look:** `/vacating` → click any tenant's move-out record → "Complete Inspection"
**How to check:** Try adding a "Property Damage" deduction without a before/after photo — the system will block it and tell you exactly what's missing. Fill in the photos and it will go through.

### 4. Tenant Accept / Dispute on each charge (Tenant)
**What it does:** Once a landlord proposes a deduction, the tenant can Accept it or Dispute it (with a reason) before any money changes hands. If disputed, the landlord can add more evidence and resend it for review.
**Where to look:** `/vacating/[the move-out record]` (tenant view shows Accept/Dispute buttons; landlord view shows an "Add Evidence" button on disputed items)
**How to check:** Log in as the tenant on a lease with a pending deduction — you'll see Accept and Dispute buttons next to each charge.

### 5. Automatic deposit refund calculation (Landlord/Tenant)
**What it does:** The system automatically works out: Deposit Held − Total Deductions = Refund Due, and shows a clean summary — no manual math.
**Where to look:** `/tenant/checklist` (click "Run" next to "Deposit reconciliation") or `/vacating/[id]` (Deposit Refund card)
**How to check:** Look at the "Deposit Reconciliation Report" card — it shows Deposit Held, each deduction, the total, and the refund figure.

---

## Part 2 — Platform-Wide Updates

### 6. Listing custom attributes (Landlord)
**What it does:** A property listing no longer only has "Pets" and "Furniture" — you can add unlimited custom features (e.g. "Borehole water," "Solar backup," "Gated community").
**Where to look:** `/listings/[a listing]`
**How to check:** Open the edit form, find "Custom Attributes," and add a label + value — it appears on the listing page.

### 7. Listing photos + paid contact reveal (Landlord/Public)
**What it does:** Listings can now have photos. The landlord/agent's phone number is hidden until someone pays a small unlock fee — which the admin can now change per listing instead of it being a fixed KES 50.
**Where to look:** `/listings/[a listing]`
**How to check:** Open a listing — you'll see a photo gallery section and a "Contact unlock fee" field you can edit.

### 8. Screening decision workflow (Landlord/Agency/Admin)
**What it does:** After a rental applicant is screened, the responsible person can now click Approve, Reject, or "Request More Information" — and the system remembers who decided and when.
**Where to look:** `/listings/[a listing]` → Applications tab
**How to check:** Open an application with a screening report attached — you'll see the three decision buttons.

### 9. Dispute resolution — Approve / Decline / Other (Admin)
**What it does:** Instead of one vague "Resolve" button, disputes now have three clear outcomes, and only authorized staff can finalize a decision.
**Where to look:** `/admin/disputes`
**How to check:** Open a dispute — you'll see three distinct buttons: Approve, Decline, Other Resolution, each asking for a note.

### 10. Admin service restrictions (Admin/Super Admin)
**What it does:** An admin can block a specific user or organization from offering or requesting certain marketplace services (e.g. stop a provider from offering "Legal Advisory" if they aren't vetted for it).
**Where to look:** `/admin/service-restrictions`
**How to check:** Add a restriction for a service type — providers/tenants affected will no longer be able to use that service.

### 11. Sign-up with role selection, including Agency (Everyone)
**What it does:** When someone signs up, they now pick their role first — Landlord, Tenant, Staff, or the newly added **Agency** — instead of one generic signup form.
**Where to look:** `/auth/register`
**How to check:** Open the signup page — you'll see role cards to choose from, including "Agency."

### 12. Team management with custom roles (Landlord/Admin)
**What it does:** You can create brand-new team roles (not just the built-in ones) with your own permission set, and then invite people directly into that custom role.
**Where to look:** `/admin/rbac` (create the role) then `/team` (invite someone into it)
**How to check:** In Roles & Permissions, click "Create Role," name it, and toggle some permissions. Then go to Team, click "Invite," and your new role appears in the dropdown.

### 13. Tenants cannot create leases (built-in, no page to check)
**What it does:** Only landlords/agencies/managers can create a lease — tenants cannot create their own lease record. This was already safely restricted; we double-checked it holds.

### 14. Verification badge on profiles (Everyone)
**What it does:** Every profile now shows a small badge indicating KYC verification status and compliance number, so you can tell at a glance if someone is verified.
**Where to look:** `/settings` (your own profile) or `/tenants/[a tenant]`
**How to check:** Open a profile page — look for the verification badge near the top.

### 15. Feature flags (Super Admin)
**What it does:** The Super Admin can turn entire features on/off platform-wide or per organization (e.g. temporarily hide the QR Access module).
**Where to look:** `/admin/feature-flags`
**How to check:** Toggle "QR Access Module" off, then check the sidebar — the QR Access menu disappears.

### 16. Organization approval workflow for agencies (Super Admin)
**What it does:** A landlord's own organization is created instantly (low risk). An **Agency** (who manages other people's properties) instead goes into a "Pending Review" queue that a Super Admin must approve first.
**Where to look:** `/admin/organizations`
**How to check:** Sign up as an "Agency" — their organization will show status "Pending Review" here until a Super Admin clicks Approve.

### 17. KYC review queue (Admin/Super Admin)
**What it does:** Admins now have a dedicated screen to review submitted ID/verification documents and approve or reject them with a reason — instead of just a self-service upload page.
**Where to look:** `/admin/kyc`
**How to check:** Open the page — you'll see a queue of pending documents with Approve/Reject buttons.

### 18. Service modes locked to Super Admin
**What it does:** Only the Super Admin can change platform-wide service settings — landlords/admins can no longer accidentally alter them.
**Where to look:** `/admin/taxonomies` (only visible/editable as Super Admin now)

### 19. Management takeover as a request, not an instant switch (Landlord/Super Admin)
**What it does:** When a self-managed landlord clicks "Need Management Assistance?", it no longer instantly switches their account — it creates a request that a Super Admin reviews and either invites them to accept, or activates directly.
**Where to look:** `/properties/[a self-managed property]` (click the button) then `/admin/management-inquiries` (admin queue)
**How to check:** Click the button on a self-managed property — it now shows "Request Sent" instead of instantly changing anything. Check the admin queue to see it waiting for review.

### 20. Tenant ↔ Unit ↔ Property navigation fixed (Landlord/Manager)
**What it does:** Clicking a tenant now takes you straight to their specific unit (not the whole property's unit list). Clicking a property shows all its units with the tenant's name on each one. Clicking a unit shows that tenant's full history, current issues, and leases.
**Where to look:** `/tenants` → click any tenant, or `/properties/[a property]` → click a unit
**How to check:** From Tenants, click "Unit" next to any tenant — you land directly on their unit page, not a full property list.

### 21. Compliance numbers for properties, agents & users (Admin)
**What it does:** Not just tenants — properties, agents, and general users can now get their own auto-generated compliance number (like a "license plate" proving they're verified), and one person keeps the same number even if they hold multiple roles.
**Where to look:** wherever a compliance number badge shows (see item 14) and `/admin/organizations`

### 22. Biometric door-lock linking (Landlord/Admin)
**What it does:** Properties that use biometric door access can now record which device/provider they use, so staff know biometric access applies there.
**Where to look:** `/properties/[a property]` → edit property
**How to check:** Look for "Biometric Access" fields in the edit form.

### 23. Post-migration record linking (Landlord)
**What it does:** After importing old tenant/unit data, the landlord can manually match each imported record to the correct real unit in the new system.
**Where to look:** `/data-import`
**How to check:** Look for the "Link Imported Records" card — it lists unmatched legacy records you can connect to a real unit.

### 24. New restricted staff roles + visitor plate numbers (Landlord/Admin)
**What it does:** You can now invite a "Short Stay Attendant" or "Security/Gate Officer" — both can only see visitor check-in data, nothing about tenants or finances. The visitor log also now records car/motorbike plate numbers.
**Where to look:** `/team` (invite) and `/visitors` (plate number field)

### 25. Single-property dashboard (Landlord/Manager)
**What it does:** Each property now has its own mini-dashboard (occupancy, rent collection, arrears, open issues) — the same kind of overview as the main dashboard, just scoped to one property.
**Where to look:** `/properties/[a property]`
**How to check:** Scroll down on a property page — you'll see a "Property Dashboard" section with stat cards.

### 26. Global search everywhere (Everyone)
**What it does:** Every dashboard now has a working search bar in the top bar, so you can find tenants, properties, or units by name/ID from any page.
**Where to look:** Top bar on any authenticated page

### 27. Visitor ban/blacklist with Super Admin override (Landlord/Super Admin)
**What it does:** Landlords/staff can blacklist a problem visitor (with a reason). Only the Super Admin can remove a blacklist entry (whitelist it) — landlords cannot un-blacklist someone themselves.
**Where to look:** `/visitors`
**How to check:** Blacklist a visitor as a landlord — then try to remove it (blocked unless you're Super Admin).

### 28. Super Admin Dashboard (Super Admin)
**What it does:** A brand-new dashboard just for Super Admins with: total organizations, active landlords, active property managers, active providers, an aggregate view of ALL service requests (Open/In Progress/Awaiting/Overdue counts — not a personal ticket list), plus 9 sections: Platform Overview, Revenue & Finance, Platform Health, Intelligence Centre, Operations Command Centre, Marketplace Performance, Growth & Acquisition, Alerts & Live Activity, and duty/manager assignment controls.
**Where to look:** `/admin/dashboard`
**How to check:** Log in as Super Admin and open this page — you'll see the stat cards at the top and tabs for each of the 9 sections.

### 29. Listing withdraw/republish/edit (Landlord) — already working, re-confirmed
**What it does:** A withdrawn listing can be edited and republished, not just left dead.
**Where to look:** `/listings/[a listing]`

### 30. Support module fully restructured (Admin/Manager)
**What it does:** "Support Tickets" is now split into three clear areas so nothing gets mixed up: **Support Tickets** (platform/technical issues), **Service Enquiries** (marketplace service requests, with their own quote → accept → complete workflow), and **Contact Requests** (general website enquiries). Incoming messages are automatically sorted into the right one. Tenants don't see this admin view at all — they use "My Requests" instead. Property Managers only see items tied to their own assigned properties.
**Where to look:** `/admin/support`
**How to check:** Open the page and switch between the three tabs — each has its own status workflow and fields.

### 31. Application form presets (Landlord/Admin)
**What it does:** Instead of building a rental application form from scratch every time, you can start from a preset (Standard Residential, Furnished Short-Term, Commercial) and edit from there.
**Where to look:** `/admin/taxonomies`
**How to check:** Look for "Use Preset" when setting up application custom fields.

### 32. Price packages — 4 tiers, admin-editable (Super Admin)
**What it does:** There are now at least 4 real subscription packages (Free, Self-Management, Professional Management, Enterprise), and an admin can edit prices or add more at any time — no price is locked in permanently.
**Where to look:** `/commercial-readiness`
**How to check:** You'll see 4 packages listed with editable prices, plus an "Add Plan" option.

### 33. Exact arrears figures + tenant report export (Landlord/Manager)
**What it does:** The Tenants list now shows the real outstanding arrears amount (calculated from actual unpaid rent invoices, not a guess), and you can generate a downloadable report for one tenant or all of them.
**Where to look:** `/tenants`
**How to check:** Look at the "Status" column — an "Arrears" tenant shows the exact KES figure. Click "Report" on any row, or "Generate Report" at the top, to download a CSV.

### 34. Data integrity fixes (Landlord/Admin)
**What it does:** Phone numbers on visitors, property codes, and provider user IDs are now enforced as unique — the system will reject a duplicate and tell you clearly, instead of silently causing confusion later.
**Where to look:** `/visitors/logs` (add visitor), `/properties/new` (add property), `/providers` (add provider)

---

## A Note on the Two Open Design Questions

Two things in the original notes were genuinely open questions rather than bugs, so here's the reasoning behind what was built:

- **"How should organizations be added?"** — Landlords creating their own single account stays instant (low risk, they only manage themselves). Agencies — who take on *other people's* properties — now go through a Super Admin approval step first, since a bad-faith agency account carries more risk. See item 16 above.
- **"Screening — who decides, what happens after?"** — Whoever has edit rights on that listing (landlord, their agency, or admin/staff) is the decision-maker, and they now have three clear actions instead of no formal action at all. See item 8 above.

---

## If Something Looks Wrong

Some of these changes (new roles, new permissions) only take effect after you **log out and log back in** — this refreshes your access token. If a button or page doesn't seem to have the described option yet, try that first.
