import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig, Pool } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function shouldUseNeonAdapter() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  return process.env.DATABASE_DRIVER === "neon" || databaseUrl.includes(".neon.tech");
}

function createPrismaClient(): PrismaClient {
  // Neon URLs use the serverless adapter in every environment so local dev does
  // not depend on direct PostgreSQL TCP access to Neon's pooler.
  if (shouldUseNeonAdapter()) {
    if (typeof WebSocket !== "undefined") {
      neonConfig.webSocketConstructor = WebSocket;
    }
    neonConfig.poolQueryViaFetch = true;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter, log: ["error"] });
  }
  return new PrismaClient({ log: ["error"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
