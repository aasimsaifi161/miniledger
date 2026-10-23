import { Request, Response, NextFunction } from "express";
import { prisma } from "../db";
import { getStartOfToday } from "../utils/date";

/**
 * GET /summary
 * Computes aggregate metrics for the authenticated user using Prisma aggregate queries:
 * - totalLent: sum of all loan amounts
 * - totalRepaid: sum of amounts where isRepaid is true
 * - overdueAmount: sum of unrepaid loan amounts with dueDate before start of today
 * - totalCount: count of all loans
 * - repaidCount: count of repaid loans
 * - overdueCount: count of overdue loans
 *
 * All amounts and counts return 0 (not null) when there are no loans.
 */
export async function getSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;
    const startOfToday = getStartOfToday();

    // Run Prisma aggregate queries concurrently
    const [allLoansAgg, repaidLoansAgg, overdueLoansAgg] = await Promise.all([
      // Total lent & total count
      prisma.loan.aggregate({
        where: { userId },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Total repaid & repaid count
      prisma.loan.aggregate({
        where: {
          userId,
          isRepaid: true,
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Overdue amount & overdue count (unrepaid & due strictly before today)
      prisma.loan.aggregate({
        where: {
          userId,
          isRepaid: false,
          dueDate: { lt: startOfToday },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    res.status(200).json({
      totalLent: allLoansAgg._sum.amount ?? 0,
      totalRepaid: repaidLoansAgg._sum.amount ?? 0,
      overdueAmount: overdueLoansAgg._sum.amount ?? 0,
      totalCount: allLoansAgg._count.id ?? 0,
      repaidCount: repaidLoansAgg._count.id ?? 0,
      overdueCount: overdueLoansAgg._count.id ?? 0,
    });
  } catch (error) {
    next(error);
  }
}
