import { Router } from "express";
import multer from "multer";
import { requireAdmin } from "../middleware/auth.js";
import {
  listPublicReleases,
  listAdminReleases,
  deleteRelease,
  createApkUploadUrl,
  completeApkUpload,
} from "../controllers/appReleaseController.js";
const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.originalname.toLowerCase().endsWith(".apk")
      ? cb(null, true)
      : cb(new Error("Only .apk files are allowed.")),
});
router.get("/", listPublicReleases);
router.get("/admin", requireAdmin, listAdminReleases);
router.post(
  "/admin/upload-url",
  requireAdmin,
  createApkUploadUrl,
);

router.post(
  "/admin/complete",
  requireAdmin,
  completeApkUpload,
);
router.delete("/:id", requireAdmin, deleteRelease);
export default router;
