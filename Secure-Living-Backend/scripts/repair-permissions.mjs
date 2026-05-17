/**
 * Non-destructive permission repair script.
 * Ensures all roles and permissions are correctly seeded, and that
 * admin users have active role assignments.
 *
 * Safe to run at any time — does NOT delete any user data.
 *
 * Usage (from Secure-Living-Backend/):
 *   node scripts/repair-permissions.mjs
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const envPath = resolve(__dirname, "../.env");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
} catch { /* rely on env vars already set */ }

const prisma = new PrismaClient();

const PERMISSION_CODES = [
  "properties:view", "property:view", "property:create", "property:edit",
  "unit:view", "unit:create",
  "maintenance:view", "maintenance:create", "maintenance:update",
  "maintenance:assign", "maintenance:approve", "maintenance:escalate",
  "finance:view", "finance:approve",
  "org:manage", "rbac:manage", "audit:view", "kyc:upload",
  "leases:view", "leases:manage", "lease:view", "lease:create", "lease:edit",
  "screening:view", "screening:review",
  "rent:collect", "rent_collection:manage",
  "services:view", "services:contractor_admin",
  "tenant:view", "tenant:create", "tenants:view_own",
  "job-assignments:manage",
  // Phase 2 permissions
  "container:view", "container:create", "container:edit", "container:delete",
  "vacating:view", "vacating:create", "vacating:manage",
  "checklist:view", "checklist:create", "checklist:manage",
  "listing:view", "listing:create", "listing:edit", "listing:publish",
  "accounting:view", "accounting:manage",
  "short-stay:view", "short-stay:manage",
  "service-enquiry:view", "service-enquiry:manage",
  "service-category:view", "service-category:manage",
  "role-context:switch",
  "unit-history:view",
  "tenant-lifecycle:view",
  // Phase 3 permissions
  "service-request:view",
  "service-request:create",
  "service-request:manage",
  "service-request:execute",
  "service-request:dispute",
  "service-request:evidence:upload",
  "provider:view",
  "provider:manage",
  "*",
];

const ROLES = [
  { slug: "super_admin", displayName: "Super Admin", perms: ["*"] },
  {
    slug: "admin", displayName: "Admin",
    perms: [
      "org:manage", "rbac:manage", "audit:view", "kyc:upload",
      "properties:view", "property:view", "property:create", "property:edit",
      "unit:view", "unit:create",
      "maintenance:view", "maintenance:create", "maintenance:update",
      "maintenance:assign", "maintenance:approve", "maintenance:escalate",
      "finance:view", "finance:approve",
      "leases:view", "leases:manage", "lease:view", "lease:create", "lease:edit",
      "screening:view", "screening:review",
      "rent:collect", "rent_collection:manage",
      "services:view", "services:contractor_admin",
      "tenant:view", "tenant:create",
      "job-assignments:manage",
      "container:view", "container:create", "container:edit", "container:delete",
      "vacating:view", "vacating:manage",
      "checklist:view", "checklist:create", "checklist:manage",
      "listing:view", "listing:create", "listing:edit", "listing:publish",
      "accounting:view", "accounting:manage",
      "short-stay:view", "short-stay:manage",
      "service-enquiry:view", "service-enquiry:manage",
      "service-category:view", "service-category:manage",
      "unit-history:view", "tenant-lifecycle:view",
      "service-request:view", "service-request:create", "service-request:manage",
      "service-request:execute", "service-request:dispute", "service-request:evidence:upload",
      "provider:view", "provider:manage",
    ],
  },
  {
    slug: "landlord", displayName: "Landlord",
    perms: [
      "properties:view", "property:view", "property:create", "property:edit",
      "unit:view", "unit:create",
      "maintenance:view", "maintenance:create", "maintenance:update", "maintenance:approve",
      "kyc:upload", "finance:view",
      "leases:view", "leases:manage", "lease:view", "lease:create", "lease:edit",
      "screening:view", "screening:review",
      "rent:collect", "rent_collection:manage",
      "services:view", "tenant:view", "tenant:create",
      "job-assignments:manage",
      "container:view", "container:create", "container:edit", "container:delete",
      "vacating:view", "vacating:manage",
      "checklist:view", "checklist:create", "checklist:manage",
      "listing:view", "listing:create", "listing:edit", "listing:publish",
      "accounting:view", "accounting:manage",
      "short-stay:view", "short-stay:manage",
      "service-enquiry:view",
      "service-category:view",
      "unit-history:view", "tenant-lifecycle:view",
      "role-context:switch",
      "service-request:view", "service-request:create", "service-request:manage",
      "service-request:dispute",
      "provider:view", "provider:manage",
    ],
  },
  {
    slug: "staff", displayName: "Staff",
    perms: [
      "properties:view", "property:view", "property:edit",
      "unit:view",
      "maintenance:view", "maintenance:update", "maintenance:assign",
      "kyc:upload",
      "leases:view", "lease:view",
      "tenant:view",
      "services:view",
      "job-assignments:manage",
      "container:view",
      "vacating:view", "vacating:manage",
      "checklist:view", "checklist:create",
      "listing:view",
      "accounting:view",
      "short-stay:view", "short-stay:manage",
      "unit-history:view",
      "service-request:view", "service-request:create", "service-request:execute",
      "service-request:evidence:upload",
      "provider:view",
    ],
  },
  {
    slug: "tenant", displayName: "Tenant",
    perms: [
      "properties:view", "property:view",
      "maintenance:view", "maintenance:create",
      "kyc:upload",
      "leases:view", "lease:view",
      "tenants:view_own",
      "vacating:create", "vacating:view",
      "checklist:view",
      "role-context:switch",
      "service-request:view", "service-request:create", "service-request:dispute",
    ],
  },
];

// Known admin accounts created via create-admin.mjs
const ADMIN_ACCOUNTS = [
  { email: "admin@secureliving.com", roleSlug: "super_admin" },
  { email: "manager@secureliving.com", roleSlug: "admin" },
];

async function main() {
  console.log("=== Secure Living — Permission Repair ===\n");

  // 1. Upsert permissions
  console.log("1. Syncing permissions…");
  const permMap = {};
  for (const code of PERMISSION_CODES) {
    const perm = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { id: randomUUID(), code },
    });
    permMap[code] = perm;
  }
  console.log(`   ✓ ${PERMISSION_CODES.length} permissions ensured\n`);

  // 2. Upsert roles and link permissions
  console.log("2. Syncing roles and role-permission links…");
  const roleMap = {};
  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { slug: roleDef.slug },
      update: { displayName: roleDef.displayName },
      create: { id: randomUUID(), slug: roleDef.slug, displayName: roleDef.displayName },
    });
    roleMap[roleDef.slug] = role;

    let linked = 0;
    for (const permCode of roleDef.perms) {
      const perm = permMap[permCode];
      if (!perm) continue;
      try {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { id: randomUUID(), roleId: role.id, permissionId: perm.id },
        });
        linked++;
      } catch { /* skip duplicates */ }
    }
    console.log(`   ✓ ${roleDef.slug}: ${linked} permissions linked`);
  }
  console.log();

  // 3. Ensure default org/branch exist
  console.log("3. Checking default org/branch…");
  let org = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        id: randomUUID(),
        name: "Secure Living Platform",
        type: "Platform",
        country: "Kenya",
        email: "platform@secureliving.app",
      },
    });
    console.log(`   Created org: ${org.name}`);
  } else {
    console.log(`   ✓ Using org: ${org.name}`);
  }
  let branch = await prisma.branch.findFirst({ where: { organizationId: org.id }, orderBy: { createdAt: "asc" } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        id: randomUUID(),
        organizationId: org.id,
        name: "HQ",
        location: "Nairobi",
      },
    });
    console.log(`   Created branch: ${branch.name}`);
  } else {
    console.log(`   ✓ Using branch: ${branch.name}`);
  }
  console.log();

  // 4. Fix admin user role assignments
  console.log("4. Checking admin user role assignments…");
  for (const { email, roleSlug } of ADMIN_ACCOUNTS) {
    const user = await prisma.appUser.findUnique({ where: { email } });
    if (!user) {
      console.log(`   ⚠ User ${email} not found — run create-admin.mjs to create it`);
      continue;
    }
    const role = roleMap[roleSlug];
    if (!role) { console.log(`   ⚠ Role ${roleSlug} not found`); continue; }

    const existing = await prisma.userRoleAssignment.findFirst({
      where: { userId: user.id, roleId: role.id, status: "active" },
    });
    if (existing) {
      console.log(`   ✓ ${email} already has active ${roleSlug} assignment`);
    } else {
      await prisma.userRoleAssignment.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          roleId: role.id,
          organizationId: org.id,
          branchId: branch.id,
          status: "active",
        },
      });
      console.log(`   ✓ Created ${roleSlug} assignment for ${email}`);
    }
  }
  console.log();

  // 5. Fix any registered users whose role assignments are missing active status
  console.log("5. Checking all user role assignments for correct status…");
  const brokenAssignments = await prisma.userRoleAssignment.findMany({
    where: { status: { not: "active" } },
  });
  if (brokenAssignments.length > 0) {
    await prisma.userRoleAssignment.updateMany({
      where: { id: { in: brokenAssignments.map((a) => a.id) } },
      data: { status: "active" },
    });
    console.log(`   ✓ Fixed ${brokenAssignments.length} assignments with wrong status`);
  } else {
    console.log(`   ✓ All assignments have correct status`);
  }
  console.log();

  // 6. Backfill role assignments for any user who registered when roles weren't seeded
  console.log("6. Backfilling role assignments for users with none…");
  const allUsers = await prisma.appUser.findMany({ select: { id: true, email: true } });
  const usersWithAssignments = await prisma.userRoleAssignment.findMany({
    where: { status: "active" },
    select: { userId: true },
  });
  const assignedUserIds = new Set(usersWithAssignments.map((a) => a.userId));
  const unassignedUsers = allUsers.filter((u) => !assignedUserIds.has(u.id));

  if (unassignedUsers.length === 0) {
    console.log("   ✓ All users already have role assignments");
  } else {
    const landlordRole = roleMap["landlord"];
    if (!landlordRole) {
      console.log("   ⚠ landlord role not found — skipping backfill");
    } else {
      for (const u of unassignedUsers) {
        await prisma.userRoleAssignment.create({
          data: {
            id: randomUUID(),
            userId: u.id,
            roleId: landlordRole.id,
            organizationId: org.id,
            branchId: branch.id,
            status: "active",
          },
        });
        console.log(`   ✓ Assigned landlord role to ${u.email}`);
      }
    }
  }
  console.log();

  // 7. Seed service categories
  console.log("7. Seeding service categories…");
  const SERVICE_CATEGORIES = [
    { name: "Due Diligence", slug: "due-diligence", tagline: "Verify before you buy or rent", description: "Background checks, title deed verification, property history, and encumbrance checks.", icon: "🔍", order: 1 },
    { name: "Foreigner Resettlement", slug: "foreigner-resettlement", tagline: "Settle in Kenya with confidence", description: "Area orientation, school search assistance, utility setup, and local registration guidance.", icon: "🌍", order: 2 },
    { name: "Property Valuation", slug: "property-valuation", tagline: "Know your property's true worth", description: "Professional property valuation and market appraisal services.", icon: "📊", order: 3 },
    { name: "Legal Advisory", slug: "legal-advisory", tagline: "Expert guidance on property law", description: "Expert legal guidance on property transactions, contracts, and disputes.", icon: "⚖️", order: 4 },
    { name: "Interior Design", slug: "interior-design", tagline: "Transform your space", description: "Professional interior design and furnishing consultation services.", icon: "🛋️", order: 5 },
    { name: "Cleaning", slug: "cleaning", tagline: "Pristine spaces, every time", description: "Professional cleaning services for residential and commercial properties.", icon: "🧹", order: 6 },
    { name: "Maintenance", slug: "maintenance", tagline: "Keep your property in top shape", description: "General property maintenance, repairs, and renovation services.", icon: "🔧", order: 7 },
    { name: "Airbnb Management", slug: "airbnb-management", tagline: "Earn more from your property", description: "Full short-stay management: listing creation, guest communication, and operations.", icon: "🏡", order: 8 },
  ];
  for (const cat of SERVICE_CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, tagline: cat.tagline, description: cat.description, icon: cat.icon, order: cat.order },
      create: { ...cat },
    });
  }
  console.log(`   ✓ ${SERVICE_CATEGORIES.length} service categories seeded\n`);

  // 8. Seed service type configs
  console.log("8. Seeding service type configs...");
  const serviceTypeConfigs = [
    { serviceType: "MAINTENANCE", quoteRequired: false, supervisorApprovalRequired: false, evidenceRequirements: ["before_photo", "after_photo", "receipt", "resolution_notes"], assignmentRestrictions: "open" },
    { serviceType: "INSPECTION", quoteRequired: false, supervisorApprovalRequired: true, evidenceRequirements: ["geotagged_photos", "meter_readings", "supervisor_signoff"], assignmentRestrictions: "internal" },
    { serviceType: "LEGAL", quoteRequired: true, supervisorApprovalRequired: true, evidenceRequirements: ["legal_documents", "counterparty_acknowledgment"], assignmentRestrictions: "internal" },
    { serviceType: "PROXY", quoteRequired: true, supervisorApprovalRequired: false, evidenceRequirements: ["document_photo", "acknowledgment_receipt", "site_visit_report"], assignmentRestrictions: "internal" },
    { serviceType: "VALUATION", quoteRequired: true, supervisorApprovalRequired: false, evidenceRequirements: ["valuation_certificate", "market_analysis"], assignmentRestrictions: "open" },
    { serviceType: "CLEANING", quoteRequired: false, supervisorApprovalRequired: false, evidenceRequirements: ["before_after_photos", "cleaning_checklist", "stock_items_used"], assignmentRestrictions: "open" },
    { serviceType: "FOOD_DELIVERY", quoteRequired: false, supervisorApprovalRequired: false, evidenceRequirements: ["delivery_photo", "guest_acknowledgment"], assignmentRestrictions: "open" },
    { serviceType: "AIRPORT_TRANSFER", quoteRequired: false, supervisorApprovalRequired: false, evidenceRequirements: ["pickup_confirmation", "dropoff_confirmation", "guest_signature"], assignmentRestrictions: "open" },
    { serviceType: "GUEST_ASSISTANCE", quoteRequired: false, supervisorApprovalRequired: false, evidenceRequirements: ["service_photo", "guest_rating"], assignmentRestrictions: "open" },
    { serviceType: "CUSTOM", quoteRequired: true, supervisorApprovalRequired: true, evidenceRequirements: [], assignmentRestrictions: "open" },
  ];
  for (const config of serviceTypeConfigs) {
    await prisma.serviceTypeConfig.upsert({
      where: { serviceType: config.serviceType },
      update: config,
      create: { id: randomUUID(), ...config },
    });
  }
  console.log(`   ✓ ${serviceTypeConfigs.length} service type configs seeded\n`);

  console.log("=== Repair complete ===");
  console.log("\nNEXT STEP: Have all users log out and log back in to get a fresh token with correct permissions.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
