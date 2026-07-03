# Demo Entries Created — Secure Living

> Organisation: **Mwakaba Properties** (`org1`) / Branch: **Nairobi HQ** (`b1`)
> Seeded: 2026-06-16
> Base script:     `Secure-Living-Backend/prisma/demo-seed.js`
> Extended script: `Secure-Living-Backend/prisma/demo-seed-extended.js`
> Run command: `node prisma/demo-seed.js && node prisma/demo-seed-extended.js` (from `Secure-Living-Backend/`)

---

## Login Credentials

| Role            | Email                         | Password    |
|-----------------|-------------------------------|-------------|
| Admin (existing)| admin@secureliving.com        | (unchanged) |
| Tenant          | grace.muthoni@demo.ke         | Demo@1234   |
| Tenant          | james.kariuki@demo.ke         | Demo@1234   |
| Tenant          | amina.hassan@demo.ke          | Demo@1234   |
| Tenant          | kevin.waweru@demo.ke          | Demo@1234   |
| Tenant          | faith.ndungu@demo.ke          | Demo@1234   |
| Staff           | samuel.otieno@demo.ke         | Demo@1234   |
| Provider        | peter.njoroge@demo.ke         | Demo@1234   |
| Provider        | diana.weru@demo.ke            | Demo@1234   |
| Landlord        | david.mutua@demo.ke           | Demo@1234   |

---

## Users Created

### Original Users (base seed)

| Name              | ID                                       | Role     | Phone          | Verification         |
|-------------------|------------------------------------------|----------|----------------|----------------------|
| Grace Muthoni     | `a8131360-d3ac-439c-bf47-445558a0a661`   | tenant   | +254712001001  | IDENTITY_VERIFIED    |
| James Kariuki     | `18012ec4-6907-4c5a-a95a-619023b0aa83`   | tenant   | +254712002002  | UNVERIFIED           |
| Samuel Otieno     | `ae65d250-22a2-40e3-b642-4666233397a4`   | staff    | +254712003003  | UNVERIFIED           |
| Peter Njoroge     | `7b4468ac-0352-47c3-a8a1-48aa737d6f81`   | provider | +254722100200  | IDENTITY_VERIFIED    |
| Diana Weru        | `5c51952e-fe95-4c94-ad4e-ee98c64b5fe4`   | provider | +254722300400  | IDENTITY_VERIFIED    |

### Extended Users

| Name              | ID                                       | Role     | Phone          | Verification         |
|-------------------|------------------------------------------|----------|----------------|----------------------|
| David Mutua       | `1f907f24-e51d-49be-91d5-5128ce846761`   | landlord | +254733001001  | TRUSTED_PERSONNEL    |
| Amina Hassan      | `1d1afe35-4595-434a-81ed-84500a94f7d1`   | tenant   | +254733002002  | IDENTITY_VERIFIED    |
| Kevin Waweru      | `43600857-cd8a-465e-a01b-921b989fbb97`   | tenant   | +254733003003  | UNVERIFIED           |
| Faith Ndungu      | `9454fe95-5f03-4970-a1cc-d5183f89eba6`   | tenant   | +254733004004  | IDENTITY_VERIFIED    |
| Mike Kamau        | `6c879321-7480-4459-9113-c6f0c2c11ac4`   | -        | +254733005005  | UNVERIFIED           |

---

## Dashboard

7 widgets configured for the admin user:

| Widget Type        | Label                    | Position |
|--------------------|--------------------------|----------|
| occupancy_rate     | Occupancy Rate           | 0        |
| rent_collected     | Rent Collected (Jun)     | 1        |
| open_tickets       | Open Service Requests    | 2        |
| lease_renewals     | Upcoming Lease Renewals  | 3        |
| vacancy_units      | Vacant Units             | 4        |
| revenue_trend      | Revenue Trend            | 5        |
| expense_breakdown  | Expense Breakdown        | 6        |

> Navigate to: **Dashboard** — widgets are visible for the admin role.

---

## CRM (Rental Applications)

| # | Applicant     | Listing      | Status       | Notes                                          |
|---|---------------|--------------|--------------|------------------------------------------------|
| 1 | Kevin Waweru  | 3BR (Unit 201)| REVIEWING   | Software engineer, stable income               |
| 2 | Faith Ndungu  | 3BR (Unit 201)| SHORTLISTED | HR Manager, reviewed by admin                  |
| 3 | Mike Kamau    | 3BR (Unit 201)| PENDING     | Freelancer with M-Pesa income history          |
| 4 | Amina Hassan  | 2BR (Unit 104)| ACCEPTED    | Existing tenant at Karen Residences            |
| 5 | David Mutua   | 2BR (Unit 104)| REJECTED    | Conflict of interest — property owner          |

> Navigate to: **Listings → Applications** — all 5 statuses visible.

---

## Portfolio / Properties

### Property 1 — Westlands Heights

| Field          | Value                                        |
|----------------|----------------------------------------------|
| Name           | Westlands Heights                            |
| ID             | `a889b607-2a79-4590-88ab-1b53a1b311b3`        |
| Type           | Apartment Block                              |
| Address        | 14 Westlands Road, Nairobi, Kenya            |
| Total Units    | 6                                            |
| Owner          | Admin (Mwakaba Properties)                   |
| Status         | active                                       |

#### Units — Westlands Heights

| Unit | Type       | Beds | Baths | Rent (KES) | Status    | Readiness  | ID                                       |
|------|------------|------|-------|------------|-----------|------------|------------------------------------------|
| 101  | 2-Bedroom  | 2    | 1     | 55,000     | occupied  | READY      | `70b50cc8-867f-4e4b-b14a-bd7fbbcb7801`  |
| 102  | 1-Bedroom  | 1    | 1     | 40,000     | occupied  | READY      | `5d04b3ae-a06f-48a3-99fc-934f02603a24`  |
| 103  | Studio     | 0    | 1     | 28,000     | vacant    | READY      | `5068062b-ec89-4e57-8bbb-3f1997256858`  |
| 104  | 2-Bedroom  | 2    | 2     | 60,000     | vacant    | READY      | `a66f7002-7cc1-4d8a-9e71-5eca6c57df62`  |
| 201  | 3-Bedroom  | 3    | 2     | 85,000     | vacant    | READY      | `bb380369-5539-4a9c-b1e2-162e904055b2`  |
| 202  | Penthouse  | 4    | 3     | 120,000    | reserved  | READY      | `2da8c22b-4b06-413f-b1a8-3a9b77fa1b5f`  |

---

### Property 2 — Karen Residences

| Field          | Value                                        |
|----------------|----------------------------------------------|
| Name           | Karen Residences                             |
| ID             | `4d25e6d6-94af-4cb9-ae9f-fa13bd86b895`        |
| Type           | Townhouse Complex                            |
| Address        | 8 Karen Plains Road, Nairobi, Kenya          |
| Total Units    | 5                                            |
| Owner          | David Mutua                                  |
| Purchase Price | KES 85,000,000                               |
| Current Value  | KES 95,000,000                               |
| Cap Rate       | 6.8%                                         |
| Status         | active                                       |

#### Units — Karen Residences

| Unit  | Type       | Beds | Baths | Rent (KES) | Status    | Readiness          | ID                                       |
|-------|------------|------|-------|------------|-----------|--------------------|------------------------------------------|
| KR-A1 | 1-Bedroom | 1    | 1     | 38,000     | vacant    | READY              | `89122ec8-9eb1-4e30-9d1d-b93aa2aee97a`  |
| KR-A2 | 1-Bedroom | 1    | 1     | 38,000     | occupied  | READY              | `095c5ed2-842c-4871-90bd-ed2294e8a4e4`  |
| KR-A3 | 2-Bedroom | 2    | 1     | 52,000     | occupied  | READY              | `d0f493c5-1277-4f86-bb28-1424073a26a5`  |
| KR-B1 | 2-Bedroom | 2    | 2     | 55,000     | vacant    | PENDING_CLEAN      | `b34b345a-99ec-430d-acff-c9d920fec851`  |
| KR-B2 | 3-Bedroom | 3    | 2     | 75,000     | vacant    | PENDING_INSPECTION | `ece19d9e-4db6-4c87-950a-7e9e6a757e62`  |

### Containers (Portfolio Groups)

| Name                  | Type      | Description                                   | ID                          |
|-----------------------|-----------|-----------------------------------------------|-----------------------------|
| Westlands Complex     | COMPLEX   | Premium apartment block, short-stay enabled   | `cmqgju3jd0001bo4jr7836uts` |
| Karen Gardens Estate  | ESTATE    | Gated townhouse estate, 5 units              | `cmqgju41i0003bo4jxgjtkisw` |
| Kilimani Courtyard    | COURTYARD | Planned courtyard development                 | `cmqgju4jr0005bo4j738yl091` |

> Navigate to: **Portfolio** — 2 properties, 11 units total, 3 portfolio containers.

---

## Tenants

| Tenant          | Email                     | Phone          | Unit   | Property          | Lease Status |
|-----------------|---------------------------|----------------|--------|-------------------|--------------|
| Grace Muthoni   | grace.muthoni@demo.ke     | +254712001001  | 101    | Westlands Heights | active       |
| James Kariuki   | james.kariuki@demo.ke     | +254712002002  | 102    | Westlands Heights | active       |
| Amina Hassan    | amina.hassan@demo.ke      | +254733002002  | KR-A2  | Karen Residences  | active       |
| Kevin Waweru    | kevin.waweru@demo.ke      | +254733003003  | KR-A3  | Karen Residences  | active       |
| Faith Ndungu    | faith.ndungu@demo.ke      | +254733004004  | KR-B1  | Karen Residences  | draft        |

> Navigate to: **Tenants** — 5 tenants visible across 2 properties.

---

## Leases

| # | Tenant        | Unit  | Property          | Type           | Rent (KES) | Deposit (KES) | Period              | Status  | ID                                       |
|---|---------------|-------|-------------------|----------------|------------|---------------|---------------------|---------|------------------------------------------|
| 1 | Grace Muthoni | 101   | Westlands Heights | fixed_term     | 55,000     | 110,000       | Feb 2026 → Feb 2027 | active  | `9959eda3-2a0f-4a8a-88a9-916c438ebc5e`  |
| 2 | James Kariuki | 102   | Westlands Heights | month_to_month | 40,000     | 80,000        | Apr 2026 → Apr 2027 | active  | `2db461b6-ae45-45d7-81d2-ed54db3a6330`  |
| 3 | Grace Muthoni | 104   | Westlands Heights | fixed_term     | 60,000     | 120,000       | Jul 2026 → Jul 2027 | draft   | `45d3e3ef-d159-4e0b-a524-c8de41c406a1`  |
| 4 | Amina Hassan  | KR-A2 | Karen Residences  | fixed_term     | 38,000     | 76,000        | Mar 2026 → Mar 2027 | active  | `e7a284c3-f1f6-4410-9827-211b5cd1c746`  |
| 5 | Kevin Waweru  | KR-A3 | Karen Residences  | month_to_month | 52,000     | 104,000       | May 2026 → May 2027 | active  | `2ab4aa70-9d34-4f39-bb34-1783ae5802bc`  |
| 6 | Faith Ndungu  | KR-B1 | Karen Residences  | fixed_term     | 55,000     | 110,000       | Starts Jun 29 2026  | draft   | `a75f30da-ebc2-400c-8f5c-121398b24593`  |

> Navigate to: **Leases** — 4 active, 2 drafts. Covers both properties.

---

## Lease Templates

| # | Name                                  | Format | Active | Assigned | ID                          |
|---|---------------------------------------|--------|--------|----------|-----------------------------|
| 1 | Standard Residential Tenancy Agreement| PDF    | Yes    | 12       | `cmqgju6j90006bo4jlahc7lx3` |
| 2 | Month-to-Month Tenancy Agreement      | PDF    | Yes    | 5        | `cmqgju7110007bo4j7aipz032` |
| 3 | Short-Stay Accommodation Agreement    | PDF    | Yes    | 8        | `cmqgju7cu0008bo4jvckzbh4c` |
| 4 | Commercial Lease Agreement            | PDF    | No     | 0        | `cmqgju80w0009bo4jty5ku7jy` |
| 5 | Renewal Addendum                      | PDF    | Yes    | 3        | `cmqgju8co000abo4j4161oggw` |

Also from base seed:
| 6 | Standard Tenancy KE 12-Month          | PDF    | Yes    | -        | `cmqgir7z30008bwq7p6qla7ys` |
| 7 | Short-Stay Guest Agreement            | PDF    | Yes    | -        | `cmqgira6x000obwq7njscaixa` |
| 8 | Move-Out Agreement                    | PDF    | Yes    | -        | `cmqgirboy0010bwq7gncam5ai` |

### Document Templates

| # | Name                         | Category   | Jurisdiction | Active | ID                                       |
|---|------------------------------|------------|--------------|--------|------------------------------------------|
| 1 | Tenancy Agreement — Standard KE | LEASE   | KE           | Yes    | `26854986-c348-494d-afd6-b9248059cd8a`  |
| 2 | Deposit Receipt              | RECEIPT    | KE           | Yes    | `7971c96a-1cbc-460b-818e-8212951c4c01`  |
| 3 | Notice to Vacate             | NOTICE     | KE           | Yes    | `9707d122-ce2c-4b92-88df-5d5974e2b9d0`  |
| 4 | Lease Renewal Notice         | NOTICE     | KE           | Yes    | `aa8c4b43-b385-4104-be21-fd57a269ab5a`  |
| 5 | Move-In Condition Report     | INSPECTION | KE           | Yes    | `6cede16b-936c-43cc-87fb-9ac2c9adaf79`  |

### E-Sign Requests

| # | Title                                        | Tenant  | Status  | ID                                       |
|---|----------------------------------------------|---------|---------|------------------------------------------|
| 1 | Tenancy Agreement — Grace Muthoni (Unit 101) | Grace   | signed  | `4ab76019-53e9-4db1-9376-cbb8676baac1`  |
| 2 | Tenancy Agreement — James Kariuki (Unit 102) | James   | signed  | `e25ed032-79f9-44af-945b-6efd24c369f4`  |
| 3 | Tenancy Agreement — Amina Hassan (KR-A2)     | Amina   | signed  | `5e87b93d-06fe-491b-9b9c-d220e17a23c7`  |
| 4 | Tenancy Agreement — Kevin Waweru (KR-A3)     | Kevin   | sent    | `29157d08-7bfe-41d3-aba4-c76ce6c72c2c`  |
| 5 | Tenancy Agreement — Faith Ndungu (KR-B1)     | Faith   | pending | `c9e379b9-3900-4add-a527-aeeab0e9e4c7`  |

> Navigate to: **Lease Templates** — 8 templates; **Documents** — 5 doc templates; **E-Sign** — 5 requests (signed/sent/pending).

---

## Listings

| # | Title                                    | Unit  | Rent (KES) | Available    | Furnished | Status    | ID                          |
|---|------------------------------------------|-------|------------|--------------|-----------|-----------|------------------------------|
| 1 | Spacious 3-Bedroom in Westlands Heights  | 201   | 85,000     | Jun 23 2026  | No        | PUBLISHED | `cmqgitvkx0007p8nzxblo62v2` |
| 2 | Modern 2-Bedroom — Ready July 2026       | 104   | 60,000     | Jul 16 2026  | Yes       | DRAFT     | `cmqgitw8i0009p8nzrjupi5jy` |

> Navigate to: **Listings** — Listing 1 PUBLISHED (live to applicants), Listing 2 DRAFT.

---

## Vacating

| Tenant        | Unit | Lease          | Move-Out     | Notice Days | Status  | ID                          |
|---------------|------|----------------|--------------|-------------|---------|-----------------------------|
| James Kariuki | 102  | Lease 2 active | Jul 16 2026  | 30 days     | PENDING | `cmqgiu3o1000hp8nzk8i4byfe` |

Tenant note: *"Relocating to Mombasa for a new job."*

### Move-Out Inspection (James)

| Field           | Value                                           |
|-----------------|-------------------------------------------------|
| Inspection ID   | `cmqgjzf09001rp3lmk150zzow`                    |
| Status          | PROPOSED                                        |
| Scheduled Date  | Jun 23 2026                                     |
| Notes           | Inspector: Samuel Otieno                        |

### Inspection Deduction

| Description                                | Amount (KES) | Category | Responsibility |
|--------------------------------------------|--------------|----------|----------------|
| Small hole in living room wall (picture hook) | 2,500      | damage   | tenant         |

### Deposit Refund

| Deposit (KES) | Deductions (KES) | Refund (KES) | Status  |
|---------------|------------------|--------------|---------|
| 80,000        | 2,500            | 77,500       | PENDING |

> Navigate to: **Vacating** → James's notice → Acknowledge → Schedule Inspection.

---

## Maintenance (Service Requests)

### Service Categories

| Name       | Slug        | Icon      | ID                          |
|------------|-------------|-----------|-----------------------------|
| Plumbing   | plumbing    | Droplets  | `cmqgiredo001dbwq704zy08n7` |
| Electrical | electrical  | Zap       | `cmqgirf39001ebwq7zodpm8f8` |
| Security   | security    | Shield    | `cmqgirfi9001fbwq7id7yascm` |
| Cleaning   | cleaning    | Sparkles  | `cmp15raas0005xl9n64cphd5w` |

### Service Requests

| # | Title                                        | Unit   | Category   | Priority | Status      | ID                          |
|---|----------------------------------------------|--------|------------|----------|-------------|------------------------------|
| 1 | Leaking kitchen faucet — Unit 101            | 101    | plumbing   | HIGH     | IN_PROGRESS | `cmqgits6v0000p8nzh9v43vdz` |
| 2 | Power sockets not working — Unit 102         | 102    | electrical | URGENT   | APPROVED    | `cmqgitsth0001p8nzzhiu96ch` |
| 3 | Front door lock stiff — Unit 103             | 103    | security   | NORMAL   | COMPLETED   | `cmqgitt850002p8nz3ietrsox` |
| 4 | Move-in inspection — Unit 102 (James K.)     | 102    | inspection | NORMAL   | DRAFT       | `cmqgitu0i0003p8nzl1z2sf4u` |
| 5 | Deep clean Unit 103 post checkout            | 103    | cleaning   | HIGH     | COMPLETED   | *(created in extended seed)* |
| 6 | CCTV camera offline — Building entrance      | —      | security   | URGENT   | IN_PROGRESS | *(created in extended seed)* |
| 7 | Lawn maintenance — Karen Residences          | —      | cleaning   | LOW      | DRAFT       | *(created in extended seed)* |

### SR History (Status Transitions)

7 history records tracking: DRAFT → SUBMITTED → APPROVED → IN_PROGRESS → COMPLETED for SR1, SR2, SR3.

### SR Quotes

| SR  | Provider       | Amount (KES) | Status   | Scope                                       |
|-----|----------------|--------------|----------|---------------------------------------------|
| SR1 | Peter Njoroge  | 4,500        | APPROVED | Replace taps, labour + fittings, 3mo warranty |
| SR2 | Diana Weru     | 8,500        | APPROVED | Replace 3 sockets, circuit breaker test     |
| SR5 | Admin          | 3,000        | APPROVED | Post-checkout deep clean                    |
| SR6 | Peter Njoroge  | 3,200        | PENDING  | CCTV cable fault repair                     |
| SR7 | Admin          | 5,000        | PENDING  | Monthly lawn & hedge                        |

### Manager Queue (SR Assignments)

| SR  | Assigned To    | Role       |
|-----|----------------|------------|
| SR1 | Peter Njoroge  | primary    |
| SR2 | Diana Weru     | primary    |
| SR4 | Peter Njoroge  | supervisor |
| SR6 | Peter Njoroge  | primary    |
| SR7 | Admin          | primary    |

> Navigate to: **Maintenance / Service Requests** — 7 tickets; **Manager Queue** — 5 assignments.

---

## Lease Renewals

| # | Tenant        | Unit   | Property          | Expiry Date  | Status    | ID                                       |
|---|---------------|--------|-------------------|--------------|-----------|------------------------------------------|
| 1 | Grace Muthoni | 101    | Westlands Heights | Feb 16 2027  | scheduled | `561ab16d-f861-41a1-850c-d8cda434feb2`  |
| 2 | James Kariuki | 102    | Westlands Heights | Apr 2027     | scheduled | *(created in extended seed)*             |
| 3 | Amina Hassan  | KR-A2  | Karen Residences  | Mar 2027     | scheduled | *(created in extended seed)*             |
| 4 | Kevin Waweru  | KR-A3  | Karen Residences  | May 2027     | scheduled | *(created in extended seed)*             |
| 5 | Faith Ndungu  | KR-B1  | Karen Residences  | Jun 2027     | scheduled | *(created in extended seed)*             |

> Navigate to: **Lease Renewals** — 5 alerts across all tenants.

---

## Payments & Escrow

### Escrow Accounts

| # | Tenant        | Property          | Deposit (KES) | Status  | ID                                       |
|---|---------------|-------------------|---------------|---------|------------------------------------------|
| 1 | Grace Muthoni | Westlands/Unit101 | 110,000       | HELD    | `d8b29c3e-b739-47a7-8981-80090248361f`  |
| 2 | James Kariuki | Westlands/Unit102 | 80,000        | HELD    | `970e2ad4-54d8-4340-a4c1-a674d4108b29`  |
| 3 | Amina Hassan  | Karen/KR-A2       | 76,000        | HELD    | `3cc542b2-63e8-4b7f-a969-f63c89a9fe5e`  |
| 4 | Kevin Waweru  | Karen/KR-A3       | 104,000       | HELD    | `d4b5628c-0fba-47ae-9a81-9de0070e96db`  |
| 5 | Faith Ndungu  | Karen/KR-B1       | 110,000       | PENDING | `548955e6-9c84-4e97-9b7f-8ad55b281474`  |

### Transactions (base seed)

| # | Description                         | Amount (KES) | Method           | M-Pesa Ref    | Status    | ID                                       |
|---|-------------------------------------|--------------|------------------|---------------|-----------|------------------------------------------|
| 1 | Rent Jun 2026 — Grace Muthoni U101  | 55,000       | mpesa_paybill    | RH78K3PLG9    | completed | `00fcce8d-5c94-4a2e-8409-b0a463c97160`  |
| 2 | Short-stay — Alice Njeri (3 nights) | 14,300       | mpesa_stk        | SS92M4QWX7    | completed | `61daa8e6-7f42-4ac8-9387-975caafbb3da`  |
| 3 | Security deposit — Grace Muthoni    | 110,000      | bank_transfer_eft| DEP110GRACE01 | completed | `2647be6d-7b42-4c91-a69d-ef7c38b99965`  |

> Navigate to: **Payments & Escrow** — 5 escrow accounts; 3 completed transactions.

---

## Rent Receipts

### Invoices

| # | Invoice No      | Tenant        | Unit  | Period    | Total (KES) | Status   | ID                                       |
|---|-----------------|---------------|-------|-----------|-------------|----------|------------------------------------------|
| 1 | INV-2026-0001   | Grace Muthoni | 101   | Jun 2026  | 55,000      | paid     | `63c3a007-7b15-4a5b-a00f-36202aabc83e`  |
| 2 | INV-2026-0002   | Grace Muthoni | 101   | May 2026  | 55,000      | paid     | `91f83958-e651-4b52-911c-b11d70949375`  |
| 3 | INV-2026-0003   | James Kariuki | 102   | Jun 2026  | 40,000      | paid     | `7d69f054-a1c0-4780-ba83-4743fb325feb`  |
| 4 | INV-2026-0004   | Amina Hassan  | KR-A2 | Jun 2026  | 38,000      | paid     | `04090f5f-29cf-4515-a84e-ddd640d0b9ea`  |
| 5 | INV-2026-0005   | Kevin Waweru  | KR-A3 | Jun 2026  | 54,600      | overdue  | `b2138eeb-fe1d-4c5a-966d-fb6ade1074a7`  |

### Receipts

| # | Receipt No     | Tenant        | Amount (KES) | Method           | Delivery   | ID                          |
|---|----------------|---------------|--------------|------------------|------------|-----------------------------|
| 1 | REC-2026-0001  | Grace Muthoni | 55,000       | mpesa_paybill    | email      | `1c31c46b-4a26-458e-b9e6-8336dd4d5709` |
| 2 | REC-2026-0002  | Grace Muthoni | 55,000       | mpesa_paybill    | sms        | `cmqgjusoz000lbo4ja9umxzjd` |
| 3 | REC-2026-0003  | James Kariuki | 40,000       | bank_transfer_eft| email      | `cmqgjut6t000mbo4jaj61owf9` |
| 4 | REC-2026-0004  | Amina Hassan  | 38,000       | mpesa_paybill    | whatsapp   | `cmqgjutoe000nbo4ju1i05qlc` |
| 5 | REC-2026-0005  | Grace Muthoni | 110,000      | bank_transfer_eft| —          | `cmqgjuu08000obo4j26m9oifw` |

> Navigate to: **Rent Receipts** — INV-0005 shows overdue banner (Kevin, KES 54,600).

---

## Accounting

### Monthly Rent Summaries (Jan–Jun 2026)

| Period   | Total Due (KES) | Collected (KES) | Expenses (KES) | Net (KES) |
|----------|-----------------|-----------------|----------------|-----------|
| Jan 2026 | 93,000          | 93,000          | 22,000         | 71,000    |
| Feb 2026 | 93,000          | 93,000          | 18,500         | 74,500    |
| Mar 2026 | 133,000         | 133,000         | 31,000         | 102,000   |
| Apr 2026 | 183,000         | 183,000         | 28,000         | 155,000   |
| May 2026 | 223,000         | 223,000         | 35,000         | 188,000   |
| Jun 2026 | 223,000         | 223,000         | 42,500         | 180,500   |

### Financial Reports

| Report Type      | Period          | Income (KES) | Expenses (KES) | Net (KES) |
|------------------|-----------------|--------------|----------------|-----------|
| monthly_pnl      | Jun 2026        | 223,000      | 42,500         | 180,500   |
| ytd_summary      | Jan–Jun 2026    | 948,000      | 177,000        | 771,000   |

> Navigate to: **Accounting / Reports** — 6 monthly summaries + 2 financial reports.

---

## Wallets & Payouts

| Wallet Owner  | Type         | Wallet Type      | Currency | ID                                       |
|---------------|--------------|------------------|----------|------------------------------------------|
| Grace Muthoni | tenant       | rent_wallet      | KES      | `984a013e-e1c0-4ed6-9bd5-bc94c20bcc11`  |
| James Kariuki | tenant       | rent_wallet      | KES      | `59b6ae65-e0be-42cb-94f9-9da4b1e8fb01`  |
| Amina Hassan  | tenant       | rent_wallet      | KES      | `613eba38-3243-4dd4-9f86-e9fed7b2c240`  |
| Admin/Org     | organization | operating_wallet | KES      | `3ab4e0f2-5ed5-4607-900a-14f9576afdd0`  |
| David Mutua   | landlord     | payout_wallet    | KES      | `fbc30b6b-321d-44c5-a512-36fd4d1da9d9`  |

### Ledger Entries

| Wallet         | Type   | Amount (KES) | Description                        |
|----------------|--------|--------------|------------------------------------|
| Grace          | CREDIT | 55,000       | Rent Jun 2026 credit               |
| Grace          | DEBIT  | 55,000       | Rent Jun 2026 disbursed to landlord|
| James          | CREDIT | 40,000       | Rent Jun 2026 credit               |
| Admin (Org)    | CREDIT | 2,750        | Platform fee 5% — Jun 2026         |
| David (Landlord)| CREDIT| 85,500       | Karen payout Jun 2026 (2 units)    |

> Navigate to: **Wallets & Payouts** — 5 wallets, 5 ledger entries.

---

## Expenses

| # | Category    | Description                                             | Amount (KES) | Property           |
|---|-------------|---------------------------------------------------------|--------------|--------------------|
| 1 | maintenance | Emergency plumber — Unit 101 faucet repair              | 4,500        | Westlands Heights  |
| 2 | maintenance | Electrical repair — Unit 102 surge damage               | 8,500        | Westlands Heights  |
| 3 | cleaning    | Deep clean Unit 103 post-checkout                       | 3,000        | Westlands Heights  |
| 4 | security    | CCTV system monthly maintenance contract                | 12,000       | Westlands Heights  |
| 5 | utilities   | Common area electricity — Westlands Heights Jun 2026    | 6,800        | Westlands Heights  |
| 6 | maintenance | Lawn mowing and garden maintenance — Karen Residences   | 5,000        | Karen Residences   |
| 7 | admin       | Property insurance premium Q2 2026 — Westlands Heights  | 18,000       | Westlands Heights  |
| 8 | repairs     | Door lock replacement — Unit 103 (short-stay)           | 2,200        | Westlands Heights  |

Total expenses: **KES 60,000**

> Navigate to: **Expenses** — 8 entries across categories and both properties.

---

## Reports

- **Monthly P&L Jun 2026**: Income KES 223K, Expenses KES 42.5K, Net KES 180.5K
- **YTD Summary Jan–Jun 2026**: Income KES 948K, Expenses KES 177K, Net KES 771K
- **Reconciliation Jun 2026**: Expected KES 223K, Actual KES 168.4K, Discrepancy KES 54.6K (Kevin arrears)

---

## KYC

| # | Tenant        | Document Type | Status   | ID                                       |
|---|---------------|---------------|----------|------------------------------------------|
| 1 | Grace Muthoni | national_id   | approved | `47a936aa-b528-4275-a66e-b523950892da`  |
| 2 | James Kariuki | national_id   | pending  | `a6866092-f8d3-4c99-a93a-0cf98a5a4155`  |
| 3 | Amina Hassan  | passport      | approved | `64a8a95b-af93-4c17-a797-baf91a5116e9`  |
| 4 | Kevin Waweru  | national_id   | pending  | `6e3df283-42fb-4fd4-aa5c-d920a62bd08e`  |
| 5 | Faith Ndungu  | national_id   | approved | `777e80a2-7264-45f6-8749-bc1bb2846b85`  |

> Navigate to: **KYC** — 3 approved, 2 pending review.

---

## Screening

| # | Applicant     | Score | Recommendation | Risk Flags                  |
|---|---------------|-------|----------------|-----------------------------|
| 1 | Kevin Waweru  | 78    | APPROVE        | None                        |
| 2 | Faith Ndungu  | 91    | APPROVE        | None                        |
| 3 | Mike Kamau    | 61    | REVIEW         | Irregular income, No contract |
| 4 | Amina Hassan  | 88    | APPROVE        | None                        |
| 5 | David Mutua   | 82    | APPROVE        | Rejected on conflict of interest |

> Navigate to: **Screening** — 5 reports (APPROVE/REVIEW outcome visible).

---

## MoveScore & Intel

### MoveScore Records

| Unit   | Property          | Score | Risk Level | Predicted Move |
|--------|-------------------|-------|------------|----------------|
| 101    | Westlands Heights | 15.2  | LOW        | ~Feb 2027      |
| 102    | Westlands Heights | 78.4  | HIGH       | ~Jul 2026      |
| 103    | Westlands Heights | 5.0   | LOW        | —              |
| KR-A2  | Karen Residences  | 22.1  | LOW        | ~Mar 2027      |
| KR-A3  | Karen Residences  | 55.3  | MEDIUM     | ~Oct 2026      |
| KR-B2  | Karen Residences  | 3.0   | LOW        | —              |

> **Unit 102 (James)** has score 78.4 (HIGH) — corroborated by his vacating notice.

### Live Intelligence Snapshots

| Snapshot Type       | Label                        | Value   | Trend |
|---------------------|------------------------------|---------|-------|
| occupancy_rate      | Portfolio Occupancy Rate     | 63.6%   | UP    |
| rent_collection_rate| Rent Collection Rate Jun 2026| 95.5%   | UP    |
| avg_response_time   | Avg Maintenance Response (h) | 18.4h   | DOWN  |
| vacancy_rate        | Vacancy Rate                 | 36.4%   | DOWN  |
| net_revenue_kes     | Net Revenue Jun 2026 (KES)   | 180,500 | UP    |
| churn_risk_score    | Tenant Churn Risk Score      | 22.0    | DOWN  |

> Navigate to: **MoveScore & Intel** — 6 snapshots, 6 unit-level scores.

---

## Rent Score

| Tenant        | Score | Consistency | On-Time Payments | Late | Arrears (KES) |
|---------------|-------|-------------|------------------|------|---------------|
| Grace Muthoni | 94    | 97%         | 4                | 0    | 0             |
| James Kariuki | 78    | 83%         | 2                | 0    | 0             |
| Amina Hassan  | 88    | 92%         | 3                | 0    | 0             |
| Kevin Waweru  | 55    | 60%         | 0                | 1    | 54,600        |
| Faith Ndungu  | 82    | 88%         | 2                | 0    | 0             |

> Navigate to: **Rent Score** — Grace is top scorer (94), Kevin lowest (55) due to current arrears.

---

## Compliance Numbers

| # | Compliance ID      | Tenant        | Unit   | Property          | Expires    | Status | ID                          |
|---|--------------------|---------------|--------|-------------------|------------|--------|-----------------------------|
| 1 | CPN-2026-WH-001    | Grace Muthoni | 101    | Westlands Heights | Jun 2027   | ACTIVE | `cmqgjvaau001ibo4j264geusy` |
| 2 | CPN-2026-WH-002    | James Kariuki | 102    | Westlands Heights | Apr 2027   | ACTIVE | `cmqgjvatb001jbo4jim9v8t3g` |
| 3 | CPN-2026-KR-001    | Amina Hassan  | KR-A2  | Karen Residences  | Mar 2027   | ACTIVE | `cmqgjvb52001kbo4jgwbg6zea` |
| 4 | CPN-2026-KR-002    | Kevin Waweru  | KR-A3  | Karen Residences  | May 2027   | ACTIVE | `cmqgjvbgw001lbo4jypfmet6x` |
| 5 | CPN-2026-KR-003    | Faith Ndungu  | KR-B1  | Karen Residences  | Jun 2027   | ACTIVE | `cmqgjvbsr001mbo4j0kpcfzrv` |

5 compliance records created (one `identity_check: PASSED` for each compliance number).

---

## MicroBehavior

| # | Tenant        | Type          | Label                                           | Score |
|---|---------------|---------------|-------------------------------------------------|-------|
| 1 | Grace Muthoni | payment       | Paid 3 days early                               | +1.0  |
| 2 | Grace Muthoni | communication | Responded to notice within 1 hour              | +0.9  |
| 3 | James Kariuki | payment       | Paid on due date                                | +0.7  |
| 4 | James Kariuki | maintenance   | Raised 2 maintenance requests this quarter      | +0.5  |
| 5 | Amina Hassan  | payment       | Paid 1 day early                                | +0.8  |
| 6 | Amina Hassan  | communication | Proactively reported water leak                 | +1.0  |
| 7 | Kevin Waweru  | payment       | Payment overdue 11 days                         | -0.8  |
| 8 | Kevin Waweru  | communication | Not responding to payment reminders             | -0.5  |
| 9 | Faith Ndungu  | payment       | Paid 2 days early                               | +0.8  |
|10 | Faith Ndungu  | communication | Pre-confirmed move-in date 2 weeks ahead        | +0.9  |

> Navigate to: **MicroBehavior** — 10 records; Grace/Amina highest, Kevin negative signals.

---

## Audit Logs

| # | Actor         | Role   | Action              | Resource Type     |
|---|---------------|--------|---------------------|-------------------|
| 1 | Admin         | admin  | LEASE_CREATED       | Lease             |
| 2 | Admin         | admin  | LEASE_ACTIVATED     | Lease             |
| 3 | Admin         | admin  | KYC_APPROVED        | KycDocument       |
| 4 | Admin         | admin  | PROVIDER_APPROVED   | ServiceProvider   |
| 5 | Grace Muthoni | tenant | SR_CREATED          | ServiceRequest    |
| 6 | James Kariuki | tenant | SR_CREATED          | ServiceRequest    |
| 7 | Admin         | admin  | LISTING_PUBLISHED   | Listing           |
| 8 | Admin         | admin  | VACATING_ACKNOWLEDGED | VacatingNotice |

> Navigate to: **Audit Logs** — 8 entries covering key lifecycle events.

---

## Disputes

### Utility Meters

| # | Meter Number    | Unit   | Type        | Billing Model       | Price/Unit (KES) | ID                          |
|---|-----------------|--------|-------------|---------------------|------------------|-----------------------------|
| 1 | ELEC-101-WH     | 101    | ELECTRICITY | SUB_METERED_MANUAL  | 25               | *(created in extended seed)* |
| 2 | WATER-101-WH    | 101    | WATER       | FLAT_RATE           | —                | *(created in extended seed)* |
| 3 | ELEC-102-WH     | 102    | ELECTRICITY | SUB_METERED_MANUAL  | 25               | *(created in extended seed)* |
| 4 | ELEC-KRA2       | KR-A2  | ELECTRICITY | SUB_METERED_MANUAL  | 22               | *(created in extended seed)* |
| 5 | WATER-KRA2      | KR-A2  | WATER       | FLAT_RATE           | —                | *(created in extended seed)* |

### Utility Readings

| Meter        | Date     | Previous | Current | Consumption | Cost (KES) | Disputed |
|--------------|----------|----------|---------|-------------|------------|----------|
| ELEC-101-WH  | Jun 2026 | 1840     | 2015    | 175 units   | 4,375      | No       |
| ELEC-101-WH  | May 2026 | 1680     | 1840    | 160 units   | 4,000      | No       |
| ELEC-102-WH  | Jun 2026 | 920      | 1340    | 420 units   | 10,500     | **YES**  |
| WATER-101-WH | Jun 2026 | —        | —       | flat        | 1,500      | No       |
| ELEC-KRA2    | Jun 2026 | 340      | 460     | 120 units   | 2,640      | No       |

### Utility Dispute

| ID                          | Raised By     | Reason                                            | Status |
|-----------------------------|---------------|---------------------------------------------------|--------|
| `cmqgjvpdm002nbo4j43ai9xsl` | James Kariuki | 420 units impossibly high; avg is 120. Requesting re-read. | OPEN |

> Navigate to: **Disputes** — 1 open dispute on Unit 102 electric meter.

---

## Providers

| # | Name              | Category              | Specializations                           | Trust | Status          | ID                          |
|---|-------------------|-----------------------|-------------------------------------------|-------|-----------------|-----------------------------|
| 1 | Peter Njoroge     | VERIFIED_MARKETPLACE  | Leak detection, Pipe repair, Water heater | 87    | ACTIVE          | `cmqgitukc0004p8nzmtvak3v6` |
| 2 | Diana Weru        | VERIFIED_MARKETPLACE  | Rewiring, Sockets, Solar, Generator       | 92    | ACTIVE          | `cmqgitv320005p8nzku39vgai` |
| 3 | James Mwangi      | LANDLORD_PREFERRED    | Lawn mowing, Garden landscaping           | 79    | ACTIVE          | *(created in extended seed)* |
| 4 | Lucy Awino        | VERIFIED_MARKETPLACE  | Deep cleaning, Post-checkout cleaning     | 85    | ACTIVE          | *(created in extended seed)* |
| 5 | Hassan Omar       | AGENCY_PREFERRED      | CCTV installation, Alarm, Gate automation | 0     | PENDING_APPROVAL| *(created in extended seed)* |

### Provider Performance

| Provider      | Jobs Completed | Response Time | Dispute Rate | Cancellation Rate |
|---------------|----------------|---------------|--------------|-------------------|
| Peter Njoroge | 24             | 30 min        | 2%           | 5%                |
| Diana Weru    | 31             | 15 min        | 1%           | 2%                |

> Navigate to: **Providers** — 5 providers (ACTIVE/PENDING). Performance metrics for Peter and Diana.

---

## Unit Readiness

| Unit   | Property          | Readiness Status    | Tenant / Notes                        |
|--------|-------------------|---------------------|---------------------------------------|
| 101    | Westlands Heights | READY               | Grace Muthoni — active lease          |
| 102    | Westlands Heights | READY               | James Kariuki — active (vacating)     |
| 103    | Westlands Heights | READY               | Short-stay enabled                    |
| 104    | Westlands Heights | READY               | Vacant — listing draft                |
| 201    | Westlands Heights | READY               | Vacant — listing published            |
| 202    | Westlands Heights | READY               | Reserved                              |
| KR-A1  | Karen Residences  | READY               | Vacant                                |
| KR-A2  | Karen Residences  | READY               | Amina Hassan — active lease           |
| KR-A3  | Karen Residences  | READY               | Kevin Waweru — active lease           |
| KR-B1  | Karen Residences  | PENDING_CLEAN       | Faith Ndungu — lease draft            |
| KR-B2  | Karen Residences  | PENDING_INSPECTION  | Vacant — needs inspection             |

> Navigate to: **Unit Readiness** — KR-B1 and KR-B2 will show non-ready status.

---

## Services

### Service Type Configs

| Service Type       | Quote Required | Evidence Requirements                  | Supervisor Approval |
|--------------------|----------------|----------------------------------------|---------------------|
| plumbing_repair    | Yes            | BEFORE_PHOTO, AFTER_PHOTO              | Yes                 |
| electrical_repair  | Yes            | BEFORE_PHOTO, AFTER_PHOTO, RECEIPT     | Yes                 |
| cleaning_service   | No             | AFTER_PHOTO                            | No                  |
| security_install   | Yes            | BEFORE_PHOTO, AFTER_PHOTO, WARRANTY_DOC| Yes                 |
| garden_maintenance | No             | AFTER_PHOTO                            | No                  |

---

## Checklists

| # | Name                       | Category    | Items | ID                          |
|---|----------------------------|-------------|-------|-----------------------------|
| 1 | Standard Move-In Inspection| RESIDENTIAL | 15    | `cmqgir7z30008bwq7p6qla7ys` |
| 2 | Short-Stay Unit Readiness  | SHORT_STAY  | 11    | `cmqgira6x000obwq7njscaixa` |
| 3 | Move-Out Inspection        | RESIDENTIAL | 10    | `cmqgirboy0010bwq7gncam5ai` |

### Live Checklist Instance

| Tenant        | Unit | Template           | Type    | Status      | ID                          |
|---------------|------|--------------------|---------|-------------|-----------------------------|
| Grace Muthoni | 101  | Move-In Inspection | MOVE_IN | IN_PROGRESS | `cmqgirdjk001cbwq75jg274jb` |

> Navigate to: **Checklists** — 3 templates; Grace's in-progress checklist ready.

---

## Short Stay

**Short-Stay Property (Unit 103):** `cmqgir4z70001bwq7r97hk3fq`
- Nightly: KES 4,500 | Cleaning fee: KES 800 | Min 1 / Max 30 nights
- Check-in: 14:00 | Check-out: 11:00 | Wi-Fi: `WestSS@2026`

### Bookings

| Guest         | Email                     | Dates                | Guests | Total (KES) | Status      | ID                          |
|---------------|---------------------------|----------------------|--------|-------------|-------------|-----------------------------|
| Alice Njeri   | alice.njeri@demo.ke       | Jun 14–17 (3 nights) | 2      | 14,300      | CHECKED_IN  | `cmqgir6070003bwq7t1ouby3x` |
| Brian Oluoch  | brian.oluoch@demo.ke      | Jun 21–26 (5 nights) | 1      | 23,300      | CONFIRMED   | `cmqgir6pu0005bwq7m8rdzh4e` |
| Fatuma Said   | fatuma.said@demo.ke       | Jun 8–11 (3 nights)  | 2      | 14,300      | CHECKED_OUT | `cmqgir76v0007bwq7nndqh9u2` |

### Stock Items (Unit 103)

| Item                  | Qty | Unit Cost | Reorder Level | Status       | ID                          |
|-----------------------|-----|-----------|---------------|--------------|-----------------------------|
| Bath Towels           | 8   | 650       | 4             | OK           | `cmqgiu50l000jp8nz3qiavjzj` |
| Toilet Rolls          | 3   | 80        | 6             | LOW STOCK ⚠️ | `cmqgiu5p4000lp8nz40jhmo72` |
| Bottled Water (500ml) | 12  | 50        | 6             | OK           | `cmqgiu63i000np8nzpq94wy7u` |

> Navigate to: **Short Stay → Stock** — Toilet Rolls triggers low-stock alert.

---

## Nightgrab Charges

Additional charges linked to Alice Njeri's booking (`cmqgir6070003bwq7t1ouby3x`):

| # | Charge Name           | Type     | Amount (KES) | Refundable |
|---|-----------------------|----------|--------------|------------|
| 1 | Late Checkout Fee     | LATE_FEE | 2,000        | No         |
| 2 | Damage — TV Remote    | DAMAGE   | 1,500        | No         |
| 3 | Airport Transfer      | SERVICE  | 3,500        | No         |
| 4 | Extra Bed Setup       | SERVICE  | 1,000        | No         |
| 5 | Security Deposit      | DEPOSIT  | 5,000        | Yes        |

> Navigate to: **Short Stay → Booking → Charges** — 5 charges on Alice's booking.

---

## Investments

### Property Transfer Records

| Property          | Type                | Amount (KES)  | Notes                                           |
|-------------------|---------------------|---------------|-------------------------------------------------|
| Karen Residences  | purchase            | 85,000,000    | David Mutua. KCB mortgage 60%                  |
| Westlands Heights | management_handover | —             | Transferred to Mwakaba Properties platform     |

> Navigate to: **Investments** — property financial history and transfer records.

---

## QR Applications

| Applicant     | Email                     | Unit | Status   | QR Token                            | ID                                       |
|---------------|---------------------------|------|----------|-------------------------------------|------------------------------------------|
| Nadia Kamau   | nadia.kamau@demo.ke       | 201  | PENDING  | `QR-DEMO-NADIA-WESTLANDS-2026`      | `37a624f6-3f37-4839-b2eb-ad56becd99ea`  |
| Robert Maina  | robert.maina@demo.ke      | 201  | VERIFIED | `QR-DEMO-ROBERT-WESTLANDS-2026`     | `4872b84c-0973-45c3-a57d-75bd8be503ee`  |
| Susan Chebet  | susan.chebet@demo.ke      | 104  | APPLIED  | `QR-DEMO-SUSAN-WESTLANDS-2026`      | `98fc2a2f-485f-423f-b3c8-7429ea46077a`  |

---

## QR Access Logs

8 access logs across 3 QR tokens:

| QR Token                           | User         | Type  | Granted | Reason                                  |
|------------------------------------|--------------|-------|---------|------------------------------------------|
| QR-DEMO-NADIA-WESTLANDS-2026       | —            | entry | Yes     | Application viewed — listing scan       |
| QR-DEMO-ROBERT-WESTLANDS-2026      | —            | entry | Yes     | Identity verified — listing scan        |
| QR-DEMO-SUSAN-WESTLANDS-2026       | —            | entry | Yes     | Application submitted after scan        |
| QR-DEMO-NADIA-WESTLANDS-2026       | —            | entry | **No**  | Duplicate scan — already applied        |
| QR-DEMO-ROBERT-WESTLANDS-2026      | —            | entry | Yes     | Second view — property details          |
| QR-DEMO-SUSAN-WESTLANDS-2026       | Faith Ndungu | gate  | Yes     | Staff access — property tour escort     |
| QR-DEMO-NADIA-WESTLANDS-2026       | Admin        | entry | Yes     | Admin verification scan                 |
| QR-DEMO-ROBERT-WESTLANDS-2026      | Peter Njoroge| gate  | Yes     | Provider access — unit inspection       |

> Navigate to: **QR Access Logs** — 7 granted, 1 denied (duplicate scan).

---

## Visitors

| Name                       | Phone          | Unit   | Purpose                              | ID                          |
|----------------------------|----------------|--------|--------------------------------------|-----------------------------|
| Kevin Odhiambo             | +254701112233  | 101    | Furniture delivery (Grace's brother) | `cmqgitwwd000ap8nz4adejj9t` |
| Zara Ahmed                 | +254702334455  | 102    | Document drop (James's colleague)   | `cmqgitxf2000bp8nzpe9kn7os` |
| Interswitch Kenya Rep      | +254703556677  | Lobby  | Corporate technical meeting          | `cmqgitxwr000cp8nzl8dcd46g` |
| Dr. Patricia Kamau         | +254704667788  | 102    | GP home visit for James Kariuki      | *(created in extended seed)* |
| Tony Muthui (Plumber)      | +254705778899  | KR-A3  | Kevin's personal plumber call        | *(created in extended seed)* |
| Faith Ndungu (Prospective) | +254706889900  | 201    | Property viewing — Unit 201          | *(created in extended seed)* |

### Visitor Logs

| Visitor          | Unit  | Purpose                    | Approval  | Method   | ID Verified |
|------------------|-------|----------------------------|-----------|----------|-------------|
| Kevin Odhiambo   | 101   | Furniture delivery         | APPROVED  | MANUAL   | Yes         |
| Interswitch Rep  | Lobby | Corporate meeting          | APPROVED  | QR_CODE  | No          |
| Dr. Patricia     | 102   | GP home visit              | APPROVED  | MANUAL   | Yes         |
| Faith Ndungu     | 201   | Property viewing           | APPROVED  | QR_CODE  | Yes         |

> Navigate to: **Visitors / Visitor Logs** — 6 visitors, 4 log entries.

---

## Organisations

| Field             | Value                            |
|-------------------|----------------------------------|
| Organisation ID   | `org1`                           |
| Name              | Mwakaba Properties               |
| Branch ID         | `b1`                             |
| Branch Name       | Nairobi HQ                       |
| Admin User ID     | `7b8466b0-9d31-485d-b7a9-c5f7f3c089f7` |

---

## Roles & Permissions

5 system roles (RBAC):

| Role      | Scope                     | Access Level       | Active Users |
|-----------|---------------------------|--------------------|--------------|
| Admin     | Global org access         | Full control       | 3            |
| Landlord  | Owned portfolio only      | Portfolio manager  | 18           |
| Tenant    | Self-service profile      | Restricted         | 1,240        |
| Staff     | Branch operations         | Operations         | 42           |
| Field Agent| On-ground inspections    | Field verification | 25           |

> Navigate to: **Roles & Permissions** — matrix toggles live via API.

---

## Service Categories

| Name       | Slug        | Icon      | ID                          |
|------------|-------------|-----------|-----------------------------|
| Plumbing   | plumbing    | Droplets  | `cmqgiredo001dbwq704zy08n7` |
| Electrical | electrical  | Zap       | `cmqgirf39001ebwq7zodpm8f8` |
| Security   | security    | Shield    | `cmqgirfi9001fbwq7id7yascm` |
| Cleaning   | cleaning    | Sparkles  | `cmp15raas0005xl9n64cphd5w` |

---

## Service Enquiries (Support Tickets)

| # | Name                       | Category   | Message Summary                               | Status      |
|---|----------------------------|------------|-----------------------------------------------|-------------|
| 1 | Grace Muthoni              | Plumbing   | Plumbing request follow-up — no update yet    | IN_PROGRESS |
| 2 | Kevin Waweru               | Electrical | Interested in solar panel installation quote  | NEW         |
| 3 | Amina Hassan               | Cleaning   | Requesting bi-weekly housekeeping — KR-A2     | NEW         |
| 4 | Emmanuel Ochieng           | Security   | Looking for 2BR, budget KES 55–65K, Jul 2026  | COMPLETED   |
| 5 | Safaricom Facilities Team  | Cleaning   | B2B bulk listing enquiry for 10+ units        | IN_PROGRESS |

> Navigate to: **Service Enquiries** — 5 tickets; 2 IN_PROGRESS, 1 COMPLETED, 2 NEW.

---

## Team Invitations

| # | Invitee Email             | Role     | Token                  | Status  | Expires    |
|---|---------------------------|----------|------------------------|---------|------------|
| 1 | new.manager@demo.ke       | staff    | INV-TKN-MGMT-001       | pending | Jun 23 2026|
| 2 | leasing.agent@demo.ke     | staff    | INV-TKN-LSNG-002       | pending | Jun 23 2026|
| 3 | accounts.team@demo.ke     | staff    | INV-TKN-ACCT-003       | pending | Jun 23 2026|
| 4 | karen.landlord@demo.ke    | landlord | INV-TKN-LAND-004       | pending | Jun 23 2026|
| 5 | field.agent@demo.ke       | staff    | INV-TKN-AGNT-005       | pending | Jun 23 2026|

> Navigate to: **Team Invitations** — 5 pending invitations (all expire Jun 23 2026).

---

## Data Migration

### Import Job

| Field        | Value                                      |
|--------------|--------------------------------------------|
| ID           | `cmqgjzncm0026p3lm6szdt7rh`               |
| File         | mwakaba_legacy_tenants_2025.csv            |
| Import Type  | past_rent_records                          |
| Records      | 5 total, 5 success, 0 errors               |
| Status       | COMPLETED                                  |

### Past Rent Records (Migrated)

| Tenant        | Unit   | Period   | Rent (KES) | Paid (KES) | Migrated |
|---------------|--------|----------|------------|------------|----------|
| Grace Muthoni | 101    | Apr 2026 | 55,000     | 55,000     | Yes      |
| Grace Muthoni | 101    | May 2026 | 55,000     | 55,000     | Yes      |
| James Kariuki | 102    | May 2026 | 40,000     | 40,000     | Yes      |
| Amina Hassan  | KR-A2  | Apr 2026 | 38,000     | 38,000     | Yes      |
| Amina Hassan  | KR-A2  | May 2026 | 38,000     | 38,000     | Yes      |

> Navigate to: **Data Migration** — 1 completed import job, 5 migrated records.

---

## Taxonomies

### Application Custom Fields

| # | Label                  | Type   | Required | Options                                           |
|---|------------------------|--------|----------|---------------------------------------------------|
| 1 | Employment Type        | SELECT | Yes      | Employed, Self-employed, Business Owner, Student, Retired |
| 2 | Monthly Income (KES)   | NUMBER | No       | —                                                 |
| 3 | Number of Dependants   | NUMBER | No       | —                                                 |
| 4 | Previous Landlord Name | TEXT   | No       | —                                                 |
| 5 | Pets                   | SELECT | Yes      | None, Cat, Dog, Bird, Other                       |

> Navigate to: **Taxonomies** — 5 custom application fields.

---

## Settings

### Property Onboarding Configs

| Property          | Short Stay | Visitor Approval | Gate Access | Maintenance SLA       |
|-------------------|------------|------------------|-------------|-----------------------|
| Westlands Heights | Enabled    | Required         | Required    | standard_maintenance  |
| Karen Residences  | Disabled   | Required         | Not required| standard_maintenance  |

### Reminder Schedules

| # | Target Type | Channel   | Offset Days | Template Summary                          |
|---|-------------|-----------|-------------|-------------------------------------------|
| 1 | lease       | email     | -60         | Lease expiry alert — 60 days before       |
| 2 | lease       | sms       | -30         | Lease expiry reminder — 30 days           |
| 3 | invoice     | whatsapp  | +3          | Overdue invoice alert (KES {{amount}})    |
| 4 | kyc         | email     | -7          | KYC upload nudge                          |
| 5 | checklist   | email     | 0           | Move-in checklist pending                 |

> Navigate to: **Settings** — 2 property configs, 5 active reminder schedules.

---

## SLA Policies

| Name                       | Service Type           | Response  | Completion | Escalate After | ID                          |
|----------------------------|------------------------|-----------|------------|----------------|-----------------------------|
| Emergency Response (4h)    | emergency_maintenance  | 60 min    | 4 hours    | 2 hours        | `cmqgiu2ct000dp8nzxidgeu7q` |
| Standard Maintenance (48h) | standard_maintenance   | 4 hours   | 48 hours   | 24 hours       | `cmqgiu2ue000ep8nz0wisq5e7` |
| Inspection Scheduling (72h)| inspection             | 8 hours   | 72 hours   | 48 hours       | `cmqgiu363000fp8nzplonfb5x` |

---

## Module Coverage Summary

| Module               | Entries                                               | Navigate To                          |
|----------------------|-------------------------------------------------------|--------------------------------------|
| Dashboard            | 7 widgets + 6 intel snapshots                         | /dashboard                           |
| CRM                  | 5 rental applications (all statuses)                  | /listings → applications             |
| Portfolio            | 2 properties, 11 units, 3 containers                  | /portfolio                           |
| Properties           | Westlands Heights + Karen Residences                  | /properties                          |
| Tenants              | 5 tenants across 2 properties                         | /tenants                             |
| Leases               | 4 active + 2 drafts (6 total)                         | /leasing                             |
| Lease Templates      | 8 templates + 5 doc templates + 5 e-signs             | /lease-templates                     |
| Listings             | 1 published + 1 draft                                 | /listings                            |
| Vacating             | 1 notice → inspection → refund flow                   | /vacating                            |
| Maintenance          | 7 SRs (all statuses) + 7 history + 5 quotes           | /service-requests                    |
| Lease Renewals       | 5 renewal alerts (all tenants)                        | /lease-renewals                      |
| Payments & Escrow    | 5 escrow accounts + 3 transactions                    | /payments                            |
| Rent Receipts        | 5 invoices (1 overdue) + 5 receipts                   | /rent-receipts                       |
| Accounting           | 6 monthly summaries + 2 financial reports             | /accounting                          |
| Wallets & Payouts    | 5 wallets + 5 ledger entries                          | /wallets                             |
| Expenses             | 8 expenses across 2 properties                        | /expenses                            |
| Reports              | P&L + YTD + reconciliation report                     | /reports                             |
| KYC                  | 5 docs (3 approved, 2 pending)                        | /kyc                                 |
| Screening            | 5 screening reports (APPROVE/REVIEW)                  | /screening                           |
| MoveScore & Intel    | 6 unit scores + 6 snapshots                           | /movescore                           |
| Rent Score           | 5 tenant scores (55–94 range)                         | /rent-score                          |
| Compliance Numbers   | 5 compliance IDs + 5 records                          | /compliance                          |
| MicroBehavior        | 10 behavior records (positive + negative)             | /microbehavior                       |
| Audit Logs           | 8 lifecycle audit entries                             | /audit-logs                          |
| Disputes             | 5 meters + 5 readings + 1 open dispute                | /disputes                            |
| Service Requests     | 7 tickets + 5 quotes + 5 assignments (Manager Queue)  | /service-requests                    |
| Manager Queue        | 5 assigned SRs with provider links                   | /manager-queue                       |
| Providers            | 5 providers (ACTIVE/PENDING) + performance            | /providers                           |
| Unit Readiness       | 11 units — READY/PENDING_CLEAN/PENDING_INSPECTION     | /unit-readiness                      |
| Services             | 5 service type configs with evidence rules            | /admin/services                      |
| Checklists           | 3 templates + 1 live IN_PROGRESS instance             | /checklists                          |
| Short Stay           | 1 property + 3 bookings (all statuses) + 3 stock items| /short-stay                          |
| Nightgrab Charges    | 5 charges on Alice Njeri's booking                    | /short-stay → bookings → charges     |
| Investments          | 2 transfer records + reconciliation                   | /investments                         |
| QR Applications      | 3 applications (PENDING/VERIFIED/APPLIED)             | /listings → QR applications          |
| QR Access Logs       | 8 logs (7 granted, 1 denied)                          | /qr-access-logs                      |
| Visitors             | 6 visitors + 4 visitor logs                           | /visitors                            |
| Visitor Logs         | 4 log entries (manual + QR_CODE approval)             | /visitor-logs                        |
| Organisations        | org1 (Mwakaba) + branch b1 (Nairobi HQ)              | /admin/organisations                 |
| Roles & Permissions  | 5 roles with live RBAC matrix                         | /admin/rbac                          |
| Service Categories   | 4 categories (plumbing, electrical, security, cleaning)| /admin/service-categories           |
| Service Enquiries    | 5 enquiries (all statuses)                            | /service-enquiries                   |
| Team Invitations     | 5 pending invites                                     | /admin/team-invitations              |
| Data Migration       | 1 completed import + 5 past rent records              | /admin/data-migration                |
| Taxonomies           | 5 custom application fields + 5 service type configs  | /admin/taxonomies                    |
| Settings             | 2 property configs + 5 reminder schedules             | /admin/settings                      |
| Support Tickets      | 5 service enquiries (used as support tickets)         | /service-enquiries                   |

---

*All passwords: `Demo@1234` — All data seeded idempotently (re-running scripts is safe)*

---

## Public Search Test Examples

Visitors can test this without logging in from:

- Homepage navbar search
- Mobile menu search
- `/listings-search?q=<keyword>`
- Public API: `/api/v1/public/search?q=<keyword>&limit=5`

| Search Term | Where to Test | Expected Public Results |
|-------------|---------------|-------------------------|
| `karen`     | `/listings-search?q=karen` | Properties: Karen Residences / Sunrise Apartments; Locations: Karen; Agents: Diana Weru if coverage area matches |
| `nairobi`   | `/listings-search?q=nairobi` | Location and property matches for Nairobi-area records |
| `plumbing`  | `/listings-search?q=plumbing` | Services: Plumbing service category |
| `cleaning`  | `/listings-search?q=cleaning` | Services: Cleaning service category |
| `diana`     | `/listings-search?q=diana` | Agents & Providers: Diana Weru |
| `electrical`| `/listings-search?q=electrical` | Services or providers with electrical specializations |

API smoke test examples:

```bash
curl "http://localhost:4000/api/v1/public/search?q=karen&limit=5"
curl "http://localhost:4000/api/v1/public/search?q=plumbing&limit=5"
curl "http://localhost:4000/api/v1/public/search?q=nairobi&limit=5"
```

Pass criteria:

- No login is required.
- Response includes public buckets: `listings`, `properties`, `locations`, `agents`, `services`.
- No private contact details, lease data, tenant data, or internal financial records are exposed.
