/**
 * demo-seed.js — Seeds real demo data across all Secure Living modules
 * Org: Mwakaba Properties (org1) / Branch: Nairobi HQ (b1)
 * Admin: 7b8466b0-9d31-485d-b7a9-c5f7f3c089f7 (Platform Admin)
 *
 * Run: node prisma/demo-seed.js
 */

const { PrismaClient } = require("@prisma/client");
const { randomUUID, randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();

const ORG_ID    = "org1";
const BRANCH_ID = "b1";
const ADMIN_ID  = "7b8466b0-9d31-485d-b7a9-c5f7f3c089f7";

const uid = () => randomUUID();
const days = (n = 0) => new Date(Date.now() + n * 86400000);

function hashPassword(pw) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

async function upsert(model, where, data) {
  const existing = await model.findFirst({ where });
  if (existing) { console.log("    (already exists, skipped)"); return existing; }
  return model.create({ data });
}

// ─── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱  Demo seed — Mwakaba Properties (org1/b1)\n");

  // ── Users ────────────────────────────────────────────────────────────────────
  console.log("👤  Users...");
  const tenantRole = await prisma.role.findFirst({ where: { slug: "tenant" } });
  const staffRole  = await prisma.role.findFirst({ where: { slug: "staff"  } });

  const pw = hashPassword("Demo@1234");

  const grace = await upsert(
    prisma.appUser,
    { email: "grace.muthoni@demo.ke" },
    { id: uid(), email: "grace.muthoni@demo.ke", fullName: "Grace Muthoni",
      phone: "+254712001001", passwordHash: pw, status: "active",
      verificationLevel: "IDENTITY_VERIFIED" }
  );
  const james = await upsert(
    prisma.appUser,
    { email: "james.kariuki@demo.ke" },
    { id: uid(), email: "james.kariuki@demo.ke", fullName: "James Kariuki",
      phone: "+254712002002", passwordHash: pw, status: "active",
      verificationLevel: "UNVERIFIED" }
  );
  const samuel = await upsert(
    prisma.appUser,
    { email: "samuel.otieno@demo.ke" },
    { id: uid(), email: "samuel.otieno@demo.ke", fullName: "Samuel Otieno",
      phone: "+254712003003", passwordHash: pw, status: "active",
      verificationLevel: "UNVERIFIED" }
  );
  const peterUser = await upsert(
    prisma.appUser,
    { email: "peter.njoroge@demo.ke" },
    { id: uid(), email: "peter.njoroge@demo.ke", fullName: "Peter Njoroge",
      phone: "+254722100200", passwordHash: pw, status: "active",
      verificationLevel: "IDENTITY_VERIFIED" }
  );
  const dianaUser = await upsert(
    prisma.appUser,
    { email: "diana.weru@demo.ke" },
    { id: uid(), email: "diana.weru@demo.ke", fullName: "Diana Weru",
      phone: "+254722300400", passwordHash: pw, status: "active",
      verificationLevel: "IDENTITY_VERIFIED" }
  );

  // Role assignments for org1/b1
  if (tenantRole) {
    await upsert(prisma.userRoleAssignment, { userId: grace.id, organizationId: ORG_ID },
      { id: uid(), userId: grace.id, roleId: tenantRole.id, organizationId: ORG_ID, branchId: BRANCH_ID, status: "active" });
    await upsert(prisma.userRoleAssignment, { userId: james.id, organizationId: ORG_ID },
      { id: uid(), userId: james.id, roleId: tenantRole.id, organizationId: ORG_ID, branchId: BRANCH_ID, status: "active" });
  }
  if (staffRole) {
    await upsert(prisma.userRoleAssignment, { userId: samuel.id, organizationId: ORG_ID },
      { id: uid(), userId: samuel.id, roleId: staffRole.id, organizationId: ORG_ID, branchId: BRANCH_ID, status: "active" });
  }
  console.log(`  ✓ Grace (${grace.id}), James (${james.id}), Samuel (${samuel.id})`);
  console.log(`  ✓ Peter Njoroge (${peterUser.id}), Diana Weru (${dianaUser.id})`);

  // ── Property ──────────────────────────────────────────────────────────────────
  console.log("\n🏢  Property...");
  const prop = await upsert(
    prisma.property,
    { name: "Westlands Heights", organizationId: ORG_ID },
    { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID,
      name: "Westlands Heights", propertyType: "Apartment Block",
      addressLine1: "14 Westlands Road", city: "Nairobi", country: "Kenya",
      ownerUserId: ADMIN_ID, managerUserId: ADMIN_ID,
      totalUnits: 6, status: "active" }
  );
  console.log(`  ✓ Westlands Heights (${prop.id})`);

  // ── Units ─────────────────────────────────────────────────────────────────────
  console.log("\n🏠  Units...");
  const unitDefs = [
    { n: "101", type: "2-Bedroom", beds: 2, baths: 1, rent: 55000, status: "occupied",   floor: "1" },
    { n: "102", type: "1-Bedroom", beds: 1, baths: 1, rent: 40000, status: "occupied",   floor: "1" },
    { n: "103", type: "Studio",    beds: 0, baths: 1, rent: 28000, status: "vacant",     floor: "1" },
    { n: "104", type: "2-Bedroom", beds: 2, baths: 2, rent: 60000, status: "vacant",     floor: "1" },
    { n: "201", type: "3-Bedroom", beds: 3, baths: 2, rent: 85000, status: "vacant",     floor: "2" },
    { n: "202", type: "Penthouse", beds: 4, baths: 3, rent: 120000, status: "reserved",  floor: "2" },
  ];
  const units = [];
  for (const d of unitDefs) {
    const u = await upsert(
      prisma.unit,
      { unitNumber: d.n, propertyId: prop.id },
      { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID, propertyId: prop.id,
        unitNumber: d.n, unitType: d.type, bedrooms: d.beds, bathrooms: d.baths,
        rentAmountKes: d.rent, status: d.status, floor: d.floor }
    );
    units.push(u);
    console.log(`  ✓ Unit ${d.n} (${d.type}, KES ${d.rent.toLocaleString()}, ${d.status}): ${u.id}`);
  }
  const [u101, u102, u103, u104, u201] = units;

  // ── Leases ────────────────────────────────────────────────────────────────────
  console.log("\n📄  Leases...");
  const l1 = await upsert(
    prisma.lease,
    { unitId: u101.id, tenantUserId: grace.id },
    { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID,
      propertyId: prop.id, unitId: u101.id, tenantUserId: grace.id,
      leaseType: "fixed_term", rentAmount: 55000, depositAmount: 110000,
      startDate: days(-120), endDate: days(245),
      paymentFrequency: "monthly", status: "active",
      signedAt: days(-120), createdBy: ADMIN_ID }
  );
  const l2 = await upsert(
    prisma.lease,
    { unitId: u102.id, tenantUserId: james.id },
    { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID,
      propertyId: prop.id, unitId: u102.id, tenantUserId: james.id,
      leaseType: "month_to_month", rentAmount: 40000, depositAmount: 80000,
      startDate: days(-60), endDate: days(305),
      paymentFrequency: "monthly", status: "active",
      signedAt: days(-60), createdBy: ADMIN_ID }
  );
  const l3 = await upsert(
    prisma.lease,
    { unitId: u104.id },
    { id: uid(), organizationId: ORG_ID, branchId: BRANCH_ID,
      propertyId: prop.id, unitId: u104.id, tenantUserId: grace.id,
      leaseType: "fixed_term", rentAmount: 60000, depositAmount: 120000,
      startDate: days(30), endDate: days(395),
      paymentFrequency: "monthly", status: "draft", createdBy: ADMIN_ID }
  );
  console.log(`  ✓ Lease 1 (Grace/101 active): ${l1.id}`);
  console.log(`  ✓ Lease 2 (James/102 active): ${l2.id}`);
  console.log(`  ✓ Lease 3 (104 draft):        ${l3.id}`);

  // ── Short-stay ────────────────────────────────────────────────────────────────
  console.log("\n🛏️   Short-stay...");
  const ssp = await upsert(
    prisma.shortStayProperty,
    { unitId: u103.id },
    { unitId: u103.id, organizationId: ORG_ID,
      nightlyRate: 4500, currency: "KES", cleaningFee: 800,
      minNights: 1, maxNights: 30, checkInTime: "14:00", checkOutTime: "11:00",
      houseRules: "No smoking. Quiet hours 10 pm–7 am. No parties.",
      wifiPassword: "WestSS@2026", accessNotes: "Key at reception, ground floor." }
  );
  console.log(`  ✓ Short-stay property (Unit 103): ${ssp.id}`);

  // Bookings
  const b1 = await upsert(
    prisma.shortStayBooking,
    { shortStayId: ssp.id, guestEmail: "alice.njeri@demo.ke" },
    { shortStayId: ssp.id, organizationId: ORG_ID,
      guestName: "Alice Njeri", guestEmail: "alice.njeri@demo.ke",
      guestPhone: "+254711223344", guestIdNumber: "31445678",
      checkInDate: days(-2), checkOutDate: days(1),
      numberOfGuests: 2, totalAmount: 3 * 4500 + 800, status: "CHECKED_IN",
      specialRequests: "Extra pillows and balcony-view room if available." }
  );
  const b2 = await upsert(
    prisma.shortStayBooking,
    { shortStayId: ssp.id, guestEmail: "brian.oluoch@demo.ke" },
    { shortStayId: ssp.id, organizationId: ORG_ID,
      guestName: "Brian Oluoch", guestEmail: "brian.oluoch@demo.ke",
      guestPhone: "+254711556677", guestIdNumber: "28934512",
      checkInDate: days(5), checkOutDate: days(10),
      numberOfGuests: 1, totalAmount: 5 * 4500 + 800, status: "CONFIRMED",
      specialRequests: "Airport pickup requested on arrival day." }
  );
  const b3 = await upsert(
    prisma.shortStayBooking,
    { shortStayId: ssp.id, guestEmail: "fatuma.said@demo.ke" },
    { shortStayId: ssp.id, organizationId: ORG_ID,
      guestName: "Fatuma Said", guestEmail: "fatuma.said@demo.ke",
      guestPhone: "+254714889900", guestIdNumber: "41223398",
      checkInDate: days(-8), checkOutDate: days(-5),
      numberOfGuests: 2, totalAmount: 3 * 4500 + 800, status: "CHECKED_OUT" }
  );
  console.log(`  ✓ Booking: Alice Njeri (CHECKED_IN): ${b1.id}`);
  console.log(`  ✓ Booking: Brian Oluoch (CONFIRMED): ${b2.id}`);
  console.log(`  ✓ Booking: Fatuma Said (CHECKED_OUT): ${b3.id}`);

  // ── Checklist templates ───────────────────────────────────────────────────────
  console.log("\n✅  Checklist templates...");

  const tpl1 = await upsert(
    prisma.checklistTemplate,
    { name: "Standard Move-In Inspection", organizationId: ORG_ID },
    {
      organizationId: ORG_ID,
      name: "Standard Move-In Inspection",
      description: "Full move-in checklist for residential units — covers rooms, fixtures, and appliances.",
      category: "RESIDENTIAL",
      items: {
        create: [
          { section: "Living Room", item: "Main door lock and hinges",           defaultQty: 1, order: 0 },
          { section: "Living Room", item: "Windows — open/close/latch",          defaultQty: 2, order: 1 },
          { section: "Living Room", item: "Light switches and sockets",          defaultQty: 4, order: 2 },
          { section: "Kitchen",     item: "Sink taps (hot and cold)",            defaultQty: 1, order: 3 },
          { section: "Kitchen",     item: "Cupboard doors and shelves",          defaultQty: 6, order: 4 },
          { section: "Kitchen",     item: "Gas/electric cooker burners",         defaultQty: 4, order: 5 },
          { section: "Bathroom",    item: "Toilet flush and cistern",            defaultQty: 1, order: 6 },
          { section: "Bathroom",    item: "Shower head and water pressure",      defaultQty: 1, order: 7 },
          { section: "Bathroom",    item: "Mirror — intact, no cracks",         defaultQty: 1, order: 8 },
          { section: "Bedroom",     item: "Built-in wardrobe doors and rails",   defaultQty: 2, order: 9 },
          { section: "Bedroom",     item: "Window and mosquito net",             defaultQty: 1, order: 10 },
          { section: "General",     item: "Walls — no stains or damage",        defaultQty: 1, order: 11 },
          { section: "General",     item: "Ceiling — no water marks",           defaultQty: 1, order: 12 },
          { section: "General",     item: "Floor tiles — no cracks",            defaultQty: 1, order: 13 },
          { section: "General",     item: "Electricity meter reading noted",     defaultQty: 1, order: 14 },
        ],
      },
    }
  );

  const tpl2 = await upsert(
    prisma.checklistTemplate,
    { name: "Short-Stay Unit Readiness", organizationId: ORG_ID },
    {
      organizationId: ORG_ID,
      name: "Short-Stay Unit Readiness",
      description: "Pre-arrival readiness check for Airbnb-style units.",
      category: "SHORT_STAY",
      items: {
        create: [
          { section: "Cleaning",   item: "All surfaces wiped and vacuumed",          defaultQty: 1, order: 0 },
          { section: "Cleaning",   item: "Bathrooms scrubbed and sanitised",          defaultQty: 1, order: 1 },
          { section: "Cleaning",   item: "Kitchen appliances cleaned",                defaultQty: 1, order: 2 },
          { section: "Amenities",  item: "Towels and bed linen freshly laundered",    defaultQty: 2, order: 3 },
          { section: "Amenities",  item: "Toiletries stocked (soap, shampoo, TP)",   defaultQty: 1, order: 4 },
          { section: "Amenities",  item: "Wi-Fi working — password on desk card",    defaultQty: 1, order: 5 },
          { section: "Amenities",  item: "TV and remote working",                    defaultQty: 1, order: 6 },
          { section: "Safety",     item: "Smoke detector battery checked",           defaultQty: 1, order: 7 },
          { section: "Safety",     item: "Fire extinguisher accessible",             defaultQty: 1, order: 8 },
          { section: "Supplies",   item: "Tea/coffee station stocked",               defaultQty: 1, order: 9 },
          { section: "Supplies",   item: "Bottled water in fridge",                  defaultQty: 2, order: 10 },
        ],
      },
    }
  );

  const tpl3 = await upsert(
    prisma.checklistTemplate,
    { name: "Move-Out Inspection", organizationId: ORG_ID },
    {
      organizationId: ORG_ID,
      name: "Move-Out Inspection",
      description: "End-of-tenancy checklist to document condition and compute deposit deductions.",
      category: "RESIDENTIAL",
      items: {
        create: [
          { section: "Walls",     item: "Check for holes, scuffs or stains",            defaultQty: 1, order: 0 },
          { section: "Walls",     item: "Paint condition vs move-in photos",            defaultQty: 1, order: 1 },
          { section: "Floors",    item: "Tiles — cracked, broken or missing",           defaultQty: 1, order: 2 },
          { section: "Fixtures",  item: "Door handles and hinges operational",          defaultQty: 3, order: 3 },
          { section: "Fixtures",  item: "Window locks intact",                          defaultQty: 2, order: 4 },
          { section: "Kitchen",   item: "Cooker and oven condition",                    defaultQty: 1, order: 5 },
          { section: "Bathroom",  item: "Toilet seat and cistern",                     defaultQty: 1, order: 6 },
          { section: "Bathroom",  item: "Shower screen/curtain condition",              defaultQty: 1, order: 7 },
          { section: "Utilities", item: "Final meter readings captured",                defaultQty: 1, order: 8 },
          { section: "Keys",      item: "All keys returned",                           defaultQty: 2, order: 9 },
        ],
      },
    }
  );

  console.log(`  ✓ Template 1 — Move-In Inspection: ${tpl1.id}`);
  console.log(`  ✓ Template 2 — Short-Stay Readiness: ${tpl2.id}`);
  console.log(`  ✓ Template 3 — Move-Out Inspection: ${tpl3.id}`);

  // Tenant checklist instance (Grace's move-in)
  const tcl = await upsert(
    prisma.tenantChecklist,
    { leaseId: l1.id, templateId: tpl1.id },
    { leaseId: l1.id, unitId: u101.id, tenantId: grace.id,
      templateId: tpl1.id, type: "MOVE_IN", status: "IN_PROGRESS" }
  );
  console.log(`  ✓ Tenant checklist (Grace move-in, IN_PROGRESS): ${tcl.id}`);

  // ── Service categories ────────────────────────────────────────────────────────
  console.log("\n🔧  Service categories...");
  const catPlumbing = await upsert(
    prisma.serviceCategory,
    { slug: "plumbing" },
    { slug: "plumbing", name: "Plumbing", tagline: "Leaks, pipes and water supply",
      description: "Leak detection, pipe repair, water heater installation and geyser maintenance.",
      icon: "Droplets", isActive: true, order: 1 }
  );
  const catElec = await upsert(
    prisma.serviceCategory,
    { slug: "electrical" },
    { slug: "electrical", name: "Electrical", tagline: "Wiring, sockets and appliances",
      description: "Socket installation, rewiring, power surge protection and appliance diagnostics.",
      icon: "Zap", isActive: true, order: 2 }
  );
  const catSec = await upsert(
    prisma.serviceCategory,
    { slug: "security" },
    { slug: "security", name: "Security", tagline: "Locks, CCTV and alarm systems",
      description: "Door lock replacement, CCTV installation, alarm setup and access control.",
      icon: "Shield", isActive: true, order: 3 }
  );
  const catCleaning = await upsert(
    prisma.serviceCategory,
    { slug: "cleaning" },
    { slug: "cleaning", name: "Cleaning", tagline: "Deep cleaning and housekeeping",
      description: "Move-in/out deep cleaning, regular housekeeping and carpet steam cleaning.",
      icon: "Sparkles", isActive: true, order: 4 }
  );
  console.log(`  ✓ Plumbing: ${catPlumbing.id}, Electrical: ${catElec.id}, Security: ${catSec.id}, Cleaning: ${catCleaning.id}`);

  // ── Service requests ──────────────────────────────────────────────────────────
  console.log("\n🔨  Service requests...");
  const sr1 = await upsert(
    prisma.serviceRequest,
    { title: "Leaking kitchen faucet — Unit 101", propertyId: prop.id, unitId: u101.id },
    { organizationId: ORG_ID, branchId: BRANCH_ID,
      propertyId: prop.id, unitId: u101.id, tenantUserId: grace.id,
      title: "Leaking kitchen faucet — Unit 101",
      description: "The kitchen faucet has been dripping constantly since Monday. Water wastage and noise are disruptive. Needs urgent repair — hot and cold taps both affected.",
      category: "plumbing", priority: "HIGH",
      status: "IN_PROGRESS", dueAt: days(2), createdBy: grace.id }
  );
  const sr2 = await upsert(
    prisma.serviceRequest,
    { title: "Power sockets not working — Unit 102", propertyId: prop.id, unitId: u102.id },
    { organizationId: ORG_ID, branchId: BRANCH_ID,
      propertyId: prop.id, unitId: u102.id, tenantUserId: james.id,
      title: "Power sockets not working — Unit 102",
      description: "Three power sockets in the living room stopped working after a power surge last night. TV, laptop and fridge on extension — cannot charge. Certified electrician required immediately.",
      category: "electrical", priority: "URGENT",
      status: "APPROVED", dueAt: days(1), createdBy: james.id }
  );
  const sr3 = await upsert(
    prisma.serviceRequest,
    { title: "Front door lock stiff — Unit 103", propertyId: prop.id, unitId: u103.id },
    { organizationId: ORG_ID, branchId: BRANCH_ID,
      propertyId: prop.id, unitId: u103.id,
      title: "Front door lock stiff — Unit 103",
      description: "Front door lock requires excessive force to open. Short-stay guests have complained. Lock lubrication or replacement needed before next booking on " + days(5).toLocaleDateString("en-GB") + ".",
      category: "security", priority: "NORMAL",
      status: "COMPLETED", completedDate: days(-1), dueAt: days(-1),
      createdBy: ADMIN_ID }
  );
  const sr4 = await upsert(
    prisma.serviceRequest,
    { title: "Move-in inspection — Unit 102 (James Kariuki)", propertyId: prop.id },
    { organizationId: ORG_ID, branchId: BRANCH_ID,
      propertyId: prop.id, unitId: u102.id, tenantUserId: james.id,
      title: "Move-in inspection — Unit 102 (James Kariuki)",
      description: "New tenant James Kariuki's move-in is confirmed. Schedule and complete a full move-in checklist before key handover. Coordinate with Samuel Otieno (staff).",
      category: "inspection", priority: "NORMAL",
      status: "DRAFT", dueAt: days(3), createdBy: ADMIN_ID }
  );
  console.log(`  ✓ SR1 Leaking faucet (IN_PROGRESS):     ${sr1.id}`);
  console.log(`  ✓ SR2 Power sockets (APPROVED):          ${sr2.id}`);
  console.log(`  ✓ SR3 Door lock (COMPLETED):             ${sr3.id}`);
  console.log(`  ✓ SR4 Move-in inspection (DRAFT):        ${sr4.id}`);

  // ── Service providers ─────────────────────────────────────────────────────────
  console.log("\n👷  Service providers...");
  const prov1 = await upsert(
    prisma.serviceProvider,
    { userId: peterUser.id },
    { userId: peterUser.id, organizationId: ORG_ID,
      category: "VERIFIED_MARKETPLACE", status: "ACTIVE",
      specializations: ["Leak detection", "Pipe repair", "Water heater installation"],
      coverageAreas: ["Westlands", "Parklands", "Lavington", "Kilimani"],
      bio: "Licensed plumber with 8 years experience. EPRA certified. Available 7 days a week.",
      verificationLevel: "Enhanced", trustScore: 87,
      approvedAt: days(-30), approvedBy: ADMIN_ID }
  );
  const prov2 = await upsert(
    prisma.serviceProvider,
    { userId: dianaUser.id },
    { userId: dianaUser.id, organizationId: ORG_ID,
      category: "VERIFIED_MARKETPLACE", status: "ACTIVE",
      specializations: ["Rewiring", "Socket installation", "Solar setup", "Generator maintenance"],
      coverageAreas: ["Westlands", "Spring Valley", "Runda", "Karen"],
      bio: "Certified electrician, NCA Grade 1 contractor. 24-hour emergency callout.",
      verificationLevel: "Enhanced", trustScore: 92,
      approvedAt: days(-45), approvedBy: ADMIN_ID }
  );
  console.log(`  ✓ Peter Njoroge (Plumber, trust 87):    ${prov1.id}`);
  console.log(`  ✓ Diana Weru (Electrician, trust 92):   ${prov2.id}`);

  // ── Listings ──────────────────────────────────────────────────────────────────
  console.log("\n📋  Listings...");
  const lst1 = await upsert(
    prisma.listing,
    { unitId: u201.id },
    { organizationId: ORG_ID, unitId: u201.id,
      title: "Spacious 3-Bedroom in Westlands Heights",
      description: "Light-filled 3BR apartment on the 2nd floor of Westlands Heights. Open-plan kitchen, balcony with garden views, ample parking, 24/7 security, and fibre internet. Near Westgate Mall and Sarit Centre.",
      rentAmount: 85000, currency: "KES", availableFrom: days(7),
      furnished: false, petFriendly: true,
      features: ["Parking", "Generator backup", "CCTV", "Fibre internet", "Balcony", "Staff quarters"],
      status: "PUBLISHED", publishedAt: days(-3) }
  );
  const lst2 = await upsert(
    prisma.listing,
    { unitId: u104.id },
    { organizationId: ORG_ID, unitId: u104.id,
      title: "Modern 2-Bedroom — Ready July 2026",
      description: "Well-finished 2BR unit with en-suite master bedroom. New kitchen fittings, quality tiles throughout. Suitable for a small family or working couple. Quiet 1st floor, no staircase.",
      rentAmount: 60000, currency: "KES", availableFrom: days(30),
      furnished: true, petFriendly: false,
      features: ["Parking", "Generator backup", "Gym access", "Furnished", "En-suite"],
      status: "DRAFT" }
  );
  console.log(`  ✓ Listing 1 (3BR, PUBLISHED):  ${lst1.id}`);
  console.log(`  ✓ Listing 2 (2BR, DRAFT):      ${lst2.id}`);

  // ── Visitors ─────────────────────────────────────────────────────────────────
  console.log("\n👣  Visitors...");
  const v1 = await upsert(
    prisma.visitor,
    { phone: "+254701112233", propertyId: prop.id },
    { organizationId: ORG_ID, propertyId: prop.id, unitId: u101.id,
      name: "Kevin Odhiambo", phone: "+254701112233",
      email: "kevin.odhiambo@demo.ke", idNumber: "29871234",
      vehicleNumber: "KCB 245Y",
      notes: "Grace's brother — helping with furniture delivery. Expected stay: 2 hours." }
  );
  const v2 = await upsert(
    prisma.visitor,
    { phone: "+254702334455", propertyId: prop.id },
    { organizationId: ORG_ID, propertyId: prop.id, unitId: u102.id,
      name: "Zara Ahmed", phone: "+254702334455",
      email: "zara.ahmed@demo.ke", idNumber: "38824567",
      notes: "James's colleague — dropping off office documents." }
  );
  const v3 = await upsert(
    prisma.visitor,
    { phone: "+254703556677", propertyId: prop.id },
    { organizationId: ORG_ID, propertyId: prop.id,
      name: "Interswitch Kenya Rep", phone: "+254703556677",
      email: "rep@interswitch.co.ke", idNumber: "Corp-ISK2026",
      notes: "Payment gateway technical representative. Meeting with Property Manager in lobby." }
  );
  console.log(`  ✓ Kevin Odhiambo (Unit 101 visitor): ${v1.id}`);
  console.log(`  ✓ Zara Ahmed (Unit 102 visitor):     ${v2.id}`);
  console.log(`  ✓ Interswitch Rep (lobby meeting):   ${v3.id}`);

  // Visitor logs
  await upsert(prisma.visitorLog, { visitorId: v1.id },
    { id: uid(), visitorId: v1.id,
      propertyId: prop.id, unitId: u101.id,
      purpose: "Furniture delivery by family member",
      approvalStatus: "APPROVED", approvalMethod: "MANUAL",
      notes: "Verified national ID and vehicle plate. Access granted.",
      authorizedBy: ADMIN_ID, idVerified: true });
  await upsert(prisma.visitorLog, { visitorId: v3.id },
    { id: uid(), visitorId: v3.id,
      propertyId: prop.id,
      purpose: "Corporate technical meeting with Property Manager",
      approvalStatus: "APPROVED", approvalMethod: "MANUAL",
      notes: "Corporate visit pre-confirmed by management.",
      authorizedBy: ADMIN_ID, idVerified: true });
  console.log("  ✓ Visitor logs created (Kevin approved, Zara pending, Interswitch approved)");

  // ── QR Applications ───────────────────────────────────────────────────────────
  console.log("\n📱  QR Applications...");
  const qr1 = await upsert(
    prisma.qrApplication,
    { qrToken: "QR-DEMO-NADIA-WESTLANDS-2026" },
    { id: uid(), listingId: lst1.id, unitId: u201.id,
      applicantName: "Nadia Kamau", applicantPhone: "+254716001001",
      applicantEmail: "nadia.kamau@demo.ke",
      qrToken: "QR-DEMO-NADIA-WESTLANDS-2026", status: "PENDING" }
  );
  const qr2 = await upsert(
    prisma.qrApplication,
    { qrToken: "QR-DEMO-ROBERT-WESTLANDS-2026" },
    { id: uid(), listingId: lst1.id, unitId: u201.id,
      applicantName: "Robert Maina", applicantPhone: "+254716002002",
      applicantEmail: "robert.maina@demo.ke",
      qrToken: "QR-DEMO-ROBERT-WESTLANDS-2026", status: "VERIFIED" }
  );
  const qr3 = await upsert(
    prisma.qrApplication,
    { qrToken: "QR-DEMO-SUSAN-WESTLANDS-2026" },
    { id: uid(), listingId: lst2.id, unitId: u104.id,
      applicantName: "Susan Chebet", applicantPhone: "+254716003003",
      applicantEmail: "susan.chebet@demo.ke",
      qrToken: "QR-DEMO-SUSAN-WESTLANDS-2026", status: "APPLIED" }
  );
  console.log(`  ✓ QR 1 — Nadia Kamau (PENDING):   ${qr1.id}`);
  console.log(`  ✓ QR 2 — Robert Maina (VERIFIED):  ${qr2.id}`);
  console.log(`  ✓ QR 3 — Susan Chebet (APPLIED):   ${qr3.id}`);

  // ── Transactions ──────────────────────────────────────────────────────────────
  console.log("\n💰  Transactions...");
  const tx1 = await upsert(
    prisma.transaction,
    { mpesaReference: "RH78K3PLG9" },
    { id: uid(), organizationId: ORG_ID, propertyId: prop.id, unitId: u101.id,
      amountKes: 55000, feeKes: 0, netKes: 55000,
      transactionType: "rent_payment", paymentMethod: "mpesa_paybill",
      mpesaReference: "RH78K3PLG9", status: "completed",
      description: "Rent June 2026 — Grace Muthoni Unit 101" }
  );
  const tx2 = await upsert(
    prisma.transaction,
    { mpesaReference: "SS92M4QWX7" },
    { id: uid(), organizationId: ORG_ID, propertyId: prop.id, unitId: u103.id,
      amountKes: b1.totalAmount, feeKes: 0, netKes: b1.totalAmount,
      transactionType: "rent_payment", paymentMethod: "mpesa_stk",
      mpesaReference: "SS92M4QWX7", status: "completed",
      description: "Short-stay payment — Alice Njeri, 3 nights" }
  );
  const tx3 = await upsert(
    prisma.transaction,
    { mpesaReference: "DEP110GRACE01" },
    { id: uid(), organizationId: ORG_ID, propertyId: prop.id, unitId: u101.id,
      amountKes: 110000, feeKes: 0, netKes: 110000,
      transactionType: "deposit", paymentMethod: "bank_transfer_eft",
      mpesaReference: "DEP110GRACE01", status: "completed",
      description: "Security deposit — Grace Muthoni Unit 101 (2 months)" }
  );
  console.log(`  ✓ TX1 Grace rent KES 55,000 (M-Pesa RH78K3PLG9): ${tx1.id}`);
  console.log(`  ✓ TX2 Short-stay KES ${b1.totalAmount.toLocaleString()} (M-Pesa SS92M4QWX7): ${tx2.id}`);
  console.log(`  ✓ TX3 Grace deposit KES 110,000 (Bank transfer): ${tx3.id}`);

  // ── SLA Policies ──────────────────────────────────────────────────────────────
  console.log("\n⏱️   SLA policies...");
  const sla1 = await upsert(
    prisma.slaPolicy,
    { serviceType: "emergency_maintenance" },
    { name: "Emergency Response (4 hours)",
      serviceType: "emergency_maintenance",
      responseDeadlineMinutes: 60,
      completionDeadlineMinutes: 240,
      escalationAfterMinutes: 120 }
  );
  const sla2 = await upsert(
    prisma.slaPolicy,
    { serviceType: "standard_maintenance" },
    { name: "Standard Maintenance (48 hours)",
      serviceType: "standard_maintenance",
      responseDeadlineMinutes: 240,
      completionDeadlineMinutes: 2880,
      escalationAfterMinutes: 1440 }
  );
  const sla3 = await upsert(
    prisma.slaPolicy,
    { serviceType: "inspection" },
    { name: "Inspection Scheduling (72 hours)",
      serviceType: "inspection",
      responseDeadlineMinutes: 480,
      completionDeadlineMinutes: 4320,
      escalationAfterMinutes: 2880 }
  );
  console.log(`  ✓ SLA: Emergency 4h: ${sla1.id}`);
  console.log(`  ✓ SLA: Standard 48h: ${sla2.id}`);
  console.log(`  ✓ SLA: Inspection 72h: ${sla3.id}`);

  // ── Vacating notice ────────────────────────────────────────────────────────────
  console.log("\n📦  Vacating notice...");
  const vn = await upsert(
    prisma.vacatingNotice,
    { leaseId: l2.id },
    { leaseId: l2.id, unitId: u102.id, tenantId: james.id,
      organizationId: ORG_ID,
      intendedMoveOut: days(30), enforcedMoveOut: days(30),
      noticePeriodDays: 30,
      tenantNote: "I am relocating to Mombasa for a new job. Thank you for a comfortable stay.",
      status: "PENDING" }
  );
  console.log(`  ✓ Vacating notice (James, 30 days): ${vn.id}`);

  // ── Lease renewal alert ────────────────────────────────────────────────────────
  console.log("\n🔔  Lease renewal alert...");
  const lra = await upsert(
    prisma.leaseRenewalAlert,
    { leaseId: l1.id },
    { id: uid(), leaseId: l1.id, propertyId: prop.id, unitId: u101.id,
      tenantUserId: grace.id, expiryDate: days(245),
      status: "scheduled" }
  );
  console.log(`  ✓ Renewal alert (Grace, expires ${days(245).toLocaleDateString("en-GB")}): ${lra.id}`);

  // ── Stock items (short-stay) ──────────────────────────────────────────────────
  console.log("\n📦  Short-stay stock...");
  const stock1 = await upsert(
    prisma.stockItem,
    { shortStayId: ssp.id, name: "Bath Towels" },
    { shortStayId: ssp.id, name: "Bath Towels",
      unit: "pcs", unitCost: 650, quantityInStock: 8, reorderLevel: 4 }
  );
  const stock2 = await upsert(
    prisma.stockItem,
    { shortStayId: ssp.id, name: "Toilet Rolls" },
    { shortStayId: ssp.id, name: "Toilet Rolls",
      unit: "pcs", unitCost: 80, quantityInStock: 3, reorderLevel: 6 }
  );
  const stock3 = await upsert(
    prisma.stockItem,
    { shortStayId: ssp.id, name: "Bottled Water (500ml)" },
    { shortStayId: ssp.id, name: "Bottled Water (500ml)",
      unit: "pcs", unitCost: 50, quantityInStock: 12, reorderLevel: 6 }
  );
  console.log(`  ✓ Bath Towels (qty 8): ${stock1.id}`);
  console.log(`  ✓ Toilet Rolls (qty 3, below reorder level!): ${stock2.id}`);
  console.log(`  ✓ Bottled Water (qty 12): ${stock3.id}`);

  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  DEMO SEED COMPLETE");
  console.log("───────────────────────────────────────────────────────────────");
  console.log("  URL:         http://localhost:3000");
  console.log("  Admin login: admin@secureliving.com / (existing password)");
  console.log("  Demo users (password: Demo@1234):");
  console.log("    grace.muthoni@demo.ke  (tenant)");
  console.log("    james.kariuki@demo.ke  (tenant)");
  console.log("    samuel.otieno@demo.ke  (staff)");
  console.log("    peter.njoroge@demo.ke  (service provider)");
  console.log("    diana.weru@demo.ke     (service provider)");
  console.log("───────────────────────────────────────────────────────────────");
  console.log("  Property:    Westlands Heights (6 units)");
  console.log("  Short-stay:  Unit 103 → 3 bookings");
  console.log("  Leases:      2 active + 1 draft");
  console.log("  Checklists:  3 templates + 1 live instance");
  console.log("  Service req: 4 (in progress, approved, completed, draft)");
  console.log("  Providers:   2 approved");
  console.log("  Listings:    2 (published + draft)");
  console.log("  Visitors:    3 + 2 logs");
  console.log("  QR apps:     3 (pending, verified, applied)");
  console.log("  Transactions:3 (rent, short-stay, deposit)");
  console.log("  Stock items: 3 (1 below min alert)");
  console.log("═══════════════════════════════════════════════════════════════");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("\n❌  Seed error:", e.message);
    if (e.meta) console.error("   Meta:", JSON.stringify(e.meta));
    await prisma.$disconnect();
    process.exit(1);
  });
