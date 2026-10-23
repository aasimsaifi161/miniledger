import crypto from "crypto";

/**
 * Generates a random 6-digit numeric OTP string (e.g., "592183").
 * Kept in this utility file so tests can mock it reliably without modifying production logic.
 */
export function generateOtp(): string {
  // Generates an integer between 100000 and 999999 inclusive
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

/**
 * Hashes an OTP code using SHA-256 before saving to the database.
 * Only the hash is stored to protect user security.
 */
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}
