import jwt from "jsonwebtoken";
import crypto from "crypto";
import DeviceSession from "../models/deviceSessionModel.js";
import PushToken from "../models/pushTokenModel.js";
import RevokedAdminToken from "../models/revokedAdminTokenModel.js";
import { closeDeviceSession } from "../services/deviceSessionService.js";

export async function listDeviceSessions(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const [items, total] = await Promise.all([
      DeviceSession.find().sort({ loginAt: -1 }).skip((page - 1) * limit).limit(limit)
        .select("-tokenHash -deviceToken -__v").lean(),
      DeviceSession.countDocuments(),
    ]);
    res.json({ success: true, page, limit, total, items });
  } catch (error) {
    console.error("Device session list failed:", error.message);
    res.status(500).json({ success: false, message: "Could not load device sessions." });
  }
}

export async function logoutDeviceSession(req, res) {
  try {
    const token = String(req.headers.authorization || "").startsWith("Bearer ") ? req.headers.authorization.slice(7).trim() : "";
    if (!token) return res.status(401).json({ success: false, message: "Login token is required." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.jti || !["admin", "volunteer"].includes(decoded.role)) return res.status(401).json({ success: false, message: "Session token is invalid." });
    if (decoded.exp) {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      await RevokedAdminToken.updateOne({ tokenHash }, { $setOnInsert: { tokenHash, expiresAt: new Date(decoded.exp * 1000) } }, { upsert: true });
    }
    await closeDeviceSession(decoded.jti);
    await PushToken.updateMany({ sessionId: decoded.jti }, { $set: { active: false } });
    return res.json({ success: true, message: "Logged out and device session recorded." });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Session invalid or expired." });
  }
}
