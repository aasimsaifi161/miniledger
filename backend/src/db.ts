import { PrismaClient } from "@prisma/client";

/**
 * Shared singleton instance of the PrismaClient.
 * Reusing a single instance avoids exhausting database connection pool limits.
 */
export const prisma = new PrismaClient();
