import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { prisma } from "../src/db";
import * as otpUtils from "../src/utils/otp";

describe("Auth Endpoints", () => {
  // Use unique test phone numbers to isolate this test suite
  const testPhone = `+9198000${Math.floor(10000 + Math.random() * 90000)}`;
  const fixedOtp = "654321";

  // Mock generateOtp so we know the exact OTP generated
  vi.spyOn(otpUtils, "generateOtp").mockReturnValue(fixedOtp);

  // Clean up any test records after tests complete
  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { phone: testPhone },
      });
      await prisma.otp.deleteMany({
        where: { phone: testPhone },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  describe("POST /auth/request-otp", () => {
    it("should reject invalid phone numbers with 400 and readable error", async () => {
      const res = await request(app)
        .post("/auth/request-otp")
        .send({ phone: "123" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Validation failed");
      expect(res.body.details).toHaveProperty("phone");
    });

    it("should generate and store OTP hash for a valid phone number", async () => {
      const res = await request(app)
        .post("/auth/request-otp")
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "OTP sent successfully");

      // Verify OTP is hashed in the database and not stored in plain text
      const otpRecord = await prisma.otp.findUnique({
        where: { phone: testPhone },
      });
      expect(otpRecord).not.toBeNull();
      expect(otpRecord?.codeHash).toBe(otpUtils.hashOtp(fixedOtp));
      expect(otpRecord?.attempts).toBe(0);
      // Expiry should be roughly 5 minutes in the future
      expect(otpRecord?.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("should reset attempts when requesting a new OTP for the same phone", async () => {
      // Artificially increase attempts in DB
      await prisma.otp.update({
        where: { phone: testPhone },
        data: { attempts: 3 },
      });

      // Request OTP again
      const res = await request(app)
        .post("/auth/request-otp")
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      const updatedRecord = await prisma.otp.findUnique({
        where: { phone: testPhone },
      });
      expect(updatedRecord?.attempts).toBe(0);
    });
  });

  describe("POST /auth/verify-otp", () => {
    it("should reject invalid input schemas with 400", async () => {
      const res = await request(app)
        .post("/auth/verify-otp")
        .send({ phone: testPhone, otp: "12" }); // OTP must be 6 digits

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Validation failed");
      expect(res.body.details).toHaveProperty("otp");
    });

    it("should reject wrong OTP and increment attempts", async () => {
      const res = await request(app)
        .post("/auth/verify-otp")
        .send({ phone: testPhone, otp: "000000" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Invalid OTP code");

      const otpRecord = await prisma.otp.findUnique({
        where: { phone: testPhone },
      });
      expect(otpRecord?.attempts).toBe(1);
    });

    it("should reject verification after 5 failed attempts", async () => {
      // Set attempts to 5
      await prisma.otp.update({
        where: { phone: testPhone },
        data: { attempts: 5 },
      });

      const res = await request(app)
        .post("/auth/verify-otp")
        .send({ phone: testPhone, otp: fixedOtp });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/too many failed attempts/i);
    });

    it("should reject expired OTPs", async () => {
      // Reset attempts and set expiry in the past
      await prisma.otp.update({
        where: { phone: testPhone },
        data: {
          attempts: 0,
          expiresAt: new Date(Date.now() - 60000), // 1 minute ago
        },
      });

      const res = await request(app)
        .post("/auth/verify-otp")
        .send({ phone: testPhone, otp: fixedOtp });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/expired/i);
    });

    it("should accept correct OTP, delete the OTP record, and return JWT + user", async () => {
      // Request a fresh OTP
      await request(app)
        .post("/auth/request-otp")
        .send({ phone: testPhone });

      const res = await request(app)
        .post("/auth/verify-otp")
        .send({ phone: testPhone, otp: fixedOtp });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(typeof res.body.token).toBe("string");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user).toHaveProperty("phone", testPhone);
      expect(res.body.user).toHaveProperty("createdAt");

      // Verify OTP is deleted from database
      const deletedOtp = await prisma.otp.findUnique({
        where: { phone: testPhone },
      });
      expect(deletedOtp).toBeNull();

      // Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { phone: testPhone },
      });
      expect(user).not.toBeNull();
      expect(user?.id).toBe(res.body.user.id);
    });
  });
});
