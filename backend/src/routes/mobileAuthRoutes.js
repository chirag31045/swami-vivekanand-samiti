import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  loginVolunteer,
  registerVolunteerAccount,
  sendLoginOtp,
  verifyLoginOtp,
  resetPasswordWithOtp,
  changeVolunteerPassword,
  changeAdminPassword,
} from "../controllers/mobileAuthController.js";
import { requireAdmin, requireVolunteer } from "../middleware/auth.js";
const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Bahut zyada attempts. 15 minute baad try karein.",
  },
});
router.get("/health", (_req, res) =>
  res.json({
    success: true,
    route: "mobile-auth",
    endpoints: [
      "POST /api/mobile-auth/register",
      "POST /api/mobile-auth/login",
      "POST /api/mobile-auth/otp/send",
      "POST /api/mobile-auth/otp/verify",
      "POST /api/mobile-auth/password/forgot/reset",
      "POST /api/mobile-auth/password/change/volunteer",
      "POST /api/mobile-auth/password/change/admin",
    ],
  }),
);
router.post("/register", authLimiter, registerVolunteerAccount);
router.post("/login", authLimiter, loginVolunteer);
router.post("/otp/send", authLimiter, sendLoginOtp);
router.post("/otp/verify", authLimiter, verifyLoginOtp);
router.post("/password/forgot/reset", authLimiter, resetPasswordWithOtp);
router.post("/password/change/volunteer", requireVolunteer, changeVolunteerPassword);
router.post("/password/change/admin", requireAdmin, changeAdminPassword);
export default router;
