# What Changed & How to Check It Yourself — Lease Offer & Signing

This covers the feature described in `Update-2.md`: the process from "landlord gives tenant
the requirements" all the way to "tenant signs the lease." Written in plain language — for
each item you'll find **What it does**, **Where to look** (the page link), and **How to
check it** (a simple click-by-click way to see it working).

Log in, then add the page path shown (e.g. `/tenant/lease`) to the end of your site's web
address. Some pages are role-specific (Landlord vs Tenant) — that's noted next to each item.

---

### 1. Landlord sets the application requirements (Landlord/Admin)
**What it does:** The landlord decides what a prospective tenant must submit before being
considered — e.g. Letter of Employment, Business Permit, 6-Month M-Pesa Statement, Letter
of Good Conduct — plus any personal-info questions. This list is fully theirs to define;
every landlord can require something different.
**Where to look:** `/admin/taxonomies`
**How to check:** Add a new requirement, mark it "Required," and choose whether it's a
document upload or a text answer.

### 2. Tenant submits their application (Tenant)
**What it does:** A prospective tenant opens the application form for a specific listing
and sees exactly what that landlord asked for — some fields need a document upload, others
just need an answer. They can't submit until every "Required" item is filled in.
**Where to look:** `/tenant/apply/[listing ID]`
**How to check:** Open the link for any published listing. Try submitting with a required
document missing — the system blocks it and tells you exactly what's missing. Upload the
document and it goes through.

### 3. Landlord reviews the application (Landlord/Admin)
**What it does:** The landlord looks at what the tenant submitted and decides: Shortlist,
Reject, Request More Information, or Accept.
**Where to look:** `/listings/[a listing]` → **Applications** tab
**How to check:** Open the Applications tab on any listing — you'll see every applicant
with these decision buttons.

### 4. Landlord sends the Lease Offer (Landlord/Admin)
**What it does:** Once an applicant is Accepted, the landlord fills in the actual lease
terms — rent, deposit, start/end dates, payment frequency — and sends it to the tenant.
**The landlord is always the one who writes the lease; the tenant never edits these terms.**
**Where to look:** `/listings/[a listing]` → Applications tab → click **"Send Lease Offer"**
on an Accepted applicant
**How to check:** Accept an application, click "Send Lease Offer," fill in the rent/dates,
and send it. The button then shows "Lease offered" so you know it's out for signature.

### 5. Tenant reviews the offer (Tenant)
**What it does:** The tenant sees a **Lease Offer** card clearly marked "Awaiting Your
Signature," with the full terms laid out, and can review, download, or ask questions
before deciding.
**Where to look:** `/tenant/lease`
**How to check:** Log in as that tenant — the Lease Offer card appears automatically with
buttons: **Review Lease**, **Download Draft**, **Ask Questions**, **Accept & Sign**,
**Decline**.

### 6. Tenant asks a question before signing (Tenant + Landlord)
**What it does:** If something's unclear, the tenant can ask a question right from the
offer card. The landlord sees it and replies — the tenant sees the answer on the same card.
**Where to look:** Tenant: `/tenant/lease` (Ask Questions button) · Landlord: `/leasing/[the lease]`
(Tenant Questions card)
**How to check:** As the tenant, click "Ask Questions" and send one. Log in as the landlord,
open that lease, and answer it in the Tenant Questions card — the tenant will see your
reply next time they open their Lease Offer.

### 7. Tenant accepts & signs, or declines (Tenant)
**What it does:** Accepting turns the offer into the tenant's real, active lease
immediately. Declining ends it (with an optional reason) — no lease is created.
**Where to look:** `/tenant/lease`
**How to check:** Click "Accept & Sign" on a Lease Offer — it instantly becomes your
"Current Lease" card with status **Active**. (To test Decline instead, send a fresh offer
and click Decline — it won't become an active lease.)

### 8. Current Lease card (Tenant)
**What it does:** Once signed, the tenant sees their lease details (Property, Unit, Rent,
Deposit, Start, End) and can View Lease, Download Lease, View Payment Schedule, Request
Renewal, or Report an Issue.
**Where to look:** `/tenant/lease`
**How to check:** All five buttons are on the Current Lease card. "View Payment Schedule"
opens a table of rent invoices and due dates; "Report Issue" opens the Service Requests
page.

### 9. Tenant requests a renewal (Tenant → Landlord)
**What it does:** The tenant can ask to renew — this is only a request. The landlord still
prepares and sends the actual renewal terms; the tenant never authors it themselves.
**Where to look:** Tenant: `/tenant/lease` ("Request Renewal" button) · Landlord:
`/leasing/[the lease]` (shows a banner once requested)
**How to check:** Click "Request Renewal" as the tenant — the button changes to "Renewal
Requested." The landlord will see an amber banner on that lease's detail page.

---

## Why It Works This Way

This mirrors how renting actually works in Kenya: the landlord (or their agent) decides the
requirements, reviews who applies, and writes the lease. The tenant's role is to submit
what's asked, then read, question, and either accept or decline what's offered — never to
write or edit the lease themselves. Every button in the tenant's portal reflects that: there
is no "edit terms" option anywhere on the tenant side, only respond.

## If Something Looks Wrong

If a landlord doesn't see "Send Lease Offer," make sure the application status is
**Accepted** first (Shortlist → Accept). If a tenant doesn't see a Lease Offer or Current
Lease card, confirm a lease was actually sent to their account, then try logging out and
back in to refresh their access.
