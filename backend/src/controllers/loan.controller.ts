import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "../db";
import { formatLoan } from "../utils/loan";
import { uploadsDir } from "../middleware/upload";

/**
 * POST /loans
 * Creates a new loan for the authenticated user and returns it.
 */
export async function createLoan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { friendName, amount, dueDate } = req.body;
    const userId = req.userId!;

    const loan = await prisma.loan.create({
      data: {
        userId,
        friendName: friendName.trim(),
        amount,
        dueDate: new Date(dueDate),
      },
    });

    res.status(201).json(formatLoan(loan, req));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /loans
 * Lists all loans belonging to the authenticated user, sorted by dueDate ascending.
 * Each loan includes computed isOverdue and receiptUrl fields.
 */
export async function listLoans(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId!;

    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: { dueDate: "asc" },
    });

    res.status(200).json(loans.map((loan) => formatLoan(loan, req)));
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /loans/:id/repay
 * Marks a loan as repaid and records the current timestamp.
 * Returns 404 if not found or belongs to another user.
 * Returns 409 if the loan is already repaid.
 */
export async function repayLoan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const userId = req.userId!;

    const loan = await prisma.loan.findFirst({
      where: { id, userId },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    if (loan.isRepaid) {
      res.status(409).json({ error: "Loan is already repaid" });
      return;
    }

    const updated = await prisma.loan.update({
      where: { id: loan.id },
      data: {
        isRepaid: true,
        repaidAt: new Date(),
      },
    });

    res.status(200).json(formatLoan(updated, req));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /loans/:id/receipt
 * Attaches an uploaded receipt image to the loan.
 * Returns 404 if loan does not exist or belongs to another user.
 * Returns updated loan with receiptUrl.
 */
export async function uploadReceipt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const userId = req.userId!;

    if (!req.file) {
      res.status(400).json({ error: "Receipt image file is required" });
      return;
    }

    // Verify ownership of the loan
    const loan = await prisma.loan.findFirst({
      where: { id, userId },
    });

    if (!loan) {
      // Clean up the newly uploaded file to avoid orphaned files
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    // Optionally delete old receipt file if replacing
    if (loan.receiptPath) {
      const oldFilename = path.basename(loan.receiptPath);
      const oldPath = path.join(uploadsDir, oldFilename);
      if (fs.existsSync(oldPath)) {
        fs.unlink(oldPath, () => {});
      }
    }

    // Store relative path in database
    const receiptPath = `uploads/${req.file.filename}`;

    const updated = await prisma.loan.update({
      where: { id: loan.id },
      data: { receiptPath },
    });

    res.status(200).json(formatLoan(updated, req));
  } catch (error) {
    // If an error occurred, remove uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
}

/**
 * DELETE /loans/:id
 * Deletes a loan by id for the authenticated user.
 * Also removes any uploaded receipt file from disk.
 * Returns 404 if loan not found or belongs to another user.
 */
export async function deleteLoan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const userId = req.userId!;

    const loan = await prisma.loan.findFirst({
      where: { id, userId },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    // Clean up receipt file if exists
    if (loan.receiptPath) {
      const filename = path.basename(loan.receiptPath);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
      }
    }

    await prisma.loan.delete({
      where: { id: loan.id },
    });

    res.status(200).json({ success: true, message: "Loan deleted successfully" });
  } catch (error) {
    next(error);
  }
}
