/**
 * Creates an admin or super_admin user directly in the database.
 *
 * Usage (run from Secure-Living-Backend/):
 *   node scripts/create-admin.mjs --email admin@secureliving.com --password secret123 --name "Admin User"
 *   node scripts/create-admin.mjs --email su@secureliving.com --password secret123 --name "Super Admin" --role super_admin
 */

import { randomBytes, scryptSync, randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dependency needed)
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
} catch {
  // .env not found — rely on environment variables already set
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] ? args[i + 1] : null;
  };
  return {
    email: get("--email"),
    password: get("--password"),
    name: get("--name"),
    role: get("--role") ?? "super_admin",
  };
}

async function main() {
  const { email, password, name, role } = parseArgs();

  if (!email || !password || !name) {
    console.error("Usage: node scripts/create-admin.mjs --email <email> --password <password> --name <name> [--role super_admin|admin]");
    process.exit(1);
  }

  const allowedRoles = ["super_admin", "admin"];
  if (!allowedRoles.includes(role)) {
    console.error(`--role must be one of: ${allowedRoles.join(", ")}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const existing = await prisma.appUser.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      console.error(`User with email ${email} already exists.`);
      process.exit(1);
    }

    const roleRecord = await prisma.role.findUnique({ where: { slug: role } });
    if (!roleRecord) {
      console.error(`Role "${role}" not found. Run "npm run db:seed" first to seed roles.`);
      process.exit(1);
    }

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
      console.log(`Created platform org: ${org.id}`);
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
      console.log(`Created branch: ${branch.id}`);
    }

    const user = await prisma.appUser.create({
      data: {
        id: randomUUID(),
        email: email.toLowerCase(),
        fullName: name,
        passwordHash: hashPassword(password),
      },
    });

    await prisma.userRoleAssignment.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        roleId: roleRecord.id,
        organizationId: org.id,
        branchId: branch.id,
      },
    });

    console.log(`\nCreated ${role} user:`);
    console.log(`  ID:    ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name:  ${user.fullName}`);
    console.log(`  Role:  ${role}`);
    console.log(`\nYou can now log in at /auth/login with the email and password you provided.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
