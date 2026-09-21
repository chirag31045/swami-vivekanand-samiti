import { Router } from "express";

import {
  getPublicSiteSettings,
  getAdminSiteSettings,
  updateSiteSettings,
} from "../controllers/siteSettingsController.js";

import { requireAdmin } from "../middleware/auth.js";
import { imageUpload } from "../middleware/imageUpload.js";

const router = Router();

router.get("/public", getPublicSiteSettings);

router.get("/admin", requireAdmin, getAdminSiteSettings);

router.put(
  "/admin",
  requireAdmin,
  imageUpload.fields([
    {
      name: "logo",
      maxCount: 1,
    },
    {
      name: "poster",
      maxCount: 1,
    },
  ]),
  updateSiteSettings,
);

export default router;
