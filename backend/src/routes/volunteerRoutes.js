import { Router } from "express";

import {
  createVolunteer,
  updateVolunteerStatus,
  deleteVolunteer,
  getVolunteers,
  bulkCreateVolunteers,
  bulkUpdateVolunteerStatus,
} from "../controllers/volunteerController.js";

import { requireAdmin } from "../middleware/auth.js";
import { uploadExcel } from "../middleware/upload.js";

const router = Router();

router.post("/", createVolunteer);

// Update status
router.patch("/:id/status", requireAdmin, updateVolunteerStatus);

router.patch("/bulk-status", requireAdmin, bulkUpdateVolunteerStatus);

// Delete
router.delete("/:id", requireAdmin, deleteVolunteer);

// pagination
router.get("/", requireAdmin, getVolunteers);

// bulk volunteer import
router.post(
  "/bulk",
  requireAdmin,
  uploadExcel.single("file"),
  bulkCreateVolunteers,
);

export default router;
