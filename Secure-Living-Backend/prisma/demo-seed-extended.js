/**
 * demo-seed-extended.js — Extended demo data for all remaining modules
 * Run AFTER demo-seed.js: node prisma/demo-seed-extended.js
 */
const { PrismaClient } = require("@prisma/client");
const { randomUUID, randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();
const ORG_ID    = "org1";
const BRANCH_ID = "b1";
const ADMIN_ID  = "7b8466b0-9d31-485d-b7a9-c5f7f3c089f7";

const uid  = () => randomUUID();
const days = (n = 0) => new Date(Date.now() + n * 86400000);
const past = (n) => new Date(Date.now() - n * 86400000);

function hashPw(pw) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}
async function upsert(model, where, data) {
  const ex = await model.findFirst({ where });
  if (ex) { process.stdout.write("    (skip)\n"); return ex; }
  return model.create({ data });
}

async function main() {
  console.log("🌱  Extended seed — all modules\n");

  // ── Load base entities ────────────────────────────────────────────────────────
  const grace   = await prisma.appUser.findFirst({ where: { email: "grace.muthoni@demo.ke" } });
  const james   = await prisma.appUser.findFirst({ where: { email: "james.kariuki@demo.ke" } });
  const peter   = await prisma.appUser.findFirst({ where: { email: "peter.njoroge@demo.ke" } });
  const diana   = await prisma.appUser.findFirst({ where: { email: "diana.weru@demo.ke" } });
  const prop    = await prisma.property.findFirst({ where: { name: "Westlands Heights" } });
  const u101    = await prisma.unit.findFirst({ where: { unitNumber: "101", propertyId: prop.id } });
  const u102    = await prisma.unit.findFirst({ where: { unitNumber: "102", propertyId: prop.id } });
  const u103    = await prisma.unit.findFirst({ where: { unitNumber: "103", propertyId: prop.id } });
  const u104    = await prisma.unit.findFirst({ where: { unitNumber: "104", propertyId: prop.id } });
  const u201    = await prisma.unit.findFirst({ where: { unitNumber: "201", propertyId: prop.id } });
  const u202    = await prisma.unit.findFirst({ where: { unitNumber: "202", propertyId: prop.id } });
  const l1      = await prisma.lease.findFirst({ where: { unitId: u101.id, tenantUserId: grace.id } });
  const l2      = await prisma.lease.findFirst({ where: { unitId: u102.id, tenantUserId: james.id } });
  const ssp     = await prisma.shortStayProperty.findFirst({ where: { unitId: u103.id } });
  const booking1= await prisma.shortStayBooking.findFirst({ where: { guestEmail: "alice.njeri@demo.ke" } });
  const catPlum = await prisma.serviceCategory.findFirst({ where: { slug: "plumbing" } });
  const catElec = await prisma.serviceCategory.findFirst({ where: { slug: "electrical" } });
  const catSec  = await prisma.serviceCategory.findFirst({ where: { slug: "security" } });
  const catClean= await prisma.serviceCategory.findFirst({ where: { slug: "cleaning" } });
  const prov1   = await prisma.serviceProvider.findFirst({ where: { userId: peter.id } });
  const prov2   = await prisma.serviceProvider.findFirst({ where: { userId: diana.id } });
  const sr1     = await prisma.serviceRequest.findFirst({ where: { title: "Leaking kitchen faucet — Unit 101" } });
  const sr2     = await prisma.serviceRequest.findFirst({ where: { title: "Power sockets not working — Unit 102" } });
  const sr3     = await prisma.serviceRequest.findFirst({ where: { title: "Front door lock stiff — Unit 103" } });
  const sr4     = await prisma.serviceRequest.findFirst({ where: { title: "Move-in inspection — Unit 102 (James Kariuki)" } });
  const lst1    = await prisma.listing.findFirst({ where: { unitId: u201.id } });
  const vn      = await prisma.vacatingNotice.findFirst({ where: { leaseId: l2.id } });
  const pw      = hashPw("Demo@1234");

  // ── 1. Additional users ───────────────────────────────────────────────────────
  console.log("👤  Additional users...");
  const david = await upsert(prisma.appUser, { email: "david.mutua@demo.ke" },
    { id: uid(), email: "david.mutua@demo.ke", fullName: "David Mutua", phone: "+254733001001",
      passwordHash: pw, status: "active", verificationLevel: "TRUSTED_PERSONNEL" });
  const amina = await upsert(prisma.appUser, { email: "amina.hassan@demo.ke" },
    { id: uid(), email: "amina.hassan@demo.ke", fullName: "Amina Hassan", phone: "+254733002002",
      passwordHash: pw, status: "active", verificationLevel: "IDENTITY_VERIFIED" });
  const kevin = await upsert(prisma.appUser, { email: "kevin.waweru@demo.ke" },
    { id: uid(), email: "kevin.waweru@demo.ke", fullName: "Kevin Waweru", phone: "+254733003003",
      passwordHash: pw, status: "active", verificationLevel: "UNVERIFIED" });
  const faith = await upsert(prisma.appUser, { email: "faith.ndungu@demo.ke" },
    { id: uid(), email: "faith.ndungu@demo.ke", fullName: "Faith Ndungu", phone: "+254733004004",
      passwordHash: pw, status: "active", verificationLevel: "IDENTITY_VERIFIED" });
  const mike  = await upsert(prisma.appUser, { email: "mike.kamau@demo.ke" },
    { id: uid(), email: "mike.kamau@demo.ke", fullName: "Mike Kamau", phone: "+254733005005",
      passwordHash: pw, status: "active", verificationLevel: "UNVERIFIED" });
  console.log(`  ✓ David Mutua (${david.id}), Amina Hassan (${amina.id}), Kevin Waweru (${kevin.id})`);
  console.log(`  ✓ Faith Ndungu (${faith.id}), Mike Kamau (${mike.id})`);

  // ── 2. Second property — Karen Residences ─────────────────────────────────────
  console.log("\n🏢  Second property (Portfolio)...");
  const prop2 = await upsert(prisma.property,
    { name: "Karen Residences", organizationId: ORG_ID },
    { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID,
      name: "Karen Residences", propertyType: "Townhouse Complex",
      addressLine1: "8 Karen Plains Road", city: "Nairobi", country: "Kenya",
      ownerUserId: david.id, managerUserId: ADMIN_ID,
      purchasePriceKes: 85000000, currentValueKes: 95000000,
      yearBuilt: 2019, totalUnits: 5,
      capRateEstimate: 6.8, status: "active" });

  const krUnits = [];
  const krDefs = [
    { n: "KR-A1", type: "1-Bedroom", beds: 1, baths: 1, rent: 38000, status: "vacant",   ready: "READY" },
    { n: "KR-A2", type: "1-Bedroom", beds: 1, baths: 1, rent: 38000, status: "occupied", ready: "READY" },
    { n: "KR-A3", type: "2-Bedroom", beds: 2, baths: 1, rent: 52000, status: "occupied", ready: "READY" },
    { n: "KR-B1", type: "2-Bedroom", beds: 2, baths: 2, rent: 55000, status: "vacant",   ready: "PENDING_CLEAN" },
    { n: "KR-B2", type: "3-Bedroom", beds: 3, baths: 2, rent: 75000, status: "vacant",   ready: "PENDING_INSPECTION" },
  ];
  for (const d of krDefs) {
    const u = await upsert(prisma.unit,
      { unitNumber: d.n, propertyId: prop2.id },
      { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID, propertyId: prop2.id,
        unitNumber: d.n, unitType: d.type, bedrooms: d.beds, bathrooms: d.baths,
        rentAmountKes: d.rent, status: d.status, readinessStatus: d.ready, floor: "A" });
    krUnits.push(u);
    console.log(`  ✓ ${d.n} (${d.ready}): ${u.id}`);
  }
  const [krA1, krA2, krA3, krB1, krB2] = krUnits;

  // ── 3. Container / Portfolio ──────────────────────────────────────────────────
  console.log("\n📁  Containers (Portfolio)...");
  const cont1 = await upsert(prisma.container,
    { name: "Westlands Complex", organizationId: ORG_ID },
    { organizationId: ORG_ID, branchId: BRANCH_ID,
      name: "Westlands Complex", type: "COMPLEX",
      description: "Premium apartment complex in Westlands — 6-unit block, short-stay enabled.",
      city: "Nairobi", country: "Kenya" });
  const cont2 = await upsert(prisma.container,
    { name: "Karen Gardens Estate", organizationId: ORG_ID },
    { organizationId: ORG_ID, branchId: BRANCH_ID,
      name: "Karen Gardens Estate", type: "ESTATE",
      description: "Gated townhouse estate in Karen — 5 units, high-value residential.",
      city: "Nairobi", country: "Kenya" });
  const cont3 = await upsert(prisma.container,
    { name: "Kilimani Courtyard", organizationId: ORG_ID },
    { organizationId: ORG_ID, branchId: BRANCH_ID,
      name: "Kilimani Courtyard", type: "COURTYARD",
      description: "Planned courtyard development — under acquisition phase.",
      city: "Nairobi", country: "Kenya" });
  console.log(`  ✓ Westlands Complex (${cont1.id}), Karen Gardens Estate (${cont2.id}), Kilimani Courtyard (${cont3.id})`);

  // ── 4. More leases (Karen units) ─────────────────────────────────────────────
  console.log("\n📄  More leases (Karen Residences)...");
  const lKrA2 = await upsert(prisma.lease,
    { unitId: krA2.id, tenantUserId: amina.id },
    { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID,
      propertyId: prop2.id, unitId: krA2.id, tenantUserId: amina.id,
      leaseType: "fixed_term", rentAmount: 38000, depositAmount: 76000,
      startDate: past(90), endDate: days(275),
      paymentFrequency: "monthly", status: "active",
      signedAt: past(90), createdBy: ADMIN_ID });
  const lKrA3 = await upsert(prisma.lease,
    { unitId: krA3.id, tenantUserId: kevin.id },
    { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID,
      propertyId: prop2.id, unitId: krA3.id, tenantUserId: kevin.id,
      leaseType: "month_to_month", rentAmount: 52000, depositAmount: 104000,
      startDate: past(45), endDate: days(320),
      paymentFrequency: "monthly", status: "active",
      signedAt: past(45), createdBy: ADMIN_ID });
  const lKrB1 = await upsert(prisma.lease,
    { unitId: krB1.id },
    { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID,
      propertyId: prop2.id, unitId: krB1.id, tenantUserId: faith.id,
      leaseType: "fixed_term", rentAmount: 55000, depositAmount: 110000,
      startDate: days(14), endDate: days(379),
      paymentFrequency: "monthly", status: "draft", createdBy: ADMIN_ID });
  console.log(`  ✓ Amina/KR-A2 (active): ${lKrA2.id}`);
  console.log(`  ✓ Kevin/KR-A3 (active): ${lKrA3.id}`);
  console.log(`  ✓ Faith/KR-B1 (draft):  ${lKrB1.id}`);

  // ── 5. Lease Templates ────────────────────────────────────────────────────────
  console.log("\n📝  Lease templates...");
  const lt1 = await upsert(prisma.leaseTemplate,
    { name: "Standard Residential Tenancy Agreement", organizationId: ORG_ID },
    { organizationId: ORG_ID, name: "Standard Residential Tenancy Agreement",
      description: "Fixed-term 12-month tenancy agreement compliant with Kenya Landlord & Tenant Act.",
      fileUrl: "https://docs.secureliving.co.ke/templates/residential-standard-v3.pdf",
      fileFormat: "pdf", isActive: true, assignedCount: 12 });
  const lt2 = await upsert(prisma.leaseTemplate,
    { name: "Month-to-Month Tenancy Agreement", organizationId: ORG_ID },
    { organizationId: ORG_ID, name: "Month-to-Month Tenancy Agreement",
      description: "Rolling monthly tenancy — 30-day notice period for either party.",
      fileUrl: "https://docs.secureliving.co.ke/templates/month-to-month-v2.pdf",
      fileFormat: "pdf", isActive: true, assignedCount: 5 });
  const lt3 = await upsert(prisma.leaseTemplate,
    { name: "Short-Stay Accommodation Agreement", organizationId: ORG_ID },
    { organizationId: ORG_ID, name: "Short-Stay Accommodation Agreement",
      description: "Guest accommodation terms for stays under 30 nights. Covers liability, house rules, deposit.",
      fileUrl: "https://docs.secureliving.co.ke/templates/short-stay-v1.pdf",
      fileFormat: "pdf", isActive: true, assignedCount: 8 });
  const lt4 = await upsert(prisma.leaseTemplate,
    { name: "Commercial Lease Agreement", organizationId: ORG_ID },
    { organizationId: ORG_ID, name: "Commercial Lease Agreement",
      description: "For commercial/retail units. Includes rent escalation clause and fit-out schedule.",
      fileUrl: "https://docs.secureliving.co.ke/templates/commercial-v1.pdf",
      fileFormat: "pdf", isActive: false, assignedCount: 0 });
  const lt5 = await upsert(prisma.leaseTemplate,
    { name: "Renewal Addendum", organizationId: ORG_ID },
    { organizationId: ORG_ID, name: "Renewal Addendum",
      description: "One-page addendum extending an existing lease by 12 months with updated rent.",
      fileUrl: "https://docs.secureliving.co.ke/templates/renewal-addendum-v2.pdf",
      fileFormat: "pdf", isActive: true, assignedCount: 3 });
  console.log(`  ✓ ${lt1.id}, ${lt2.id}, ${lt3.id}, ${lt4.id}, ${lt5.id}`);

  // ── 6. Document Templates ─────────────────────────────────────────────────────
  console.log("\n📄  Document templates...");
  const dt1 = await upsert(prisma.documentTemplate,
    { name: "Tenancy Agreement — Standard KE" },
    { id: uid(), name: "Tenancy Agreement — Standard KE", category: "LEASE",
      jurisdiction: "KE", isActive: true,
      templateBody: "THIS TENANCY AGREEMENT is made on {{date}} between {{landlordName}} and {{tenantName}} for the premises at {{address}} at a monthly rent of KES {{rent}}.",
      variablesCsv: "date,landlordName,tenantName,address,rent" });
  const dt2 = await upsert(prisma.documentTemplate,
    { name: "Deposit Receipt" },
    { id: uid(), name: "Deposit Receipt", category: "RECEIPT",
      jurisdiction: "KE", isActive: true,
      templateBody: "RECEIVED from {{tenantName}} the sum of KES {{amount}} as security deposit for unit {{unit}} at {{property}}.",
      variablesCsv: "tenantName,amount,unit,property" });
  const dt3 = await upsert(prisma.documentTemplate,
    { name: "Notice to Vacate" },
    { id: uid(), name: "Notice to Vacate", category: "NOTICE",
      jurisdiction: "KE", isActive: true,
      templateBody: "You are hereby given {{noticeDays}} days notice to vacate the premises at {{address}} by {{vacateDate}}.",
      variablesCsv: "noticeDays,address,vacateDate" });
  const dt4 = await upsert(prisma.documentTemplate,
    { name: "Lease Renewal Notice" },
    { id: uid(), name: "Lease Renewal Notice", category: "NOTICE",
      jurisdiction: "KE", isActive: true,
      templateBody: "Your lease for unit {{unit}} expires on {{expiryDate}}. We invite you to renew at KES {{newRent}} per month.",
      variablesCsv: "unit,expiryDate,newRent" });
  const dt5 = await upsert(prisma.documentTemplate,
    { name: "Move-In Condition Report" },
    { id: uid(), name: "Move-In Condition Report", category: "INSPECTION",
      jurisdiction: "KE", isActive: true,
      templateBody: "MOVE-IN CONDITION REPORT for {{unit}} on {{date}}. Tenant: {{tenantName}}. Items inspected as listed in attached checklist.",
      variablesCsv: "unit,date,tenantName" });
  console.log(`  ✓ ${dt1.id}, ${dt2.id}, ${dt3.id}, ${dt4.id}, ${dt5.id}`);

  // ── 7. E-Sign Requests ────────────────────────────────────────────────────────
  console.log("\n✍️   E-Sign requests...");
  const es1 = await upsert(prisma.eSignRequest,
    { signerUserId: grace.id, leaseId: l1.id },
    { id: uid(), leaseId: l1.id, templateId: dt1.id,
      title: "Tenancy Agreement — Grace Muthoni (Unit 101)",
      signerUserId: grace.id, signerEmail: grace.email,
      status: "signed", signedAt: past(120),
      sentAt: past(121), createdBy: ADMIN_ID });
  const es2 = await upsert(prisma.eSignRequest,
    { signerUserId: james.id, leaseId: l2.id },
    { id: uid(), leaseId: l2.id, templateId: dt1.id,
      title: "Tenancy Agreement — James Kariuki (Unit 102)",
      signerUserId: james.id, signerEmail: james.email,
      status: "signed", signedAt: past(60),
      sentAt: past(61), createdBy: ADMIN_ID });
  const es3 = await upsert(prisma.eSignRequest,
    { signerUserId: amina.id, leaseId: lKrA2.id },
    { id: uid(), leaseId: lKrA2.id, templateId: dt1.id,
      title: "Tenancy Agreement — Amina Hassan (KR-A2)",
      signerUserId: amina.id, signerEmail: amina.email,
      status: "signed", signedAt: past(89),
      sentAt: past(90), createdBy: ADMIN_ID });
  const es4 = await upsert(prisma.eSignRequest,
    { signerUserId: kevin.id, leaseId: lKrA3.id },
    { id: uid(), leaseId: lKrA3.id,
      title: "Tenancy Agreement — Kevin Waweru (KR-A3)",
      signerUserId: kevin.id, signerEmail: kevin.email,
      status: "sent", sentAt: past(44), createdBy: ADMIN_ID });
  const es5 = await upsert(prisma.eSignRequest,
    { signerUserId: faith.id, leaseId: lKrB1.id },
    { id: uid(), leaseId: lKrB1.id,
      title: "Tenancy Agreement — Faith Ndungu (KR-B1)",
      signerUserId: faith.id, signerEmail: faith.email,
      status: "pending", createdBy: ADMIN_ID });
  console.log(`  ✓ ${es1.id} (signed), ${es2.id} (signed), ${es3.id} (signed), ${es4.id} (sent), ${es5.id} (pending)`);

  // ── 8. KYC Documents ─────────────────────────────────────────────────────────
  console.log("\n🪪  KYC documents...");
  const kyc1 = await upsert(prisma.kycDocument,
    { userId: grace.id, documentType: "national_id" },
    { id: uid(), userId: grace.id, organizationId: ORG_ID, branchId: BRANCH_ID,
      documentType: "national_id", fileName: "grace_muthoni_id.jpg",
      mimeType: "image/jpeg", filePath: "kyc/grace_muthoni_id.jpg",
      fileSizeBytes: 248320, status: "approved",
      reviewedAt: past(118), reviewedByUserId: ADMIN_ID });
  const kyc2 = await upsert(prisma.kycDocument,
    { userId: james.id, documentType: "national_id" },
    { id: uid(), userId: james.id, organizationId: ORG_ID, branchId: BRANCH_ID,
      documentType: "national_id", fileName: "james_kariuki_id.jpg",
      mimeType: "image/jpeg", filePath: "kyc/james_kariuki_id.jpg",
      fileSizeBytes: 196608, status: "pending" });
  const kyc3 = await upsert(prisma.kycDocument,
    { userId: amina.id, documentType: "passport" },
    { id: uid(), userId: amina.id, organizationId: ORG_ID, branchId: BRANCH_ID,
      documentType: "passport", fileName: "amina_hassan_passport.pdf",
      mimeType: "application/pdf", filePath: "kyc/amina_hassan_passport.pdf",
      fileSizeBytes: 512000, status: "approved",
      reviewedAt: past(88), reviewedByUserId: ADMIN_ID });
  const kyc4 = await upsert(prisma.kycDocument,
    { userId: kevin.id, documentType: "national_id" },
    { id: uid(), userId: kevin.id, organizationId: ORG_ID, branchId: BRANCH_ID,
      documentType: "national_id", fileName: "kevin_waweru_id.jpg",
      mimeType: "image/jpeg", filePath: "kyc/kevin_waweru_id.jpg",
      fileSizeBytes: 183296, status: "pending" });
  const kyc5 = await upsert(prisma.kycDocument,
    { userId: faith.id, documentType: "national_id" },
    { id: uid(), userId: faith.id, organizationId: ORG_ID, branchId: BRANCH_ID,
      documentType: "national_id", fileName: "faith_ndungu_id.jpg",
      mimeType: "image/jpeg", filePath: "kyc/faith_ndungu_id.jpg",
      fileSizeBytes: 210000, status: "approved",
      reviewedAt: past(10), reviewedByUserId: ADMIN_ID });
  console.log(`  ✓ Grace (approved), James (pending), Amina (approved), Kevin (pending), Faith (approved)`);

  // ── 9. Rental Applications (CRM / Listings) ───────────────────────────────────
  console.log("\n📋  Rental applications (CRM)...");
  const app1 = await upsert(prisma.rentalApplication,
    { listingId: lst1.id, applicantId: kevin.id },
    { listingId: lst1.id, applicantId: kevin.id,
      message: "I am a software engineer at Safaricom with stable income. Looking for a long-term home near Westlands office. Available for viewing any weekend.",
      status: "REVIEWING" });
  const app2 = await upsert(prisma.rentalApplication,
    { listingId: lst1.id, applicantId: faith.id },
    { listingId: lst1.id, applicantId: faith.id,
      message: "HR Manager at Equity Bank, relocating from Mombasa. Can provide 3 months payslips and employer letter. Ready to move in July.",
      status: "SHORTLISTED", reviewerId: ADMIN_ID, reviewedAt: past(3) });
  const app3 = await upsert(prisma.rentalApplication,
    { listingId: lst1.id, applicantId: mike.id },
    { listingId: lst1.id, applicantId: mike.id,
      message: "Freelance graphic designer. Have proof of 12-month M-Pesa income averaging KES 95,000/month.",
      status: "PENDING" });
  const lst2db = await prisma.listing.findFirst({ where: { organizationId: ORG_ID, unitId: u104.id } });
  const app4 = await upsert(prisma.rentalApplication,
    { listingId: lst2db.id, applicantId: amina.id },
    { listingId: lst2db.id, applicantId: amina.id,
      message: "Teacher at Nairobi School. Seeking furnished 2BR for my family. Already tenanting with your portfolio at KR-A2.",
      status: "ACCEPTED", reviewerId: ADMIN_ID, reviewedAt: past(5) });
  const app5 = await upsert(prisma.rentalApplication,
    { listingId: lst2db.id, applicantId: david.id },
    { listingId: lst2db.id, applicantId: david.id,
      message: "Looking for unit for my nephew — I own Karen Residences through this platform. Interested in the furnished option.",
      status: "REJECTED", reviewerId: ADMIN_ID, reviewedAt: past(7),
      adminNotes: "Conflict of interest — applicant is also a property owner. Redirected." });
  console.log(`  ✓ App1 (Kevin/3BR REVIEWING), App2 (Faith/3BR SHORTLISTED), App3 (Mike/3BR PENDING)`);
  console.log(`  ✓ App4 (Amina/2BR ACCEPTED), App5 (David/2BR REJECTED)`);

  // ── 10. Tenant Screening Reports ─────────────────────────────────────────────
  console.log("\n🔍  Tenant screening reports...");
  const scr1 = await upsert(prisma.tenantScreeningReport,
    { applicationId: app1.id },
    { id: uid(), applicationId: app1.id,
      applicantName: "Kevin Waweru",
      nationalIdNumber: "34891234",
      score: 78, recommendation: "APPROVE",
      riskFlagsJson: JSON.stringify([]),
      notes: "Clean credit history. Employed at Safaricom for 3 years. No previous evictions.",
      status: "completed", generatedBy: ADMIN_ID });
  const scr2 = await upsert(prisma.tenantScreeningReport,
    { applicationId: app2.id },
    { id: uid(), applicationId: app2.id,
      applicantName: "Faith Ndungu",
      nationalIdNumber: "29873456",
      score: 91, recommendation: "APPROVE",
      riskFlagsJson: JSON.stringify([]),
      notes: "Excellent credit score. Employer verified. Previous landlord confirmed good standing.",
      status: "completed", generatedBy: ADMIN_ID });
  const scr3 = await upsert(prisma.tenantScreeningReport,
    { applicationId: app3.id },
    { id: uid(), applicationId: app3.id,
      applicantName: "Mike Kamau",
      nationalIdNumber: "38123456",
      score: 61, recommendation: "REVIEW",
      riskFlagsJson: JSON.stringify(["Irregular income", "No formal employment contract"]),
      notes: "Freelance income harder to verify. Bank statements show adequate average. Recommend 2-month deposit.",
      status: "completed", generatedBy: ADMIN_ID });
  const scr4 = await upsert(prisma.tenantScreeningReport,
    { applicationId: app4.id },
    { id: uid(), applicationId: app4.id,
      applicantName: "Amina Hassan",
      nationalIdNumber: "31556789",
      score: 88, recommendation: "APPROVE",
      riskFlagsJson: JSON.stringify([]),
      notes: "Existing tenant in good standing. Payment history confirmed — 0 late payments in 3 months.",
      status: "completed", generatedBy: ADMIN_ID });
  const scr5 = await upsert(prisma.tenantScreeningReport,
    { applicationId: app5.id },
    { id: uid(), applicationId: app5.id,
      applicantName: "David Mutua",
      score: 82, recommendation: "APPROVE",
      notes: "Application rejected on conflict of interest grounds, not screening result.",
      status: "completed", generatedBy: ADMIN_ID });
  console.log(`  ✓ Scr1 (Kevin 78), Scr2 (Faith 91), Scr3 (Mike 61 REVIEW), Scr4 (Amina 88), Scr5 (David 82)`);

  // ── 11. Wallets & Payouts ─────────────────────────────────────────────────────
  console.log("\n💳  Wallets & ledger entries...");
  const wGrace = await upsert(prisma.wallet, { ownerId: grace.id, ownerType: "tenant" },
    { id: uid(), ownerId: grace.id, ownerType: "tenant", walletType: "rent_wallet", currency: "KES" });
  const wJames = await upsert(prisma.wallet, { ownerId: james.id, ownerType: "tenant" },
    { id: uid(), ownerId: james.id, ownerType: "tenant", walletType: "rent_wallet", currency: "KES" });
  const wAmina = await upsert(prisma.wallet, { ownerId: amina.id, ownerType: "tenant" },
    { id: uid(), ownerId: amina.id, ownerType: "tenant", walletType: "rent_wallet", currency: "KES" });
  const wAdmin = await upsert(prisma.wallet, { ownerId: ADMIN_ID, ownerType: "organization" },
    { id: uid(), ownerId: ADMIN_ID, ownerType: "organization", walletType: "operating_wallet", currency: "KES" });
  const wDavid = await upsert(prisma.wallet, { ownerId: david.id, ownerType: "landlord" },
    { id: uid(), ownerId: david.id, ownerType: "landlord", walletType: "payout_wallet", currency: "KES" });

  const le1 = await upsert(prisma.ledgerEntry, { walletId: wGrace.id, description: "Rent Jun 2026 credit" },
    { id: uid(), walletId: wGrace.id, entryType: "CREDIT", amountKes: 55000,
      runningBalanceKes: 55000, description: "Rent Jun 2026 credit", referenceType: "transaction" });
  const le2 = await upsert(prisma.ledgerEntry, { walletId: wGrace.id, description: "Rent Jun 2026 debit" },
    { id: uid(), walletId: wGrace.id, entryType: "DEBIT", amountKes: 55000,
      runningBalanceKes: 0, description: "Rent Jun 2026 debit to landlord", referenceType: "payout" });
  const le3 = await upsert(prisma.ledgerEntry, { walletId: wJames.id, description: "Rent Jun 2026 credit" },
    { id: uid(), walletId: wJames.id, entryType: "CREDIT", amountKes: 40000,
      runningBalanceKes: 40000, description: "Rent Jun 2026 credit", referenceType: "transaction" });
  const le4 = await upsert(prisma.ledgerEntry, { walletId: wAdmin.id, description: "Platform fee Jun 2026" },
    { id: uid(), walletId: wAdmin.id, entryType: "CREDIT", amountKes: 2750,
      runningBalanceKes: 2750, description: "Platform fee 5% — Jun 2026", referenceType: "fee" });
  const le5 = await upsert(prisma.ledgerEntry, { walletId: wDavid.id, description: "Karen payout Jun 2026" },
    { id: uid(), walletId: wDavid.id, entryType: "CREDIT", amountKes: 85500,
      runningBalanceKes: 85500, description: "Payout Jun 2026 — Karen Residences (2 units)", referenceType: "payout" });
  console.log(`  ✓ 5 wallets: Grace, James, Amina, Admin, David`);
  console.log(`  ✓ 5 ledger entries seeded`);

  // ── 12. Escrow Accounts ───────────────────────────────────────────────────────
  console.log("\n🔒  Escrow accounts...");
  const esc1 = await upsert(prisma.escrowAccount, { leaseId: l1.id },
    { id: uid(), leaseId: l1.id, tenantId: grace.id, landlordId: ADMIN_ID,
      propertyId: prop.id, unitId: u101.id, amountKes: 110000, status: "HELD", heldAt: past(120) });
  const esc2 = await upsert(prisma.escrowAccount, { leaseId: l2.id },
    { id: uid(), leaseId: l2.id, tenantId: james.id, landlordId: ADMIN_ID,
      propertyId: prop.id, unitId: u102.id, amountKes: 80000, status: "HELD", heldAt: past(60) });
  const esc3 = await upsert(prisma.escrowAccount, { leaseId: lKrA2.id },
    { id: uid(), leaseId: lKrA2.id, tenantId: amina.id, landlordId: david.id,
      propertyId: prop2.id, unitId: krA2.id, amountKes: 76000, status: "HELD", heldAt: past(90) });
  const esc4 = await upsert(prisma.escrowAccount, { leaseId: lKrA3.id },
    { id: uid(), leaseId: lKrA3.id, tenantId: kevin.id, landlordId: david.id,
      propertyId: prop2.id, unitId: krA3.id, amountKes: 104000, status: "HELD", heldAt: past(45) });
  const esc5 = await upsert(prisma.escrowAccount, { leaseId: lKrB1.id },
    { id: uid(), leaseId: lKrB1.id, tenantId: faith.id, landlordId: david.id,
      propertyId: prop2.id, unitId: krB1.id, amountKes: 110000, status: "PENDING" });
  console.log(`  ✓ 5 escrow accounts (HELD: l1/l2/lKrA2/lKrA3, PENDING: lKrB1)`);

  // ── 13. Rent Invoices & Receipts ──────────────────────────────────────────────
  console.log("\n🧾  Rent invoices & receipts...");
  const inv1 = await upsert(prisma.rentInvoice, { invoiceNumber: "INV-2026-0001" },
    { id: uid(), leaseId: l1.id, tenantId: grace.id, landlordId: ADMIN_ID,
      propertyId: prop.id, unitId: u101.id, invoiceNumber: "INV-2026-0001",
      periodStart: new Date("2026-06-01"), periodEnd: new Date("2026-06-30"),
      dueDate: new Date("2026-06-05"), rentAmountKes: 55000,
      totalDueKes: 55000, amountPaidKes: 55000, balanceKes: 0,
      status: "paid", paymentMethod: "mpesa_paybill",
      mpesaReference: "RH78K3PLG9", paidAt: past(12) });
  const inv2 = await upsert(prisma.rentInvoice, { invoiceNumber: "INV-2026-0002" },
    { id: uid(), leaseId: l1.id, tenantId: grace.id, landlordId: ADMIN_ID,
      propertyId: prop.id, unitId: u101.id, invoiceNumber: "INV-2026-0002",
      periodStart: new Date("2026-05-01"), periodEnd: new Date("2026-05-31"),
      dueDate: new Date("2026-05-05"), rentAmountKes: 55000,
      totalDueKes: 55000, amountPaidKes: 55000, balanceKes: 0,
      status: "paid", paymentMethod: "mpesa_paybill", paidAt: past(44) });
  const inv3 = await upsert(prisma.rentInvoice, { invoiceNumber: "INV-2026-0003" },
    { id: uid(), leaseId: l2.id, tenantId: james.id, landlordId: ADMIN_ID,
      propertyId: prop.id, unitId: u102.id, invoiceNumber: "INV-2026-0003",
      periodStart: new Date("2026-06-01"), periodEnd: new Date("2026-06-30"),
      dueDate: new Date("2026-06-05"), rentAmountKes: 40000,
      totalDueKes: 40000, amountPaidKes: 40000, balanceKes: 0,
      status: "paid", paymentMethod: "bank_transfer_eft", paidAt: past(14) });
  const inv4 = await upsert(prisma.rentInvoice, { invoiceNumber: "INV-2026-0004" },
    { id: uid(), leaseId: lKrA2.id, tenantId: amina.id, landlordId: david.id,
      propertyId: prop2.id, unitId: krA2.id, invoiceNumber: "INV-2026-0004",
      periodStart: new Date("2026-06-01"), periodEnd: new Date("2026-06-30"),
      dueDate: new Date("2026-06-05"), rentAmountKes: 38000,
      totalDueKes: 38000, amountPaidKes: 38000, balanceKes: 0,
      status: "paid", paymentMethod: "mpesa_paybill", paidAt: past(11) });
  const inv5 = await upsert(prisma.rentInvoice, { invoiceNumber: "INV-2026-0005" },
    { id: uid(), leaseId: lKrA3.id, tenantId: kevin.id, landlordId: david.id,
      propertyId: prop2.id, unitId: krA3.id, invoiceNumber: "INV-2026-0005",
      periodStart: new Date("2026-06-01"), periodEnd: new Date("2026-06-30"),
      dueDate: new Date("2026-06-05"), rentAmountKes: 52000,
      lateFeeKes: 2600, totalDueKes: 54600, amountPaidKes: 0, balanceKes: 54600,
      status: "overdue" });
  console.log(`  ✓ INV-0001 (Grace Jun paid), INV-0002 (Grace May paid), INV-0003 (James Jun paid)`);
  console.log(`  ✓ INV-0004 (Amina Jun paid), INV-0005 (Kevin Jun OVERDUE)`);

  const rec1 = await upsert(prisma.rentReceipt, { receiptNumber: "REC-2026-0001" },
    { invoiceId: inv1.id, receiptNumber: "REC-2026-0001",
      tenantId: grace.id, landlordId: ADMIN_ID,
      propertyId: prop.id, unitId: u101.id,
      amountKes: 55000, paymentMethod: "mpesa_paybill",
      mpesaReference: "RH78K3PLG9", deliveryChannel: "email" });
  const rec2 = await upsert(prisma.rentReceipt, { receiptNumber: "REC-2026-0002" },
    { invoiceId: inv2.id, receiptNumber: "REC-2026-0002",
      tenantId: grace.id, landlordId: ADMIN_ID,
      propertyId: prop.id, unitId: u101.id,
      amountKes: 55000, paymentMethod: "mpesa_paybill", deliveryChannel: "sms" });
  const rec3 = await upsert(prisma.rentReceipt, { receiptNumber: "REC-2026-0003" },
    { invoiceId: inv3.id, receiptNumber: "REC-2026-0003",
      tenantId: james.id, landlordId: ADMIN_ID,
      propertyId: prop.id, unitId: u102.id,
      amountKes: 40000, paymentMethod: "bank_transfer_eft", deliveryChannel: "email" });
  const rec4 = await upsert(prisma.rentReceipt, { receiptNumber: "REC-2026-0004" },
    { invoiceId: inv4.id, receiptNumber: "REC-2026-0004",
      tenantId: amina.id, landlordId: david.id,
      propertyId: prop2.id, unitId: krA2.id,
      amountKes: 38000, paymentMethod: "mpesa_paybill", deliveryChannel: "whatsapp" });
  const rec5 = await upsert(prisma.rentReceipt, { receiptNumber: "REC-2026-0005" },
    { invoiceId: inv1.id, receiptNumber: "REC-2026-0005",
      tenantId: grace.id, landlordId: ADMIN_ID,
      propertyId: prop.id, unitId: u101.id,
      amountKes: 110000, paymentMethod: "bank_transfer_eft",
      notes: "Security deposit receipt — held in escrow" });
  console.log(`  ✓ 5 rent receipts (REC-0001 to REC-0005)`);

  // ── 14. Expenses (Accounting) ─────────────────────────────────────────────────
  console.log("\n💸  Expenses...");
  const expenses = [
    { cat: "maintenance", desc: "Emergency plumber — Unit 101 faucet repair", amt: 4500, prop: prop, unit: u101 },
    { cat: "maintenance", desc: "Electrical repair — Unit 102 surge damage", amt: 8500, prop: prop, unit: u102 },
    { cat: "cleaning",    desc: "Deep clean Unit 103 post-checkout (Fatuma Said)", amt: 3000, prop: prop, unit: u103 },
    { cat: "security",    desc: "CCTV system monthly maintenance contract", amt: 12000, prop: prop, unit: null },
    { cat: "utilities",   desc: "Common area electricity — Westlands Heights Jun 2026", amt: 6800, prop: prop, unit: null },
    { cat: "maintenance", desc: "Lawn mowing and garden maintenance — Karen Residences", amt: 5000, prop: prop2, unit: null },
    { cat: "admin",       desc: "Property insurance premium Q2 2026 — Westlands Heights", amt: 18000, prop: prop, unit: null },
    { cat: "repairs",     desc: "Door lock replacement — Unit 103 (short-stay)", amt: 2200, prop: prop, unit: u103 },
  ];
  const expIds = [];
  for (const e of expenses) {
    const ex = await upsert(prisma.expense,
      { description: e.desc, organizationId: ORG_ID },
      { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID,
        propertyId: e.prop.id, unitId: e.unit ? e.unit.id : null,
        category: e.cat, description: e.desc, amountKes: e.amt,
        date: past(Math.floor(Math.random() * 30) + 1),
        paymentMethod: "bank_transfer_eft", createdBy: ADMIN_ID });
    expIds.push(ex.id);
    console.log(`  ✓ ${e.cat}: ${e.desc.substring(0, 45)}… KES ${e.amt.toLocaleString()}`);
  }

  // ── 15. Accounting — Monthly Summaries & Financial Reports ───────────────────
  console.log("\n📊  Monthly rent summaries & financial reports...");
  const months = [
    { year: 2026, month: 1, income: 93000, expenses: 22000 },
    { year: 2026, month: 2, income: 93000, expenses: 18500 },
    { year: 2026, month: 3, income: 133000, expenses: 31000 },
    { year: 2026, month: 4, income: 183000, expenses: 28000 },
    { year: 2026, month: 5, income: 223000, expenses: 35000 },
    { year: 2026, month: 6, income: 223000, expenses: 42500 },
  ];
  for (const m of months) {
    await upsert(prisma.monthlyRentSummary,
      { organizationId: ORG_ID, periodYear: m.year, periodMonth: m.month },
      { organizationId: ORG_ID, branchId: BRANCH_ID,
        periodYear: m.year, periodMonth: m.month,
        totalRentDue: m.income, totalCollected: m.income,
        totalArrears: 0, totalExpenses: m.expenses,
        openingBalance: 0, closingBalance: m.income - m.expenses,
        notes: `Auto-generated summary for ${m.year}-${String(m.month).padStart(2,"0")}` });
  }
  console.log(`  ✓ Monthly summaries Jan–Jun 2026`);

  const fr1 = await upsert(prisma.financialReport,
    { organizationId: ORG_ID, reportType: "monthly_pnl", periodStart: new Date("2026-06-01") },
    { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID,
      reportType: "monthly_pnl", periodStart: new Date("2026-06-01"), periodEnd: new Date("2026-06-30"),
      totalIncomeKes: 223000, totalExpenseKes: 42500, netKes: 180500,
      reportJson: JSON.stringify({ units: 8, occupied: 5, vacancyRate: 0.375, collectionRate: 1.0 }),
      generatedBy: ADMIN_ID });
  const fr2 = await upsert(prisma.financialReport,
    { organizationId: ORG_ID, reportType: "ytd_summary", periodStart: new Date("2026-01-01") },
    { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID,
      reportType: "ytd_summary", periodStart: new Date("2026-01-01"), periodEnd: new Date("2026-06-30"),
      totalIncomeKes: 948000, totalExpenseKes: 177000, netKes: 771000,
      reportJson: JSON.stringify({ totalProperties: 2, totalUnits: 11, avgOccupancy: 0.55 }),
      generatedBy: ADMIN_ID });
  console.log(`  ✓ Financial reports: Jun 2026 P&L, YTD Summary`);

  // ── 16. Dashboard Widgets ─────────────────────────────────────────────────────
  console.log("\n📱  Dashboard widgets...");
  const widgetDefs = [
    { type: "occupancy_rate",    label: "Occupancy Rate",          pos: 0 },
    { type: "rent_collected",    label: "Rent Collected (Jun)",     pos: 1 },
    { type: "open_tickets",      label: "Open Service Requests",    pos: 2 },
    { type: "lease_renewals",    label: "Upcoming Lease Renewals",  pos: 3 },
    { type: "vacancy_units",     label: "Vacant Units",             pos: 4 },
    { type: "revenue_trend",     label: "Revenue Trend",            pos: 5 },
    { type: "expense_breakdown", label: "Expense Breakdown",        pos: 6 },
  ];
  for (const w of widgetDefs) {
    await upsert(prisma.dashboardWidget,
      { userId: ADMIN_ID, widgetType: w.type },
      { userId: ADMIN_ID, organizationId: ORG_ID,
        widgetType: w.type, label: w.label, position: w.pos, isVisible: true });
  }
  console.log(`  ✓ 7 dashboard widgets configured for admin`);

  // ── 17. Live Intelligence Snapshots (MoveScore & Intel) ───────────────────────
  console.log("\n🧠  Live intelligence snapshots...");
  const snapshots = [
    { type: "occupancy_rate",       label: "Portfolio Occupancy Rate",        val: 63.6,  prev: 55.0, trend: "UP" },
    { type: "rent_collection_rate", label: "Rent Collection Rate Jun 2026",   val: 95.5,  prev: 92.3, trend: "UP" },
    { type: "avg_response_time",    label: "Avg Maintenance Response (hours)",val: 18.4,  prev: 24.1, trend: "DOWN" },
    { type: "vacancy_rate",         label: "Vacancy Rate",                    val: 36.4,  prev: 45.5, trend: "DOWN" },
    { type: "net_revenue_kes",      label: "Net Revenue Jun 2026 (KES)",      val: 180500, prev: 158000, trend: "UP" },
    { type: "churn_risk_score",     label: "Tenant Churn Risk Score",         val: 22.0,  prev: 30.0, trend: "DOWN" },
  ];
  for (const s of snapshots) {
    await upsert(prisma.liveIntelligenceSnapshot,
      { organizationId: ORG_ID, snapshotType: s.type },
      { organizationId: ORG_ID, snapshotType: s.type, label: s.label,
        value: s.val, previousValue: s.prev, trend: s.trend,
        dataJson: { period: "2026-06" } });
  }
  console.log(`  ✓ 6 intelligence snapshots (occupancy, collection, response time, vacancy, revenue, churn)`);

  // ── 18. MoveScore Records ─────────────────────────────────────────────────────
  console.log("\n🎯  MoveScore records...");
  const movescores = [
    { propId: prop.id,  unitId: u101.id, score: 15.2, risk: "LOW",    predicted: days(245) },
    { propId: prop.id,  unitId: u102.id, score: 78.4, risk: "HIGH",   predicted: days(35)  },
    { propId: prop.id,  unitId: u103.id, score: 5.0,  risk: "LOW",    predicted: null       },
    { propId: prop2.id, unitId: krA2.id, score: 22.1, risk: "LOW",    predicted: days(275) },
    { propId: prop2.id, unitId: krA3.id, score: 55.3, risk: "MEDIUM", predicted: days(130) },
    { propId: prop2.id, unitId: krB2.id, score: 3.0,  risk: "LOW",    predicted: null       },
  ];
  for (const m of movescores) {
    await upsert(prisma.moveScoreRecord,
      { propertyId: m.propId, unitId: m.unitId },
      { propertyId: m.propId, unitId: m.unitId,
        score: m.score, riskLevel: m.risk, predictedDate: m.predicted,
        factorsJson: { paymentHistory: 0.4, maintenanceRequests: 0.2, communicationScore: 0.4 } });
  }
  console.log(`  ✓ 6 MoveScore records (Low/Medium/High risk across portfolio)`);

  // ── 19. Rent Score Records ────────────────────────────────────────────────────
  console.log("\n⭐  Rent score records...");
  const rentscores = [
    { tid: grace.id, score: 94, cons: 0.97, onTime: 4, late: 0, arrears: 0,   earlyDays: 3 },
    { tid: james.id, score: 78, cons: 0.83, onTime: 2, late: 0, arrears: 0,   earlyDays: 0 },
    { tid: amina.id, score: 88, cons: 0.92, onTime: 3, late: 0, arrears: 0,   earlyDays: 1 },
    { tid: kevin.id, score: 55, cons: 0.60, onTime: 0, late: 1, arrears: 54600, earlyDays: 0 },
    { tid: faith.id, score: 82, cons: 0.88, onTime: 2, late: 0, arrears: 0,   earlyDays: 2 },
  ];
  for (const r of rentscores) {
    await upsert(prisma.rentScoreRecord, { tenantId: r.tid },
      { tenantId: r.tid, score: r.score, consistency: r.cons,
        totalPaidOnTime: r.onTime, totalPaidLate: r.late,
        totalArrears: r.arrears, averageDaysEarly: r.earlyDays });
  }
  console.log(`  ✓ Grace 94, James 78, Amina 88, Kevin 55 (arrears), Faith 82`);

  // ── 20. Compliance Numbers ────────────────────────────────────────────────────
  console.log("\n✅  Compliance numbers...");
  const compls = [
    { tid: grace.id, cid: "CPN-2026-WH-001", propId: prop.id,  unitId: u101.id, exp: days(365) },
    { tid: james.id, cid: "CPN-2026-WH-002", propId: prop.id,  unitId: u102.id, exp: days(305) },
    { tid: amina.id, cid: "CPN-2026-KR-001", propId: prop2.id, unitId: krA2.id, exp: days(275) },
    { tid: kevin.id, cid: "CPN-2026-KR-002", propId: prop2.id, unitId: krA3.id, exp: days(320) },
    { tid: faith.id, cid: "CPN-2026-KR-003", propId: prop2.id, unitId: krB1.id, exp: days(379) },
  ];
  const compNums = [];
  for (const c of compls) {
    const cn = await upsert(prisma.complianceNumber, { complianceId: c.cid },
      { organizationId: ORG_ID, tenantId: c.tid, propertyId: c.propId, unitId: c.unitId,
        complianceId: c.cid, status: "ACTIVE", expiresAt: c.exp });
    compNums.push(cn);
    console.log(`  ✓ ${c.cid}: ${cn.id}`);
  }

  for (const cn of compNums) {
    await upsert(prisma.complianceRecord, { complianceNumberId: cn.id, recordType: "identity_check" },
      { complianceNumberId: cn.id, recordType: "identity_check", status: "PASSED",
        description: "National ID verified against IPRS database.", checkedBy: ADMIN_ID });
  }
  console.log(`  ✓ 5 compliance records created`);

  // ── 21. MicroBehavior Records ─────────────────────────────────────────────────
  console.log("\n🧩  MicroBehavior records...");
  const behaviors = [
    { tid: grace.id, type: "payment", label: "Paid 3 days early", score: 1.0 },
    { tid: grace.id, type: "communication", label: "Responded to notice within 1 hour", score: 0.9 },
    { tid: james.id, type: "payment", label: "Paid on due date", score: 0.7 },
    { tid: james.id, type: "maintenance", label: "Raised 2 maintenance requests this quarter", score: 0.5 },
    { tid: amina.id, type: "payment", label: "Paid 1 day early", score: 0.8 },
    { tid: amina.id, type: "communication", label: "Proactively reported water leak", score: 1.0 },
    { tid: kevin.id, type: "payment", label: "Payment overdue 11 days", score: -0.8 },
    { tid: kevin.id, type: "communication", label: "Not responding to payment reminders", score: -0.5 },
    { tid: faith.id, type: "payment", label: "Paid 2 days early", score: 0.8 },
    { tid: faith.id, type: "communication", label: "Pre-confirmed move-in date 2 weeks ahead", score: 0.9 },
  ];
  for (const b of behaviors) {
    await upsert(prisma.microBehaviorRecord,
      { tenantId: b.tid, label: b.label },
      { tenantId: b.tid, behaviorType: b.type, label: b.label, score: b.score });
  }
  console.log(`  ✓ 10 MicroBehavior records across 5 tenants`);

  // ── 22. Audit Logs ────────────────────────────────────────────────────────────
  console.log("\n📋  Audit logs...");
  const auditLogs = [
    { uid: ADMIN_ID, role: "admin", action: "LEASE_CREATED",    rt: "Lease",    rid: l1.id },
    { uid: ADMIN_ID, role: "admin", action: "LEASE_ACTIVATED",  rt: "Lease",    rid: l1.id },
    { uid: ADMIN_ID, role: "admin", action: "KYC_APPROVED",     rt: "KycDocument", rid: kyc1.id },
    { uid: ADMIN_ID, role: "admin", action: "PROVIDER_APPROVED",rt: "ServiceProvider", rid: prov1.id },
    { uid: grace.id, role: "tenant","action": "SR_CREATED",     rt: "ServiceRequest", rid: sr1.id },
    { uid: james.id, role: "tenant","action": "SR_CREATED",     rt: "ServiceRequest", rid: sr2.id },
    { uid: ADMIN_ID, role: "admin", action: "LISTING_PUBLISHED",rt: "Listing",   rid: lst1.id },
    { uid: ADMIN_ID, role: "admin", action: "VACATING_ACKNOWLEDGED", rt: "VacatingNotice", rid: vn.id },
  ];
  for (const a of auditLogs) {
    await upsert(prisma.auditLog, { userId: a.uid, action: a.action, resourceId: a.rid },
      { id: uid(), userId: a.uid, role: a.role, action: a.action,
        resourceType: a.rt, resourceId: a.rid, orgId: ORG_ID, branchId: BRANCH_ID });
  }
  console.log(`  ✓ 8 audit log entries`);

  // ── 23. Utility Meters, Readings & Disputes ───────────────────────────────────
  console.log("\n⚡  Utility meters, readings & disputes...");
  const meter1 = await upsert(prisma.utilityMeter,
    { meterNumber: "ELEC-101-WH" },
    { unitId: u101.id, meterNumber: "ELEC-101-WH", type: "ELECTRICITY",
      billingModel: "SUB_METERED_MANUAL", pricePerUnitKes: 25, isActive: true });
  const meter2 = await upsert(prisma.utilityMeter,
    { meterNumber: "WATER-101-WH" },
    { unitId: u101.id, meterNumber: "WATER-101-WH", type: "WATER",
      billingModel: "FLAT_RATE", isActive: true });
  const meter3 = await upsert(prisma.utilityMeter,
    { meterNumber: "ELEC-102-WH" },
    { unitId: u102.id, meterNumber: "ELEC-102-WH", type: "ELECTRICITY",
      billingModel: "SUB_METERED_MANUAL", pricePerUnitKes: 25, isActive: true });
  const meter4 = await upsert(prisma.utilityMeter,
    { meterNumber: "ELEC-KRA2" },
    { unitId: krA2.id, meterNumber: "ELEC-KRA2", type: "ELECTRICITY",
      billingModel: "SUB_METERED_MANUAL", pricePerUnitKes: 22, isActive: true });
  const meter5 = await upsert(prisma.utilityMeter,
    { meterNumber: "WATER-KRA2" },
    { unitId: krA2.id, meterNumber: "WATER-KRA2", type: "WATER",
      billingModel: "FLAT_RATE", isActive: true });
  console.log(`  ✓ 5 utility meters created`);

  const rdg1 = await upsert(prisma.utilityReading,
    { meterId: meter1.id, readingDate: new Date("2026-06-01") },
    { meterId: meter1.id, readingDate: new Date("2026-06-01"),
      previousReading: 1840, currentReading: 2015, consumption: 175,
      pricePerUnitKes: 25, costKes: 4375, createdBy: ADMIN_ID });
  const rdg2 = await upsert(prisma.utilityReading,
    { meterId: meter1.id, readingDate: new Date("2026-05-01") },
    { meterId: meter1.id, readingDate: new Date("2026-05-01"),
      previousReading: 1680, currentReading: 1840, consumption: 160,
      pricePerUnitKes: 25, costKes: 4000, createdBy: ADMIN_ID });
  const rdg3 = await upsert(prisma.utilityReading,
    { meterId: meter3.id, readingDate: new Date("2026-06-01") },
    { meterId: meter3.id, readingDate: new Date("2026-06-01"),
      previousReading: 920, currentReading: 1340, consumption: 420,
      pricePerUnitKes: 25, costKes: 10500, isDisputed: true,
      disputeStatus: "OPEN", createdBy: ADMIN_ID });
  const rdg4 = await upsert(prisma.utilityReading,
    { meterId: meter2.id, readingDate: new Date("2026-06-01") },
    { meterId: meter2.id, readingDate: new Date("2026-06-01"),
      previousReading: 0, currentReading: 0,
      consumption: 1, flatRateAmountKes: 1500, costKes: 1500, createdBy: ADMIN_ID });
  const rdg5 = await upsert(prisma.utilityReading,
    { meterId: meter4.id, readingDate: new Date("2026-06-01") },
    { meterId: meter4.id, readingDate: new Date("2026-06-01"),
      previousReading: 340, currentReading: 460, consumption: 120,
      pricePerUnitKes: 22, costKes: 2640, createdBy: ADMIN_ID });
  console.log(`  ✓ 5 utility readings (Jun & May 2026)`);

  const disp1 = await upsert(prisma.utilityDispute,
    { readingId: rdg3.id },
    { readingId: rdg3.id, raisedByUserId: james.id,
      reason: "Reading of 420 units is impossibly high. Previous months averaged 120 units. Requesting re-read of meter ELEC-102-WH.",
      status: "OPEN" });
  console.log(`  ✓ Dispute: James disputes Unit 102 electric reading (420 units, OPEN): ${disp1.id}`);

  // ── 24. More Service Requests, History, Quotes, Assignments ──────────────────
  console.log("\n🔧  More service requests, history & quotes...");
  const sr5 = await upsert(prisma.serviceRequest,
    { title: "Deep clean Unit 103 post checkout — Fatuma Said" },
    { organizationId: ORG_ID, branchId: BRANCH_ID,
      propertyId: prop.id, unitId: u103.id,
      title: "Deep clean Unit 103 post checkout — Fatuma Said",
      description: "Full post-checkout deep clean required before next booking. Kitchen, bathroom, and linen change. Fatuma Said checked out Jun 11.",
      category: "cleaning", priority: "HIGH",
      status: "COMPLETED", completedDate: past(5),
      createdBy: ADMIN_ID });
  const sr6 = await upsert(prisma.serviceRequest,
    { title: "CCTV camera offline — Building entrance" },
    { organizationId: ORG_ID, branchId: BRANCH_ID,
      propertyId: prop.id,
      title: "CCTV camera offline — Building entrance",
      description: "Main entrance CCTV camera has been offline since yesterday evening. Security guard reported it. Urgent fix before night patrol.",
      category: "security", priority: "URGENT",
      status: "IN_PROGRESS", dueAt: days(1),
      createdBy: ADMIN_ID });
  const sr7 = await upsert(prisma.serviceRequest,
    { title: "Lawn maintenance — Karen Residences" },
    { organizationId: ORG_ID, branchId: BRANCH_ID,
      propertyId: prop2.id,
      title: "Lawn maintenance — Karen Residences",
      description: "Scheduled monthly lawn mowing and hedge trimming for Karen Residences. Coordinate with Amina and Kevin for access.",
      category: "cleaning", priority: "LOW",
      status: "DRAFT", dueAt: days(7),
      createdBy: ADMIN_ID });
  console.log(`  ✓ SR5 (Deep clean COMPLETED), SR6 (CCTV URGENT IN_PROGRESS), SR7 (Lawn DRAFT)`);

  // SR History
  const srHistDefs = [
    { srId: sr1.id, by: grace.id, from: "DRAFT",       to: "SUBMITTED",   note: "Tenant submitted via app" },
    { srId: sr1.id, by: ADMIN_ID, from: "SUBMITTED",   to: "APPROVED",    note: "Approved by admin" },
    { srId: sr1.id, by: ADMIN_ID, from: "APPROVED",    to: "IN_PROGRESS", note: "Peter Njoroge assigned" },
    { srId: sr2.id, by: james.id, from: "DRAFT",       to: "SUBMITTED",   note: "Submitted via mobile app" },
    { srId: sr2.id, by: ADMIN_ID, from: "SUBMITTED",   to: "APPROVED",    note: "Urgent — approved immediately" },
    { srId: sr3.id, by: ADMIN_ID, from: "DRAFT",       to: "IN_PROGRESS", note: "Staff handled in-house" },
    { srId: sr3.id, by: ADMIN_ID, from: "IN_PROGRESS", to: "COMPLETED",   note: "Lock lubricated and adjusted" },
  ];
  for (const h of srHistDefs) {
    await upsert(prisma.serviceRequestHistory,
      { serviceRequestId: h.srId, fromStatus: h.from, toStatus: h.to },
      { serviceRequestId: h.srId, changedBy: h.by, fromStatus: h.from, toStatus: h.to, note: h.note });
  }
  console.log(`  ✓ 7 service request history records`);

  // SR Quotes
  const q1 = await upsert(prisma.serviceRequestQuote,
    { serviceRequestId: sr1.id, submittedBy: prov1.id },
    { serviceRequestId: sr1.id, submittedBy: prov1.id,
      amount: 4500, scopeDescription: "Replace both hot and cold taps. Labour + fittings included. Warranty 3 months.",
      validUntil: days(7), status: "APPROVED" });
  const q2 = await upsert(prisma.serviceRequestQuote,
    { serviceRequestId: sr2.id, submittedBy: prov2.id },
    { serviceRequestId: sr2.id, submittedBy: prov2.id,
      amount: 8500, scopeDescription: "Replace 3 faulty sockets, test circuit breaker, install surge protector.",
      validUntil: days(5), status: "APPROVED" });
  const q3 = await upsert(prisma.serviceRequestQuote,
    { serviceRequestId: sr6.id, submittedBy: prov1.id },
    { serviceRequestId: sr6.id, submittedBy: prov1.id,
      amount: 3200, scopeDescription: "CCTV camera cable fault — replace cable and reconfigure DVR.",
      validUntil: days(3), status: "PENDING" });
  const q4 = await upsert(prisma.serviceRequestQuote,
    { serviceRequestId: sr7.id, submittedBy: ADMIN_ID },
    { serviceRequestId: sr7.id, submittedBy: ADMIN_ID,
      amount: 5000, scopeDescription: "Monthly lawn mowing, hedge trimming, garden cleanup. Scheduled first Monday of each month.",
      validUntil: days(14), status: "PENDING" });
  const q5 = await upsert(prisma.serviceRequestQuote,
    { serviceRequestId: sr5.id, submittedBy: ADMIN_ID },
    { serviceRequestId: sr5.id, submittedBy: ADMIN_ID,
      amount: 3000, scopeDescription: "Post-checkout deep clean: kitchen, bathroom, bedrooms, linen change.",
      status: "APPROVED" });
  console.log(`  ✓ 5 service request quotes (Q1 approved, Q2 approved, Q3/Q4/Q5 pending)`);

  // SR Assignments (Manager Queue)
  await upsert(prisma.serviceRequestAssignment,
    { serviceRequestId: sr1.id, assignedTo: prov1.id },
    { serviceRequestId: sr1.id, assignedTo: prov1.id,
      assignedBy: ADMIN_ID, role: "primary", acceptedAt: past(2) });
  await upsert(prisma.serviceRequestAssignment,
    { serviceRequestId: sr2.id, assignedTo: prov2.id },
    { serviceRequestId: sr2.id, assignedTo: prov2.id,
      assignedBy: ADMIN_ID, role: "primary" });
  await upsert(prisma.serviceRequestAssignment,
    { serviceRequestId: sr6.id, assignedTo: prov1.id },
    { serviceRequestId: sr6.id, assignedTo: prov1.id,
      assignedBy: ADMIN_ID, role: "primary" });
  await upsert(prisma.serviceRequestAssignment,
    { serviceRequestId: sr4.id, assignedTo: peter.id },
    { serviceRequestId: sr4.id, assignedTo: peter.id,
      assignedBy: ADMIN_ID, role: "supervisor" });
  await upsert(prisma.serviceRequestAssignment,
    { serviceRequestId: sr7.id, assignedTo: ADMIN_ID },
    { serviceRequestId: sr7.id, assignedTo: ADMIN_ID,
      assignedBy: ADMIN_ID, role: "primary" });
  console.log(`  ✓ 5 SR assignments (Manager Queue)`);

  // ── 25. Provider Performance ──────────────────────────────────────────────────
  console.log("\n📈  Provider performance...");
  await upsert(prisma.serviceProviderPerformance, { providerId: prov1.id },
    { providerId: prov1.id, responseTimeSec: 1800, completionTimeSec: 7200,
      disputeRate: 0.02, reassignmentRate: 0.0, cancellationRate: 0.05,
      reworkRate: 0.03, totalJobsCompleted: 24 });
  await upsert(prisma.serviceProviderPerformance, { providerId: prov2.id },
    { providerId: prov2.id, responseTimeSec: 900, completionTimeSec: 5400,
      disputeRate: 0.01, reassignmentRate: 0.0, cancellationRate: 0.02,
      reworkRate: 0.01, totalJobsCompleted: 31 });
  console.log(`  ✓ Peter (24 jobs, 2hr response), Diana (31 jobs, 15min response)`);

  // ── 26. More Service Providers ────────────────────────────────────────────────
  console.log("\n👷  More service providers...");
  const provUser3 = await upsert(prisma.appUser, { email: "james.mwangi.pro@demo.ke" },
    { id: uid(), email: "james.mwangi.pro@demo.ke", fullName: "James Mwangi",
      phone: "+254788001001", passwordHash: pw, status: "active", verificationLevel: "IDENTITY_VERIFIED" });
  const provUser4 = await upsert(prisma.appUser, { email: "lucy.awino.pro@demo.ke" },
    { id: uid(), email: "lucy.awino.pro@demo.ke", fullName: "Lucy Awino",
      phone: "+254788002002", passwordHash: pw, status: "active", verificationLevel: "IDENTITY_VERIFIED" });
  const provUser5 = await upsert(prisma.appUser, { email: "hassan.omar.pro@demo.ke" },
    { id: uid(), email: "hassan.omar.pro@demo.ke", fullName: "Hassan Omar",
      phone: "+254788003003", passwordHash: pw, status: "active", verificationLevel: "COMPLIANCE_VERIFIED" });

  const prov3 = await upsert(prisma.serviceProvider, { userId: provUser3.id },
    { userId: provUser3.id, organizationId: ORG_ID, category: "LANDLORD_PREFERRED",
      status: "ACTIVE", specializations: ["Lawn mowing", "Garden landscaping", "Tree pruning"],
      coverageAreas: ["Karen", "Langata", "Lavington", "Spring Valley"],
      bio: "Certified horticulturist. 6 years serving residential estates in Nairobi South.",
      verificationLevel: "Standard", trustScore: 79, approvedBy: ADMIN_ID, approvedAt: past(20) });
  const prov4 = await upsert(prisma.serviceProvider, { userId: provUser4.id },
    { userId: provUser4.id, organizationId: ORG_ID, category: "VERIFIED_MARKETPLACE",
      status: "ACTIVE", specializations: ["Deep cleaning", "Post-checkout cleaning", "Move-in cleaning"],
      coverageAreas: ["Westlands", "Kilimani", "Hurlingham", "Upperhill"],
      bio: "Professional cleaning company. 15-person team, KEBS certified. Same-day service available.",
      verificationLevel: "Enhanced", trustScore: 85, approvedBy: ADMIN_ID, approvedAt: past(15) });
  const prov5 = await upsert(prisma.serviceProvider, { userId: provUser5.id },
    { userId: provUser5.id, organizationId: ORG_ID, category: "AGENCY_PREFERRED",
      status: "PENDING_APPROVAL", specializations: ["CCTV installation", "Alarm systems", "Gate automation"],
      coverageAreas: ["Nairobi Metro"],
      bio: "Security systems integrator. Covers all major residential estates.",
      verificationLevel: "Unverified", trustScore: 0 });
  console.log(`  ✓ James Mwangi (gardening, ACTIVE), Lucy Awino (cleaning, ACTIVE), Hassan Omar (CCTV, PENDING)`);

  // ── 27. Nightgrab Other Charges ───────────────────────────────────────────────
  console.log("\n🌙  Nightgrab charges (short-stay other charges)...");
  const charges = [
    { name: "Late Checkout Fee", desc: "Checked out at 14:00 instead of 11:00", amt: 2000, type: "LATE_FEE", refund: false },
    { name: "Damage — TV Remote", desc: "TV remote found cracked on checkout", amt: 1500, type: "DAMAGE", refund: false },
    { name: "Airport Transfer", desc: "Requested airport transfer to JKIA — Uber XL arranged", amt: 3500, type: "SERVICE", refund: false },
    { name: "Extra Bed Setup", desc: "Requested extra rollaway bed for 3rd guest", amt: 1000, type: "SERVICE", refund: false },
    { name: "Security Deposit", desc: "Refundable deposit collected at check-in", amt: 5000, type: "DEPOSIT", refund: true },
  ];
  for (const c of charges) {
    await upsert(prisma.otherCharge,
      { shortStayId: ssp.id, name: c.name },
      { shortStayId: ssp.id, bookingId: booking1.id,
        name: c.name, description: c.desc,
        amountKes: c.amt, chargeType: c.type, isRefundable: c.refund });
  }
  console.log(`  ✓ 5 other charges (late fee, damage, airport, extra bed, deposit)`);

  // ── 28. QR Access Logs ────────────────────────────────────────────────────────
  console.log("\n📱  QR access logs...");
  const qrLogs = [
    { token: "QR-DEMO-NADIA-WESTLANDS-2026",  uid: null,      type: "entry", granted: true,  reason: "Application viewed — listing scan" },
    { token: "QR-DEMO-ROBERT-WESTLANDS-2026", uid: null,      type: "entry", granted: true,  reason: "Identity verified — listing scan" },
    { token: "QR-DEMO-SUSAN-WESTLANDS-2026",  uid: null,      type: "entry", granted: true,  reason: "Application submitted after scan" },
    { token: "QR-DEMO-NADIA-WESTLANDS-2026",  uid: null,      type: "entry", granted: false, reason: "Duplicate scan — already applied" },
    { token: "QR-DEMO-ROBERT-WESTLANDS-2026", uid: null,      type: "entry", granted: true,  reason: "Second view — property details" },
    { token: "QR-DEMO-SUSAN-WESTLANDS-2026",  uid: faith.id,  type: "gate",  granted: true,  reason: "Staff access — property tour escort" },
    { token: "QR-DEMO-NADIA-WESTLANDS-2026",  uid: ADMIN_ID,  type: "entry", granted: true,  reason: "Admin verification scan" },
    { token: "QR-DEMO-ROBERT-WESTLANDS-2026", uid: peter.id,  type: "gate",  granted: true,  reason: "Provider access — unit inspection" },
  ];
  for (const l of qrLogs) {
    await prisma.qrAccessLog.create({ data: {
      qrToken: l.token, userId: l.uid, accessType: l.type,
      granted: l.granted, reason: l.reason } });
  }
  console.log(`  ✓ 8 QR access log entries (grants and denials)`);

  // ── 29. More Visitors & Logs ──────────────────────────────────────────────────
  console.log("\n👣  More visitors...");
  const v4 = await upsert(prisma.visitor,
    { phone: "+254704667788", propertyId: prop.id },
    { organizationId: ORG_ID, propertyId: prop.id, unitId: u102.id,
      name: "Dr. Patricia Kamau", phone: "+254704667788",
      email: "patricia.kamau@demo.ke", idNumber: "22456789",
      notes: "James Kariuki's GP — routine home visit for tenant health check-in." });
  const v5 = await upsert(prisma.visitor,
    { phone: "+254705778899", propertyId: prop2.id },
    { organizationId: ORG_ID, propertyId: prop2.id, unitId: krA3.id,
      name: "Tony Muthui (Plumber)", phone: "+254705778899",
      idNumber: "35678901",
      notes: "Kevin Waweru's personal plumber. Called by tenant." });
  const v6 = await upsert(prisma.visitor,
    { phone: "+254706889900", propertyId: prop.id },
    { organizationId: ORG_ID, propertyId: prop.id,
      name: "Faith Ndungu (Prospective Tenant)", phone: "+254706889900",
      email: faith.email,
      notes: "Viewing Unit 201 — shortlisted application." });
  await prisma.visitorLog.create({ data: {
    id: uid(), visitorId: v4.id, propertyId: prop.id, unitId: u102.id,
    purpose: "GP home visit for tenant", approvalStatus: "APPROVED",
    approvalMethod: "MANUAL", notes: "GP confirmed by tenant James. ID verified.",
    authorizedBy: james.id, idVerified: true } });
  await prisma.visitorLog.create({ data: {
    id: uid(), visitorId: v6.id, propertyId: prop.id,
    purpose: "Property viewing — Unit 201", approvalStatus: "APPROVED",
    approvalMethod: "QR_CODE", notes: "Viewing accompanied by admin.",
    authorizedBy: ADMIN_ID, idVerified: true } });
  console.log(`  ✓ 3 more visitors (Dr Patricia, Tony, Faith viewing) + 2 visitor logs`);

  // ── 30. Move-Out Inspection & Deposit Refund (Vacating flow) ─────────────────
  console.log("\n🔍  Move-out inspection & deposit refund (James Kariuki)...");
  const insp = await upsert(prisma.moveOutInspection,
    { vacatingNoticeId: vn.id },
    { vacatingNoticeId: vn.id, organizationId: ORG_ID,
      scheduledDate: days(7), status: "PROPOSED",
      notes: "Move-out inspection for James Kariuki — Unit 102. Inspector: Samuel Otieno." });

  const insp_ded = await upsert(prisma.inspectionDeduction,
    { inspectionId: insp.id, description: "Small hole in living room wall (picture hook)" },
    { inspectionId: insp.id, description: "Small hole in living room wall (picture hook)",
      amount: 2500, category: "damage", responsibility: "tenant" });

  // Three worked examples of the Dynamic Inspection & Deposit Deduction System's
  // evidence-backed deduction workflow (spec: "Evidence Requirements" + "Tenant Review & Dispute").
  //
  // Example 1 — DAMAGE: requires before/after photos, accepted by the tenant.
  const insp_ded_damage = await upsert(prisma.inspectionDeduction,
    { inspectionId: insp.id, description: "Cracked kitchen countertop tile" },
    { inspectionId: insp.id, description: "Cracked kitchen countertop tile",
      amount: 4500, category: "DAMAGE", responsibility: "TENANT", status: "accepted",
      beforePhotoUrl: "https://cdn.secureliving.app/demo/unit102-counter-movein.jpg",
      afterPhotoUrl: "https://cdn.secureliving.app/demo/unit102-counter-moveout.jpg",
      repairQuoteUrl: "https://cdn.secureliving.app/demo/quotes/counter-repair-Q1029.pdf" });

  // Example 2 — UTILITY_BALANCE: requires a bill/meter/invoice reference, disputed by the tenant.
  const insp_ded_utility = await upsert(prisma.inspectionDeduction,
    { inspectionId: insp.id, description: "Outstanding water bill at handover" },
    { inspectionId: insp.id, description: "Outstanding water bill at handover",
      amount: 1800, category: "UTILITY_BALANCE", responsibility: "TENANT", status: "disputed",
      billOrMeterRef: "NCWSC-INV-88213",
      disputeNote: "This bill covers a period after I moved out — please check the meter reading date." });

  // Example 3 — CLEANING: requires an inspector note, still pending tenant review.
  const insp_ded_cleaning = await upsert(prisma.inspectionDeduction,
    { inspectionId: insp.id, description: "Deep cleaning required — kitchen and bathroom" },
    { inspectionId: insp.id, description: "Deep cleaning required — kitchen and bathroom",
      amount: 1500, category: "CLEANING", responsibility: "TENANT", status: "proposed",
      inspectorNote: "Grease buildup on cooker hood and grout staining in bathroom at move-out inspection." });

  const depRefund = await upsert(prisma.depositRefund,
    { vacatingNoticeId: vn.id },
    { vacatingNoticeId: vn.id, organizationId: ORG_ID,
      depositAmount: 80000, totalDeductions: 2500 + 4500 + 1800 + 1500, refundAmount: 80000 - (2500 + 4500 + 1800 + 1500), status: "PENDING" });
  console.log(`  ✓ Inspection PROPOSED (${insp.id}) with 4 deductions (damage, utility [disputed], cleaning [pending], + original)`);
  void insp_ded_damage; void insp_ded_utility; void insp_ded_cleaning;

  // ── 30b. Custom checklist columns example (spec: "Custom Columns") ──────────
  console.log("\n📋  Custom-column checklist template example...");
  const customColumnsTemplate = await upsert(prisma.checklistTemplate,
    { organizationId: ORG_ID, name: "Furnished Handover — Extended Evidence" },
    { organizationId: ORG_ID, name: "Furnished Handover — Extended Evidence",
      category: "FURNISHED",
      description: "Move-out checklist demonstrating landlord-defined custom columns.",
      customColumns: [
        { key: "tenant_initials", label: "Tenant Initials", type: "text" },
        { key: "inspector_notes", label: "Inspector Notes", type: "text" },
        { key: "contractor_quote", label: "Contractor Quote", type: "file" },
        { key: "invoice_upload", label: "Invoice Upload", type: "file" },
      ] });
  await upsert(prisma.checklistTemplateItem,
    { templateId: customColumnsTemplate.id, item: "Sofa set — condition" },
    { templateId: customColumnsTemplate.id, section: "Living Room", item: "Sofa set — condition", defaultQty: 1, order: 0 });
  console.log(`  ✓ Template "${customColumnsTemplate.name}" with 4 custom columns (${customColumnsTemplate.id})`);

  // ── 31. More Lease Renewal Alerts ────────────────────────────────────────────
  console.log("\n🔔  More lease renewal alerts...");
  const lraData = [
    { lid: l2.id,    pid: prop.id,  uid: u102.id, tid: james.id, exp: days(305) },
    { lid: lKrA2.id, pid: prop2.id, uid: krA2.id, tid: amina.id, exp: days(275) },
    { lid: lKrA3.id, pid: prop2.id, uid: krA3.id, tid: kevin.id, exp: days(320) },
    { lid: lKrB1.id, pid: prop2.id, uid: krB1.id, tid: faith.id, exp: days(379) },
  ];
  for (const r of lraData) {
    await upsert(prisma.leaseRenewalAlert, { leaseId: r.lid },
      { id: uid(), leaseId: r.lid, propertyId: r.pid, unitId: r.uid,
        tenantUserId: r.tid, expiryDate: r.exp, status: "scheduled" });
  }
  console.log(`  ✓ 4 more renewal alerts (James, Amina, Kevin, Faith)`);

  // ── 32. Service Enquiries (Support Tickets) ───────────────────────────────────
  console.log("\n📩  Service enquiries (Support Tickets)...");
  const enq1 = await upsert(prisma.serviceEnquiry,
    { email: "grace.muthoni@demo.ke", serviceCategoryId: catPlum.id },
    { serviceCategoryId: catPlum.id, organizationId: ORG_ID, userId: grace.id,
      name: "Grace Muthoni", email: grace.email, phone: grace.phone,
      message: "I submitted a plumbing request last week but haven't received an update. Can someone follow up?",
      status: "IN_PROGRESS", assignedTo: ADMIN_ID, assignedAt: past(1) });
  const enq2 = await upsert(prisma.serviceEnquiry,
    { email: "kevin.waweru@demo.ke", serviceCategoryId: catElec.id },
    { serviceCategoryId: catElec.id, organizationId: ORG_ID, userId: kevin.id,
      name: "Kevin Waweru", email: kevin.email, phone: kevin.phone,
      message: "Interested in solar panel installation for KR-A3. Can your team provide a quote?",
      status: "NEW" });
  const enq3 = await upsert(prisma.serviceEnquiry,
    { email: "amina.hassan@demo.ke", serviceCategoryId: catClean.id },
    { serviceCategoryId: catClean.id, organizationId: ORG_ID, userId: amina.id,
      name: "Amina Hassan", email: amina.email, phone: amina.phone,
      message: "Requesting bi-weekly housekeeping for KR-A2. Please confirm service availability and pricing.",
      status: "NEW" });
  const enq4 = await upsert(prisma.serviceEnquiry,
    { email: "new.applicant1@demo.ke", serviceCategoryId: catSec.id },
    { serviceCategoryId: catSec.id,
      name: "Emmanuel Ochieng", email: "new.applicant1@demo.ke", phone: "+254712334455",
      message: "Looking for a 2BR in Westlands or Karen. Budget KES 55,000–65,000. Available July 2026.",
      status: "COMPLETED", resolvedAt: past(2) });
  const enq5 = await upsert(prisma.serviceEnquiry,
    { email: "facilities@safaricom.co.ke", serviceCategoryId: catClean.id },
    { serviceCategoryId: catClean.id, organizationId: ORG_ID,
      name: "Safaricom Facilities Team", email: "facilities@safaricom.co.ke",
      phone: "+254722000100",
      message: "We manage employee housing. Interested in bulk listing agreement for 10+ units. Please contact GM.",
      status: "IN_PROGRESS", assignedTo: ADMIN_ID, assignedAt: past(3) });
  console.log(`  ✓ 5 service enquiries (Grace followup, Kevin solar, Amina housekeeping, Emmanuel lead, Safaricom B2B)`);

  // ── 33. Team Invitations ──────────────────────────────────────────────────────
  console.log("\n📧  Team invitations...");
  const inv_defs = [
    { email: "new.manager@demo.ke",    role: "staff",    token: "INV-TKN-MGMT-001" },
    { email: "leasing.agent@demo.ke",  role: "staff",    token: "INV-TKN-LSNG-002" },
    { email: "accounts.team@demo.ke",  role: "staff",    token: "INV-TKN-ACCT-003" },
    { email: "karen.landlord@demo.ke", role: "landlord", token: "INV-TKN-LAND-004" },
    { email: "field.agent@demo.ke",    role: "staff",    token: "INV-TKN-AGNT-005" },
  ];
  for (const t of inv_defs) {
    await upsert(prisma.teamInvitation, { inviteToken: t.token },
      { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID,
        invitedByUserId: ADMIN_ID, inviteeEmail: t.email,
        roleSlug: t.role, inviteToken: t.token,
        status: "pending", expiresAt: days(7) });
  }
  console.log(`  ✓ 5 team invitations (manager, leasing agent, accounts, landlord, field agent)`);

  // ── 34. Data Migration (Data Migration module) ────────────────────────────────
  console.log("\n📦  Data import job & past rent records...");
  const importJob = await upsert(prisma.dataImportJob,
    { fileName: "mwakaba_legacy_tenants_2025.csv", organizationId: ORG_ID },
    { organizationId: ORG_ID, branchId: BRANCH_ID,
      importType: "past_rent_records", fileName: "mwakaba_legacy_tenants_2025.csv",
      fileFormat: "csv", recordCount: 5, successCount: 5, errorCount: 0,
      status: "COMPLETED", completedAt: past(30), createdBy: ADMIN_ID,
      columnMapping: { tenantId: "tenant_code", amount: "rent_kes", period: "month_year" } });

  const pastRents = [
    { tid: grace.id, uid: u101.id, yr: 2026, mo: 4, amt: 55000, paid: 55000 },
    { tid: grace.id, uid: u101.id, yr: 2026, mo: 5, amt: 55000, paid: 55000 },
    { tid: james.id, uid: u102.id, yr: 2026, mo: 5, amt: 40000, paid: 40000 },
    { tid: amina.id, uid: krA2.id, yr: 2026, mo: 4, amt: 38000, paid: 38000 },
    { tid: amina.id, uid: krA2.id, yr: 2026, mo: 5, amt: 38000, paid: 38000 },
  ];
  for (const r of pastRents) {
    await upsert(prisma.pastRentRecord,
      { tenantId: r.tid, unitId: r.uid, periodYear: r.yr, periodMonth: r.mo, organizationId: ORG_ID },
      { organizationId: ORG_ID, tenantId: r.tid, unitId: r.uid,
        periodYear: r.yr, periodMonth: r.mo,
        rentAmountKes: r.amt, paidAmountKes: r.paid, balanceKes: 0,
        isMigrated: true, importJobId: importJob.id });
  }
  console.log(`  ✓ Import job (${importJob.id}), 5 past rent records (Apr/May 2026)`);

  // ── 35. Property Onboarding Config & Reminder Schedules (Settings) ────────────
  console.log("\n⚙️   Settings — onboarding configs & reminders...");
  await upsert(prisma.propertyOnboardingConfig,
    { propertyId: prop.id },
    { propertyId: prop.id, isShortStayEnabled: true,
      visitorApprovalRequired: true, gateAccessRequired: true,
      maintenanceSla: "standard_maintenance" });
  await upsert(prisma.propertyOnboardingConfig,
    { propertyId: prop2.id },
    { propertyId: prop2.id, isShortStayEnabled: false,
      visitorApprovalRequired: true, gateAccessRequired: false,
      maintenanceSla: "standard_maintenance" });
  console.log(`  ✓ Onboarding configs for Westlands Heights & Karen Residences`);

  const remDefs = [
    { type: "lease",   tid: l1.id,     ch: "email",    days: 60, msg: "Your lease for Unit {{unit}} expires in {{days}} days. Please confirm renewal." },
    { type: "lease",   tid: l2.id,     ch: "sms",      days: 30, msg: "Reminder: Lease expiry approaching. Contact office to renew." },
    { type: "invoice", tid: inv5.id,   ch: "whatsapp", days: -3, msg: "Your rent invoice INV-2026-0005 is overdue. KES {{amount}} outstanding." },
    { type: "kyc",     tid: kyc2.id,   ch: "email",    days: 7,  msg: "Please upload your National ID to complete KYC verification." },
    { type: "checklist", tid: l1.id,   ch: "email",    days: 0,  msg: "Your move-in checklist is pending completion. Please complete within 48 hours." },
  ];
  for (const r of remDefs) {
    await upsert(prisma.reminderSchedule,
      { targetType: r.type, targetId: r.tid, channel: r.ch },
      { id: uid(), targetType: r.type, targetId: r.tid, channel: r.ch,
        scheduleOffsetDays: r.days, messageTemplate: r.msg, isEnabled: true });
  }
  console.log(`  ✓ 5 reminder schedules (lease renewal, invoice overdue, KYC nudge, checklist)`);

  // ── 36. Taxonomies (ApplicationCustomField, ServiceTypeConfig, CustomTypeDef) ──
  console.log("\n🏷️   Taxonomies & custom types...");
  const fields = [
    { label: "Employment Type",         type: "SELECT",   opts: ["Employed","Self-employed","Business Owner","Student","Retired"] },
    { label: "Monthly Income (KES)",    type: "NUMBER",   opts: [] },
    { label: "Number of Dependants",    type: "NUMBER",   opts: [] },
    { label: "Previous Landlord Name",  type: "TEXT",     opts: [] },
    { label: "Pets",                    type: "SELECT",   opts: ["None","Cat","Dog","Bird","Other"] },
  ];
  for (const f of fields) {
    await upsert(prisma.applicationCustomField,
      { fieldLabel: f.label, organizationId: ORG_ID },
      { organizationId: ORG_ID, fieldLabel: f.label, fieldType: f.type,
        fieldOptions: f.opts, isRequired: f.type === "SELECT", isActive: true });
  }
  console.log(`  ✓ 5 application custom fields`);

  const stcDefs = [
    { st: "plumbing_repair",   quote: true,  evidence: ["BEFORE_PHOTO","AFTER_PHOTO"] },
    { st: "electrical_repair", quote: true,  evidence: ["BEFORE_PHOTO","AFTER_PHOTO","RECEIPT"] },
    { st: "cleaning_service",  quote: false, evidence: ["AFTER_PHOTO"] },
    { st: "security_install",  quote: true,  evidence: ["BEFORE_PHOTO","AFTER_PHOTO","WARRANTY_DOC"] },
    { st: "garden_maintenance",quote: false, evidence: ["AFTER_PHOTO"] },
  ];
  for (const s of stcDefs) {
    await upsert(prisma.serviceTypeConfig,
      { serviceType: s.st },
      { serviceType: s.st, quoteRequired: s.quote,
        evidenceRequirements: s.evidence,
        supervisorApprovalRequired: s.quote,
        assignmentRestrictions: s.quote ? "provider_only" : "open" });
  }
  console.log(`  ✓ 5 service type configs`);

  // ── 37. Investments (PropertyTransferRecord) ──────────────────────────────────
  console.log("\n💼  Investments (property transfer records)...");
  const ptr1 = await upsert(prisma.propertyTransferRecord,
    { propertyId: prop2.id, transferType: "purchase" },
    { propertyId: prop2.id, previousOwnerId: "00000000-0000-0000-0000-000000000000",
      newOwnerId: david.id, transferType: "purchase",
      saleAmountKes: 85000000,
      notes: "Karen Residences purchased by David Mutua. Financed 60% via mortgage, KCB Bank.",
      createdBy: ADMIN_ID });
  const ptr2 = await upsert(prisma.propertyTransferRecord,
    { propertyId: prop.id, transferType: "management_handover" },
    { propertyId: prop.id, previousOwnerId: ADMIN_ID,
      newOwnerId: ADMIN_ID, transferType: "management_handover",
      notes: "Management of Westlands Heights transferred to Mwakaba Properties platform.",
      createdBy: ADMIN_ID });
  console.log(`  ✓ Karen purchase record (KES 85M), Westlands management handover`);

  // ── 38. Reconciliation Report ─────────────────────────────────────────────────
  console.log("\n🔁  Reconciliation report...");
  const recon = await upsert(prisma.reconciliationReport,
    { status: "resolved", periodStart: new Date("2026-06-01") },
    { id: uid(), periodStart: new Date("2026-06-01"), periodEnd: new Date("2026-06-30"),
      expectedKes: 223000, actualKes: 168400, discrepancyKes: 54600,
      status: "open", resolvedAt: null });
  console.log(`  ✓ Jun 2026 reconciliation: expected KES 223K, actual KES 168.4K, discrepancy KES 54.6K (Kevin arrears)`);

  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("  EXTENDED SEED COMPLETE — ALL MODULES POPULATED");
  console.log("────────────────────────────────────────────────────────────────");
  console.log("  New users:         David, Amina, Kevin, Faith, Mike + 3 providers");
  console.log("  New property:      Karen Residences (5 units)");
  console.log("  Containers:        3 (portfolio groups)");
  console.log("  Lease templates:   5 | Doc templates: 5 | E-signs: 5");
  console.log("  Rental apps:       5 (all statuses) | Screening: 5");
  console.log("  Wallets:           5 | Ledger entries: 5 | Escrow: 5");
  console.log("  Invoices:          5 | Receipts: 5 | Expenses: 8");
  console.log("  Monthly summaries: 6 (Jan–Jun) | Financial reports: 2");
  console.log("  Dashboard widgets: 7 | Intel snapshots: 6");
  console.log("  MoveScore:         6 | RentScore: 5");
  console.log("  Compliance:        5 numbers + 5 records");
  console.log("  MicroBehavior:     10 records | Audit logs: 8");
  console.log("  Utility meters:    5 | Readings: 5 | Disputes: 1");
  console.log("  SR history:        7 | SR quotes: 5 | SR assignments: 5");
  console.log("  Provider perf:     2 | More SRs: 3");
  console.log("  Nightgrab charges: 5 | QR access logs: 8");
  console.log("  Visitors:          3 more + 2 logs | Enquiries: 5");
  console.log("  Team invitations:  5 | Leases (Karen): 3");
  console.log("  Data import:       1 job + 5 past rent records");
  console.log("  Settings:          2 onboarding configs + 5 reminders");
  console.log("  Taxonomies:        5 custom fields + 5 service type configs");
  console.log("  Investments:       2 property transfer records + reconciliation");
  console.log("  Vacating flow:     inspection + deduction + deposit refund");
  console.log("════════════════════════════════════════════════════════════════");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("\n❌  Extended seed error:", e.message);
    if (e.meta) console.error("   Meta:", JSON.stringify(e.meta));
    await prisma.$disconnect();
    process.exit(1);
  });
