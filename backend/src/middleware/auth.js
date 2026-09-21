import crypto from "crypto";
import jwt from "jsonwebtoken";
import RevokedAdminToken from "../models/revokedAdminTokenModel.js";

export async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Admin login required.",
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin login required.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const revoked = await RevokedAdminToken.exists({ tokenHash });

    if (revoked) {
      return res.status(401).json({
        success: false,
        message: "Admin session has been logged out. Please login again.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access denied.",
      });
    }

    req.admin = decoded;
    // Backward compatibility with older controllers that read req.user.
    req.user = decoded;
    req.adminToken = token;

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Admin session expired. Please login again.",
    });
  }
}

export default requireAdmin;
