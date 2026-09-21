import { Router } from "express";

import {
  listGallery,
  uploadGallery,
  updateGallery,
  deleteGallery,
} from "../controllers/galleryController.js";

import { imageUpload } from "../middleware/imageUpload.js";

const router = Router();

router.get("/", listGallery);
router.post("/upload", imageUpload.single("photo"), uploadGallery);
router.put("/:id", imageUpload.single("photo"), updateGallery);
router.delete("/:id", deleteGallery);

export default router;
