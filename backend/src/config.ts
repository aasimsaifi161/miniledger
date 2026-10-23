import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Validates that an environment variable exists, or throws a clear error.
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Application configuration loaded from environment variables.
 */
export const config = {
  DATABASE_URL: getRequiredEnv("DATABASE_URL"),
  JWT_SECRET: getRequiredEnv("JWT_SECRET"),
  PORT: parseInt(process.env.PORT || "4000", 10),
};
