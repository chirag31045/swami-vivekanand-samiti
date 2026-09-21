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

const router = Router();

router.get("/", getActivities);
router.get("/:activityNo", getActivity);
router.post("/", imageUpload.single("image"), createActivity);
router.put("/:activityNo", imageUpload.single("image"), updateActivity);
router.delete("/:activityNo", deleteActivity);
router.post("/bulk", imageUpload.array("images", 15), bulkCreateActivities);

export default router;
