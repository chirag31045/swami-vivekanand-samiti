import { Router } from "express";

import {
  listGallery,
  uploadGallery,
  updateGallery,
  deleteGallery,
} from "../controllers/galleryController.js";

import { imageUpload } from "../middleware/imageUpload.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", listGallery);
router.post("/upload", requireAdmin, imageUpload.single("photo"), uploadGallery);
router.put("/:id", requireAdmin, imageUpload.single("photo"), updateGallery);
router.delete("/:id", requireAdmin, deleteGallery);

export default router;
