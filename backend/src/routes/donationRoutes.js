import express from "express";
import { requireAdmin } from "../middleware/auth.js";

import {
  createDonationOrder,
  verifyDonationPayment,
  getAdminDonations,
  getDonationReceipt,
  resendDonationReceipt,
} from "../controllers/donationController.js";

const router = express.Router();

/* Public */
router.post("/create-order", createDonationOrder);

router.post("/verify", verifyDonationPayment);

router.get("/receipt/:receiptNo", getDonationReceipt);

/* Admin */
router.get("/admin", requireAdmin, getAdminDonations);

router.post("/admin/:id/resend-receipt", requireAdmin, resendDonationReceipt);

export default router;
