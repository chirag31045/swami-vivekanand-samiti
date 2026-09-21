import bcrypt from "bcryptjs";
import Admin from "../models/adminModel.js";
import { safeAdmin } from "./adminAuthController.js";

export async function listAdmins(_req, res, next) {
  try {
    const admins = await Admin.find({})
      .select("username displayName email phone designation department role active lastLoginAt createdAt profileImage")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, admins });
  } catch (error) {
    return next(error);
  }
}

export async function registerAdmin(req, res, next) {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    const confirmPassword = String(req.body?.confirmPassword || "");
    const displayName = String(req.body?.displayName || username).trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const phone = String(req.body?.phone || "").trim();
    const designation = String(req.body?.designation || "Administrator").trim();
    const department = String(req.body?.department || "Administration").trim();
    const bio = String(req.body?.bio || "").trim();

    if (!/^[a-zA-Z0-9._-]{3,50}$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Username must be 3-50 characters and use letters, numbers, dot, underscore or hyphen.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match.",
      });
    }

    const existing = await Admin.findOne({ username });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Username already exists.",
      });
    }

    const admin = await Admin.create({
      username,
      passwordHash: await bcrypt.hash(password, 12),
      displayName: displayName || username,
      email,
      phone,
      designation: designation || "Administrator",
      department: department || "Administration",
      bio,
      role: "admin",
      active: true,
      source: "registered",
    });

    return res.status(201).json({
      success: true,
      message: "Admin account registered successfully.",
      admin: safeAdmin(admin),
    });
  } catch (error) {
    return next(error);
  }
}
