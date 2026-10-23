import { z } from "zod";

/**
 * Validation schema for POST /loans.
 * - friendName: 1 to 60 trimmed characters
 * - amount: positive integer
 * - dueDate: valid ISO date string
 */
export const createLoanSchema = z.object({
  friendName: z
    .string({ message: "Friend name is required" })
    .trim()
    .min(1, "Friend name must be between 1 and 60 characters")
    .max(60, "Friend name must be between 1 and 60 characters"),
  amount: z
    .number({ message: "Amount is required" })
    .int("Amount must be an integer")
    .positive("Amount must be a positive integer"),
  dueDate: z
    .string({ message: "Due date is required" })
    .refine(
      (val) => !isNaN(Date.parse(val)) && /^\d{4}-\d{2}-\d{2}/.test(val),
      { message: "Due date must be a valid ISO date" }
    ),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;

/**
 * Validation schema for routes with an :id parameter (UUID).
 */
export const loanIdParamSchema = z.object({
  id: z
    .string({ message: "Loan ID is required" })
    .uuid("Loan ID must be a valid UUID"),
});

export type LoanIdParam = z.infer<typeof loanIdParamSchema>;
