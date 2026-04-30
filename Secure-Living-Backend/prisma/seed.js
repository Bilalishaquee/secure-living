const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

async function main() {
  await prisma.serviceRequestEvidence.deleteMany();
  await prisma.kycDocument.deleteMany();
  await prisma.apiSession.deleteMany();
  await prisma.userRoleAssignment.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.appUser.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.propertyRoleAssignment.deleteMany();
  await prisma.reminderSchedule.deleteMany();
  await prisma.eSignRequest.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.tenantScreeningReport.deleteMany();
  await prisma.userSubscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.leaseRenewalAlert.deleteMany();
  await prisma.financialReport.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.property.deleteMany();
  await prisma.reconciliationReport.deleteMany();
  await prisma.rentInvoice.deleteMany();
  await prisma.fundHold.deleteMany();
  await prisma.escrowAccount.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.tenantApplication.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.jobAssignment.deleteMany();
  await prisma.professionalProfile.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.serviceRequest.deleteMany();

  const org1 = await prisma.organization.create({
    data: {
      id: "org1",
      name: "Mwakaba Properties",
      type: "Independent Manager",
      country: "Kenya",
      email: "ops@mwakabaproperties.co.ke",
      phone: "+254712000111",
    },
  });
  const org2 = await prisma.organization.create({
    data: {
      id: "org2",
      name: "Kenya Realtors Agency",
      type: "Agency",
      country: "Kenya",
      email: "hello@kenyarealtors.co.ke",
      phone: "+254722444889",
    },
  });
  const b1 = await prisma.branch.create({
    data: { id: "b1", organizationId: org1.id, name: "Nairobi HQ", location: "Westlands, Nairobi" },
  });
  const b2 = await prisma.branch.create({
    data: { id: "b2", organizationId: org1.id, name: "Coastal Office", location: "Nyali, Mombasa" },
  });
  await prisma.branch.create({
    data: { id: "b3", organizationId: org2.id, name: "Kilimani Branch", location: "Kilimani, Nairobi" },
  });

  const permissions = [
    "properties:view", "property:view", "property:create", "property:edit",
    "unit:view", "unit:create",
    "maintenance:view", "maintenance:create", "maintenance:update", "maintenance:assign", "maintenance:approve", "maintenance:escalate",
    "finance:view", "finance:approve",
    "org:manage", "rbac:manage", "audit:view", "kyc:upload",
    "leases:view", "leases:manage", "lease:view", "lease:create", "lease:edit",
    "screening:view", "screening:review",
    "rent:collect", "rent_collection:manage",
    "services:view", "services:contractor_admin",
    "tenant:view", "tenant:create",
    "job-assignments:manage",
    "*",
  ];
  for (const code of permissions) {
    await prisma.permission.create({ data: { id: randomUUID(), code } });
  }

  const roles = [
    { slug: "super_admin", displayName: "Super Admin", perms: ["*"] },
    {
      slug: "admin", displayName: "Admin",
      perms: [
        "org:manage", "rbac:manage", "audit:view", "kyc:upload",
        "properties:view", "property:view", "property:create", "property:edit",
        "unit:view", "unit:create",
        "maintenance:view", "maintenance:create", "maintenance:update", "maintenance:assign", "maintenance:approve", "maintenance:escalate",
        "finance:view", "finance:approve",
        "leases:view", "leases:manage", "lease:view", "lease:create", "lease:edit",
        "screening:view", "screening:review",
        "rent:collect", "rent_collection:manage",
        "services:view", "services:contractor_admin",
        "tenant:view", "tenant:create",
        "job-assignments:manage",
      ],
    },
    {
      slug: "landlord", displayName: "Landlord",
      perms: [
        "properties:view", "property:view", "property:create", "property:edit",
        "unit:view", "unit:create",
        "maintenance:view", "maintenance:create", "maintenance:update", "maintenance:approve",
        "kyc:upload",
        "finance:view",
        "leases:view", "leases:manage", "lease:view", "lease:create", "lease:edit",
        "screening:view", "screening:review",
        "rent:collect", "rent_collection:manage",
        "services:view",
        "tenant:view", "tenant:create",
        "job-assignments:manage",
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
      ],
    },
    {
      slug: "tenant", displayName: "Tenant",
      perms: [
        "properties:view", "property:view",
        "maintenance:view", "maintenance:create",
        "kyc:upload",
        "leases:view", "lease:view",
      ],
    },
  ];

  const roleMap = {};
  for (const role of roles) {
    const created = await prisma.role.create({
      data: { id: randomUUID(), slug: role.slug, displayName: role.displayName },
    });
    roleMap[role.slug] = created;
    const permissionRows = await prisma.permission.findMany({ where: { code: { in: role.perms } } });
    for (const p of permissionRows) {
      await prisma.rolePermission.create({
        data: { id: randomUUID(), roleId: created.id, permissionId: p.id },
      });
    }
  }

  // No seeded app users: all users must come from real registration/login flow.
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
