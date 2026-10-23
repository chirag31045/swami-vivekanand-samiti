import { Router } from "express";

import {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  bulkCreateActivities,
} from "../controllers/activityController.js";

import { imageUpload } from "../middleware/imageUpload.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getActivities);
router.get("/:activityNo", getActivity);
router.post("/", requireAdmin, imageUpload.single("image"), createActivity);
router.put("/:activityNo", requireAdmin, imageUpload.single("image"), updateActivity);
router.delete("/:activityNo", requireAdmin, deleteActivity);
router.post("/bulk", requireAdmin, imageUpload.array("images", 15), bulkCreateActivities);

export default router;
