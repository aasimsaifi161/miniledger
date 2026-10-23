import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { app } from "../src/app";
import { prisma } from "../src/db";
import { config } from "../src/config";
import { uploadsDir } from "../src/middleware/upload";

describe("Loan Endpoints", () => {
  const phoneA = `+9198100${Math.floor(10000 + Math.random() * 90000)}`;
  const phoneB = `+9198200${Math.floor(10000 + Math.random() * 90000)}`;

  let userA: { id: string; phone: string };
  let tokenA: string;
  let userB: { id: string; phone: string };
  let tokenB: string;

  const uploadedFilesToCleanup: string[] = [];

  beforeAll(async () => {
    // Create User A
    userA = await prisma.user.create({
      data: { phone: phoneA },
    });
    tokenA = jwt.sign({ userId: userA.id }, config.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Create User B
    userB = await prisma.user.create({
      data: { phone: phoneB },
    });
    tokenB = jwt.sign({ userId: userB.id }, config.JWT_SECRET, {
      expiresIn: "7d",
    });
  });

  afterAll(async () => {
    try {
      // Clean up uploaded test files
      for (const filePath of uploadedFilesToCleanup) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Clean up users and cascaded loans
      await prisma.user.deleteMany({
        where: { id: { in: [userA.id, userB.id] } },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  describe("Authentication Guard", () => {
    it("should return 401 when Authorization header is missing", async () => {
      const res = await request(app).get("/loans");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("should return 401 when token is invalid", async () => {
      const res = await request(app)
        .get("/loans")
        .set("Authorization", "Bearer invalid-token-string");
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /loans (Validation & Creation)", () => {
    it("should reject loan creation when friendName is empty or only whitespace", async () => {
      const res = await request(app)
        .post("/loans")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          friendName: "   ",
          amount: 500,
          dueDate: "2026-11-01T00:00:00.000Z",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Validation failed");
      expect(res.body.details).toHaveProperty("friendName");
    });

    it("should reject loan creation when amount is not a positive integer", async () => {
      const resNegative = await request(app)
        .post("/loans")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          friendName: "Alice",
          amount: -100,
          dueDate: "2026-11-01T00:00:00.000Z",
        });
      expect(resNegative.status).toBe(400);
      expect(resNegative.body.details).toHaveProperty("amount");

      const resZero = await request(app)
        .post("/loans")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          friendName: "Alice",
          amount: 0,
          dueDate: "2026-11-01T00:00:00.000Z",
        });
      expect(resZero.status).toBe(400);
      expect(resZero.body.details).toHaveProperty("amount");
    });

    it("should reject loan creation when dueDate is invalid", async () => {
      const res = await request(app)
        .post("/loans")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          friendName: "Alice",
          amount: 500,
          dueDate: "not-a-valid-date",
        });

      expect(res.status).toBe(400);
      expect(res.body.details).toHaveProperty("dueDate");
    });

    it("should successfully create a loan and return formatted response", async () => {
      const dueDate = new Date(Date.now() + 7 * 86400000).toISOString();
      const res = await request(app)
        .post("/loans")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          friendName: " Rahul Sharma ",
          amount: 1500,
          dueDate,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.userId).toBe(userA.id);
      expect(res.body.friendName).toBe("Rahul Sharma"); // trimmed
      expect(res.body.amount).toBe(1500);
      expect(res.body.dueDate).toBe(dueDate);
      expect(res.body.isRepaid).toBe(false);
      expect(res.body.repaidAt).toBeNull();
      expect(res.body.receiptUrl).toBeNull();
      expect(res.body.isOverdue).toBe(false);
      expect(res.body).toHaveProperty("createdAt");
    });
  });

  describe("GET /loans (Listing & isOverdue computation)", () => {
    it("should list user's loans sorted by dueDate ascending with computed isOverdue", async () => {
      // Clear loans for User A
      await prisma.loan.deleteMany({ where: { userId: userA.id } });

      // Create an overdue loan (dueDate was 3 days ago)
      const pastDate = new Date(Date.now() - 3 * 86400000);
      pastDate.setHours(12, 0, 0, 0);

      // Create a future loan (dueDate is 5 days ahead)
      const futureDate = new Date(Date.now() + 5 * 86400000);
      futureDate.setHours(12, 0, 0, 0);

      await prisma.loan.create({
        data: {
          userId: userA.id,
          friendName: "Future Friend",
          amount: 2000,
          dueDate: futureDate,
        },
      });

      await prisma.loan.create({
        data: {
          userId: userA.id,
          friendName: "Past Friend",
          amount: 800,
          dueDate: pastDate,
        },
      });

      const res = await request(app)
        .get("/loans")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);

      // First loan should be Past Friend because it's sorted ascending by dueDate
      expect(res.body[0].friendName).toBe("Past Friend");
      expect(res.body[0].isOverdue).toBe(true);

      // Second loan should be Future Friend
      expect(res.body[1].friendName).toBe("Future Friend");
      expect(res.body[1].isOverdue).toBe(false);
    });
  });

  describe("PATCH /loans/:id/repay", () => {
    it("should mark loan as repaid and set repaidAt timestamp", async () => {
      const loan = await prisma.loan.create({
        data: {
          userId: userA.id,
          friendName: "Charlie",
          amount: 500,
          dueDate: new Date(Date.now() - 86400000), // overdue loan
        },
      });

      const res = await request(app)
        .patch(`/loans/${loan.id}/repay`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(loan.id);
      expect(res.body.isRepaid).toBe(true);
      expect(res.body.repaidAt).not.toBeNull();
      // Repaid loans must NOT be overdue
      expect(res.body.isOverdue).toBe(false);
    });

    it("should return 409 Conflict when repaying a loan that is already repaid", async () => {
      const loan = await prisma.loan.create({
        data: {
          userId: userA.id,
          friendName: "David",
          amount: 300,
          dueDate: new Date(),
          isRepaid: true,
          repaidAt: new Date(),
        },
      });

      const res = await request(app)
        .patch(`/loans/${loan.id}/repay`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty("error", "Loan is already repaid");
    });

    it("should return 400 for invalid UUID param", async () => {
      const res = await request(app)
        .patch("/loans/not-a-uuid/repay")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Validation failed");
      expect(res.body.details).toHaveProperty("id");
    });

    it("should return 404 if loan does not exist", async () => {
      const fakeUuid = "00000000-0000-0000-0000-000000000000";
      const res = await request(app)
        .patch(`/loans/${fakeUuid}/repay`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Loan not found");
    });
  });

  describe("Data Isolation & Authorization Scoping", () => {
    it("should prevent User B from accessing or repaying User A's loan", async () => {
      const loanA = await prisma.loan.create({
        data: {
          userId: userA.id,
          friendName: "User A Loan",
          amount: 1000,
          dueDate: new Date(),
        },
      });

      // User B attempts to repay User A's loan
      const repayRes = await request(app)
        .patch(`/loans/${loanA.id}/repay`)
        .set("Authorization", `Bearer ${tokenB}`);

      // Must return 404 because query is scoped to userId
      expect(repayRes.status).toBe(404);
      expect(repayRes.body).toHaveProperty("error", "Loan not found");

      // User B lists loans - User A's loan must NOT be present
      const listRes = await request(app)
        .get("/loans")
        .set("Authorization", `Bearer ${tokenB}`);

      expect(listRes.status).toBe(200);
      const found = listRes.body.find((l: any) => l.id === loanA.id);
      expect(found).toBeUndefined();
    });
  });

  describe("POST /loans/:id/receipt (Multipart Upload)", () => {
    it("should accept valid PNG receipt and return updated loan with receiptUrl", async () => {
      const loan = await prisma.loan.create({
        data: {
          userId: userA.id,
          friendName: "Receipt Test",
          amount: 1200,
          dueDate: new Date(),
        },
      });

      // 1x1 transparent PNG buffer
      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        "base64"
      );

      const res = await request(app)
        .post(`/loans/${loan.id}/receipt`)
        .set("Authorization", `Bearer ${tokenA}`)
        .attach("receipt", pngBuffer, "test-receipt.png");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(loan.id);
      expect(res.body.receiptPath).toMatch(/^uploads\/receipt-.*\.png$/);
      expect(res.body.receiptUrl).toMatch(/^http:\/\/.*\/uploads\/receipt-.*\.png$/);

      // Track created file for cleanup
      const filename = path.basename(res.body.receiptPath);
      uploadedFilesToCleanup.push(path.join(uploadsDir, filename));
    });

    it("should reject non-image file uploads", async () => {
      const loan = await prisma.loan.create({
        data: {
          userId: userA.id,
          friendName: "Text file test",
          amount: 500,
          dueDate: new Date(),
        },
      });

      const textBuffer = Buffer.from("this is a text file, not an image");

      const res = await request(app)
        .post(`/loans/${loan.id}/receipt`)
        .set("Authorization", `Bearer ${tokenA}`)
        .attach("receipt", textBuffer, "document.txt");

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Only JPEG, PNG and WebP/i);
    });
  });

  describe("DELETE /loans/:id", () => {
    it("should successfully delete user's loan", async () => {
      const loan = await prisma.loan.create({
        data: {
          userId: userA.id,
          friendName: "Delete Me",
          amount: 1500,
          dueDate: new Date(),
        },
      });

      const res = await request(app)
        .delete(`/loans/${loan.id}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await prisma.loan.findUnique({ where: { id: loan.id } });
      expect(check).toBeNull();
    });

    it("should return 404 when trying to delete another user's loan", async () => {
      const loan = await prisma.loan.create({
        data: {
          userId: userA.id,
          friendName: "User A Loan",
          amount: 2000,
          dueDate: new Date(),
        },
      });

      const res = await request(app)
        .delete(`/loans/${loan.id}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Loan not found/i);
    });
  });
});
