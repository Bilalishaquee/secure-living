/**
 * Data Migration: backfill legacy ServiceRequest rows
 *
 * Targets rows where serviceType IS NULL (created before Phase 3)
 * and maps the legacy string `type` + `status` fields onto the
 * new Phase 3 enum fields: serviceType, srStatus, serviceMode, srCategory.
 *
 * Run: node scripts/migrate-maintenance-to-service-requests.mjs
 * Safe to re-run: only touches rows with serviceType = null.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Map legacy string status → SrStatus enum value
const STATUS_MAP = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  // Legacy variants
  draft: "DRAFT",
  submitted: "SUBMITTED",
  pending: "SUBMITTED",
  approved: "APPROVED",
  in_progress: "IN_PROGRESS",
  "in-progress": "IN_PROGRESS",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  canceled: "CANCELLED",
  rejected: "REJECTED",
  open: "SUBMITTED",
  closed: "COMPLETED",
};

// Map legacy string type → ServiceRequestType enum value
const TYPE_MAP = {
  maintenance: "MAINTENANCE",
  inspection: "INSPECTION",
  legal: "LEGAL",
  proxy: "PROXY",
  valuation: "VALUATION",
  cleaning: "CLEANING",
  food_delivery: "FOOD_DELIVERY",
  airport_transfer: "AIRPORT_TRANSFER",
  guest_assistance: "GUEST_ASSISTANCE",
  custom: "CUSTOM",
};

async function main() {
  console.log("Starting Phase 2 → Phase 3 service request migration…\n");

  // Find all rows missing serviceType
  const legacy = await prisma.serviceRequest.findMany({
    where: { serviceType: null },
    select: { id: true, type: true, status: true, srStatus: true },
  });

  console.log(`Found ${legacy.length} legacy rows to migrate.`);

  if (legacy.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  let success = 0;
  let skipped = 0;

  for (const row of legacy) {
    const rawType = (row.type ?? "maintenance").toLowerCase();
    const rawStatus = (row.status ?? "DRAFT");

    const serviceType = TYPE_MAP[rawType] ?? "MAINTENANCE";
    const srStatus = STATUS_MAP[rawStatus] ?? STATUS_MAP[rawStatus.toLowerCase()] ?? "DRAFT";

    try {
      await prisma.serviceRequest.update({
        where: { id: row.id },
        data: {
          serviceType,
          srStatus,
          serviceMode: "MARKETPLACE",
          srCategory: "OPERATIONAL",
        },
      });
      success++;
      process.stdout.write(`\r  Migrated ${success}/${legacy.length}…`);
    } catch (err) {
      console.warn(`\n  Skipped ${row.id}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n\nMigration complete.`);
  console.log(`  Migrated: ${success}`);
  console.log(`  Skipped:  ${skipped}`);
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
