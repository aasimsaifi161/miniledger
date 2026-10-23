import { z } from "zod";

/**
 * Validation schema for POST /auth/request-otp.
 * Phone must be 10 to 13 digits with an optional leading plus.
 */
export const requestOtpSchema = z.object({
  phone: z
    .string({ message: "Phone number is required" })
    .regex(
      /^\+?[0-9]{10,13}$/,
      "Phone must be a valid 10 to 13 digit number with an optional leading +"
    ),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

/**
 * Validation schema for POST /auth/verify-otp.
 * Phone must match phone format, and OTP must be exactly 6 digits.
 */
export const verifyOtpSchema = z.object({
  phone: z
    .string({ message: "Phone number is required" })
    .regex(
      /^\+?[0-9]{10,13}$/,
      "Phone must be a valid 10 to 13 digit number with an optional leading +"
    ),
  otp: z
    .string({ message: "OTP code is required" })
    .regex(/^[0-9]{6}$/, "OTP must be exactly 6 digits"),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
