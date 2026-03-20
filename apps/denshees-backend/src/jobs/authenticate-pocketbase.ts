import { prisma } from "../services/prisma.service.js";

async function processAuthJob() {
  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection verified.");
  } catch (error) {
    console.error("Database connection check failed:", error);
  }
}

export { processAuthJob };
