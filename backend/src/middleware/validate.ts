import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type ValidationTarget = "body" | "params" | "query";

/**
 * Reusable Express middleware that validates request data against a Zod schema.
 * If validation fails, it stops the request and returns a 400 Bad Request
 * with readable field-by-field error messages.
 *
 * @param schema - The Zod schema to validate against
 * @param target - The property of req to validate: "body" (default), "params", or "query"
 */
export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details: Record<string, string> = {};

      for (const issue of result.error.issues) {
        const fieldName = issue.path.length > 0 ? issue.path.join(".") : target;
        // Keep the first human-readable error per field
        if (!details[fieldName]) {
          details[fieldName] = issue.message;
        }
      }

      res.status(400).json({
        error: "Validation failed",
        details,
      });
      return;
    }

    // Replace target property with validated/parsed data (e.g. trimmed strings)
    req[target] = result.data;
    next();
  };
}
