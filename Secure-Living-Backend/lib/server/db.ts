import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const resolvedDatabaseUrl =
  process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0
    ? process.env.DATABASE_URL
    : process.cwd().endsWith("Secure-Living-Backend")
      ? `file:${path.resolve(process.cwd(), "dev.db")}`
      : `file:${path.resolve(process.cwd(), "Secure-Living-Backend/dev.db")}`;
process.env.DATABASE_URL = resolvedDatabaseUrl;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: resolvedDatabaseUrl } },
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
