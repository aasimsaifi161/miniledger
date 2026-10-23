import { Loan } from "@prisma/client";
import { Request } from "express";
import path from "path";
import { getStartOfToday } from "./date";

/**
 * Shape of a formatted loan returned to mobile clients.
 */
export interface FormattedLoan {
  id: string;
  userId: string;
  friendName: string;
  amount: number;
  dueDate: string;
  isRepaid: boolean;
  repaidAt: string | null;
  receiptPath: string | null;
  receiptUrl: string | null;
  isOverdue: boolean;
  createdAt: string;
}

/**
 * Transforms a Prisma Loan database record into a clean, mobile-friendly JSON object:
 * - Computes `isOverdue`: true if unrepaid and dueDate is strictly before the start of today.
 * - Computes `receiptUrl`: an absolute URL using the request host if a receipt exists, otherwise null.
 * - Converts all Date instances to standard ISO strings.
 */
export function formatLoan(loan: Loan, req: Request): FormattedLoan {
  const startOfToday = getStartOfToday();
  const isOverdue = !loan.isRepaid && new Date(loan.dueDate) < startOfToday;

  let receiptUrl: string | null = null;
  if (loan.receiptPath) {
    const filename = path.basename(loan.receiptPath);
    const host = req.get("host") || "localhost:4000";
    receiptUrl = `${req.protocol}://${host}/uploads/${filename}`;
  }

  return {
    id: loan.id,
    userId: loan.userId,
    friendName: loan.friendName,
    amount: loan.amount,
    dueDate: loan.dueDate.toISOString(),
    isRepaid: loan.isRepaid,
    repaidAt: loan.repaidAt ? loan.repaidAt.toISOString() : null,
    receiptPath: loan.receiptPath,
    receiptUrl,
    isOverdue,
    createdAt: loan.createdAt.toISOString(),
  };
}
