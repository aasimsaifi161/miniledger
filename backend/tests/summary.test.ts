import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../src/app";
import { prisma } from "../src/db";
import { config } from "../src/config";

describe("Summary Endpoint", () => {
  const testPhone = `+9198300${Math.floor(10000 + Math.random() * 90000)}`;
  let user: { id: string; phone: string };
  let token: string;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: { phone: testPhone },
    });
    token = jwt.sign({ userId: user.id }, config.JWT_SECRET, {
      expiresIn: "7d",
    });
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: { id: user.id },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  it("should return zeros for all totals and counts when the user has no loans", async () => {
    const res = await request(app)
      .get("/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalLent: 0,
      totalRepaid: 0,
      overdueAmount: 0,
      totalCount: 0,
      repaidCount: 0,
      overdueCount: 0,
    });
  });

  it("should correctly compute aggregate totals and counts with known data", async () => {
    const pastDate = new Date(Date.now() - 4 * 86400000);
    pastDate.setHours(12, 0, 0, 0);

    const futureDate = new Date(Date.now() + 6 * 86400000);
    futureDate.setHours(12, 0, 0, 0);

    // 1. Unrepaid future loan: 1000
    await prisma.loan.create({
      data: {
        userId: user.id,
        friendName: "Future Borrower",
        amount: 1000,
        dueDate: futureDate,
        isRepaid: false,
      },
    });

    // 2. Unrepaid overdue loan: 600
    await prisma.loan.create({
      data: {
        userId: user.id,
        friendName: "Overdue Borrower",
        amount: 600,
        dueDate: pastDate,
        isRepaid: false,
      },
    });

    // 3. Repaid loan (past due date): 400
    await prisma.loan.create({
      data: {
        userId: user.id,
        friendName: "Repaid Borrower",
        amount: 400,
        dueDate: pastDate,
        isRepaid: true,
        repaidAt: new Date(),
      },
    });

    const res = await request(app)
      .get("/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Verified totals:
    // totalLent: 1000 + 600 + 400 = 2000
    // totalRepaid: 400
    // overdueAmount: 600
    // totalCount: 3
    // repaidCount: 1
    // overdueCount: 1
    expect(res.body).toEqual({
      totalLent: 2000,
      totalRepaid: 400,
      overdueAmount: 600,
      totalCount: 3,
      repaidCount: 1,
      overdueCount: 1,
    });
  });
});
