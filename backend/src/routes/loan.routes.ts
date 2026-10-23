import { Router } from "express";
import {
  createLoan,
  listLoans,
  repayLoan,
  uploadReceipt,
  deleteLoan,
} from "../controllers/loan.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { uploadReceiptMiddleware } from "../middleware/upload";
import { createLoanSchema, loanIdParamSchema } from "../schemas/loan.schema";

const router = Router();

// Protect all loan routes with JWT authentication
router.use(requireAuth);

// Create a new loan
router.post("/", validate(createLoanSchema), createLoan);

// List all loans for authenticated user
router.get("/", listLoans);

// Mark loan as repaid
router.patch("/:id/repay", validate(loanIdParamSchema, "params"), repayLoan);

// Upload receipt image for loan
router.post(
  "/:id/receipt",
  validate(loanIdParamSchema, "params"),
  uploadReceiptMiddleware.single("receipt"),
  uploadReceipt
);

// Delete a loan
router.delete("/:id", validate(loanIdParamSchema, "params"), deleteLoan);

export default router;
