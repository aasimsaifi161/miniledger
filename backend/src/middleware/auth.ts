import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

/**
 * Extend the Express Request interface to include our authenticated userId.
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

interface JwtPayload {
  userId: string;
}

/**
 * Authentication middleware to protect private routes.
 * 1. Reads the Authorization header (expects "Bearer <token>").
 * 2. Verifies the JWT signature with JWT_SECRET.
 * 3. Sets req.userId so downstream route handlers can scope queries to that user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication token required. Please provide a Bearer token.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    if (!decoded || !decoded.userId) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
}
