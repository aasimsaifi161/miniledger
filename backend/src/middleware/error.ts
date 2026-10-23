import { Request, Response, NextFunction } from "express";
import multer from "multer";

/**
 * 404 handler for routes that do not match any registered endpoints.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Central error-handling middleware that ensures all errors return
 * consistent JSON shaped like { error: string, details?: any }.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Handle Multer-specific errors (e.g., file too large)
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        error: "File size exceeds 5MB limit",
      });
      return;
    }
    res.status(400).json({
      error: `Upload error: ${err.message}`,
    });
    return;
  }

  // Handle Multer fileFilter custom errors
  if (err && typeof err.message === "string" && err.message.includes("Only JPEG, PNG and WebP")) {
    res.status(400).json({
      error: err.message,
    });
    return;
  }

  // Handle malformed JSON body from express.json()
  if (err && "status" in err && err.status === 400 && "body" in err) {
    res.status(400).json({
      error: "Invalid JSON format in request body",
    });
    return;
  }

  // Handle explicit HTTP status errors
  if (err && typeof err.status === "number" && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({
      error: err.message || "Client error",
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Log unhandled server errors and return 500
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
  });
}
