import express from "express";
import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../controllers/adminNotificationController.js";
import requireAdmin from "../middleware/auth.js";

const router = express.Router();

// Mounted at /api/admin/notifications in src/app.js
router.get("/", requireAdmin, getAdminNotifications);
router.patch("/read-all", requireAdmin, markAllAdminNotificationsRead);
router.patch("/:id/read", requireAdmin, markAdminNotificationRead);

export default router;
