import Admin from "../models/adminModel.js";
import {
  storeImage,
  deleteStoredImage,
} from "../middleware/imageStorage.js";

const toProfile = (admin) => ({
  id: admin._id,
  username: admin.username,
  displayName: admin.displayName,
  role: admin.role,
  email: admin.email,
  phone: admin.phone,
  designation: admin.designation,
  department: admin.department,
  bio: admin.bio,
  profileImage: admin.profileImage,
  active: admin.active,
  lastLoginAt: admin.lastLoginAt,
});

export async function getMyAdminProfile(req, res, next) {
  try {
    const admin = await Admin.findById(req.admin.id).lean();

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found.",
      });
    }

    return res.json({
      success: true,
      profile: toProfile(admin),
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateMyAdminProfile(req, res, next) {
  let uploaded = null;

  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found.",
      });
    }

    const textFields = [
      "displayName",
      "email",
      "phone",
      "designation",
      "department",
      "bio",
    ];

    for (const field of textFields) {
      if (req.body[field] !== undefined) {
        admin[field] = String(req.body[field] || "").trim();
      }
    }

    if (!admin.displayName) admin.displayName = admin.username;
    if (!admin.designation) admin.designation = "Administrator";
    if (!admin.department) admin.department = "Administration";

    let oldImage = null;

    if (req.file) {
      uploaded = await storeImage(req.file, "admin-profile");
      oldImage = admin.profileImage;

      admin.profileImage = uploaded.url;
    }

    await admin.save();

    if (oldImage) {
      await deleteStoredImage(oldImage);
    }

    return res.json({
      success: true,
      message: "Admin profile updated successfully.",
      profile: toProfile(admin),
    });
  } catch (error) {
    if (uploaded?.url) {
      await deleteStoredImage(uploaded.url);
    }

    return next(error);
  }
}
