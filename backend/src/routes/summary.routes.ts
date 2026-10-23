import { Router } from "express";
import { getSummary } from "../controllers/summary.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Protect summary endpoint with JWT authentication
router.use(requireAuth);

// Get summary metrics (totalLent, totalRepaid, overdueAmount, and counts)
router.get("/", getSummary);

export default router;
