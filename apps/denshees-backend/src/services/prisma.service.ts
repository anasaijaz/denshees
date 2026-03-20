import { PrismaClient } from "@denshees/database/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as any;

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
