import { prisma } from "./prisma.service.js";
import { redis } from "../config/redis.js";

/**
 * Check if the database is accessible
 */
export async function checkDatabaseHealth(): Promise<{
  status: string;
  details?: string;
}> {
  try {
    // Run a simple query to verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    return { status: "OK" };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      status: "ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if Redis is accessible and responsive
 */
export async function checkRedisHealth(): Promise<{
  status: string;
  details?: string;
}> {
  try {
    // Try to ping Redis
    const pong = await redis.ping();

    if (pong === "PONG") {
      return { status: "OK" };
    } else {
      return {
        status: "ERROR",
        details: "Redis ping did not return PONG",
      };
    }
  } catch (error) {
    console.error("Redis health check failed:", error);
    return {
      status: "ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Perform comprehensive health check of all services
 */
export async function performHealthCheck() {
  const [databaseHealth, redisHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  const overallStatus =
    databaseHealth.status === "OK" && redisHealth.status === "OK"
      ? "OK"
      : "ERROR";

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: {
      database: databaseHealth,
      redis: redisHealth,
    },
  };
}
