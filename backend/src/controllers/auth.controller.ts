import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { config } from "../config";
import { generateOtp, hashOtp } from "../utils/otp";

/**
 * POST /auth/request-otp
 * Generates a 6-digit OTP, stores its SHA-256 hash with a 5-minute expiry,
 * prints the OTP to console, and resets attempts.
 */
export async function requestOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phone } = req.body;

    const otp = generateOtp();
    const codeHash = hashOtp(otp);
    // 5 minutes expiry from current time
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Upsert OTP record: replaces existing OTP for this phone and resets attempts
    await prisma.otp.upsert({
      where: { phone },
      update: {
        codeHash,
        expiresAt,
        attempts: 0,
      },
      create: {
        phone,
        codeHash,
        expiresAt,
        attempts: 0,
      },
    });

    // Log the generated OTP to console for development/testing
    console.log(`OTP for ${phone}: ${otp}`);

    res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /auth/verify-otp
 * Verifies the submitted OTP code. Rejects expired or invalid codes, enforces
 * a maximum of 5 attempts, finds or creates the user, deletes the used OTP,
 * and returns a 7-day JWT.
 */
export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phone, otp } = req.body;

    const otpRecord = await prisma.otp.findUnique({
      where: { phone },
    });

    if (!otpRecord) {
      res.status(400).json({
        error: "OTP not found. Please request a new OTP.",
      });
      return;
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      res.status(400).json({
        error: "OTP has expired. Please request a new OTP.",
      });
      return;
    }

    // Enforce maximum 5 attempts
    if (otpRecord.attempts >= 5) {
      res.status(400).json({
        error: "Too many failed attempts. Please request a new OTP.",
      });
      return;
    }

    // Verify hash
    const incomingHash = hashOtp(otp);
    if (incomingHash !== otpRecord.codeHash) {
      // Increment failed attempts counter
      await prisma.otp.update({
        where: { phone },
        data: { attempts: { increment: 1 } },
      });

      res.status(400).json({
        error: "Invalid OTP code",
      });
      return;
    }

    // Find or create User
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    // Delete used OTP
    await prisma.otp.delete({
      where: { phone },
    });

    // Generate JWT valid for 7 days
    const token = jwt.sign({ userId: user.id }, config.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}
