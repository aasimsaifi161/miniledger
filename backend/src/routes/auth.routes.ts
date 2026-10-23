import { Router } from "express";
import { requestOtp, verifyOtp } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { requestOtpSchema, verifyOtpSchema } from "../schemas/auth.schema";

const router = Router();

// Request 6-digit OTP for phone
router.post("/request-otp", validate(requestOtpSchema), requestOtp);

// Verify OTP, login/register user, receive JWT
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);

export default router;
