const { PrismaClient } = require("@prisma/client");
const { randomUUID, randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();
const ORG_ID = "org1";
const BRANCH_ID = "b1";
const ADMIN_ID = "7b8466b0-9d31-485d-b7a9-c5f7f3c089f7";
const ADMIN_PASSWORD = "Admin@Secure2026!";

function hashPassword(pw) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

async function main() {
  const superAdminRole = await prisma.role.findUnique({ where: { slug: "super_admin" } });
  if (!superAdminRole) throw new Error("super_admin role not found — run seed.js first");

  const existing = await prisma.appUser.findUnique({ where: { email: "admin@secureliving.com" } });
  const admin = existing
    ? existing
    : await prisma.appUser.create({
        data: {
          id: ADMIN_ID,
          email: "admin@secureliving.com",
          fullName: "Secure Living Admin",
          passwordHash: hashPassword(ADMIN_PASSWORD),
          status: "active",
        },
      });

  const existingAssignment = await prisma.userRoleAssignment.findFirst({
    where: { userId: admin.id, organizationId: ORG_ID },
  });
  if (!existingAssignment) {
    await prisma.userRoleAssignment.create({
      data: {
        id: randomUUID(),
        userId: admin.id,
        roleId: superAdminRole.id,
        organizationId: ORG_ID,
        branchId: BRANCH_ID,
        status: "active",
      },
    });
  }

  console.log(`Admin ready: admin@secureliving.com / ${ADMIN_PASSWORD} (id: ${admin.id})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
