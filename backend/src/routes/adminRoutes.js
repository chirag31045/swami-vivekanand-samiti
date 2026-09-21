import { Router } from "express";

import {
  adminLogin,
  adminLogout,
  getCurrentAdmin,
} from "../controllers/adminAuthController.js";

import {
  getMyAdminProfile,
  updateMyAdminProfile,
} from "../controllers/adminProfileController.js";

import {
  listAdmins,
  registerAdmin,
} from "../controllers/adminRegistrationController.js";

import requireAdmin from "../middleware/auth.js";
import { adminProfileUpload } from "../middleware/adminProfileUpload.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| PUBLIC ADMIN AUTH
|--------------------------------------------------------------------------
*/

router.post("/login", adminLogin);

/*
|--------------------------------------------------------------------------
| PROTECTED ADMIN AUTH
|--------------------------------------------------------------------------
*/

router.post("/logout", requireAdmin, adminLogout);

router.get("/me", requireAdmin, getCurrentAdmin);

router.get("/verify", requireAdmin, (req, res) => {
  return res.json({
    success: true,
    admin: req.admin,
  });
});

/*
|--------------------------------------------------------------------------
| ADMIN PROFILE
|--------------------------------------------------------------------------
*/

router.get(
  "/profile",
  requireAdmin,
  getMyAdminProfile,
);

router.put(
  "/profile",
  requireAdmin,
  adminProfileUpload.single("profileImage"),
  updateMyAdminProfile,
);

/*
|--------------------------------------------------------------------------
| ADMIN REGISTRATION
|--------------------------------------------------------------------------
*/

router.get(
  "/registration",
  requireAdmin,
  listAdmins,
);

router.post(
  "/registration",
  requireAdmin,
  registerAdmin,
);

export default router;