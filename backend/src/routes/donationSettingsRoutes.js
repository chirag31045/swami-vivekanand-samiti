import express from "express";

import { requireAdmin } from "../middleware/auth.js";
import { imageUpload } from "../middleware/imageUpload.js";

import {
  getPublicDonationSettings,
  getAdminDonationSettings,
  updateDonationSettings,
} from "../controllers/donationSettingsController.js";

const router = express.Router();

router.get("/public", getPublicDonationSettings);
router.get("/admin", requireAdmin, getAdminDonationSettings);

router.put(
  "/admin",
  requireAdmin,
  imageUpload.fields([
    {
      name: "qrImage",
      maxCount: 1,
    },
    {
      name: "photo",
      maxCount: 1,
    },
  ]),
  updateDonationSettings,
);

export default router;
