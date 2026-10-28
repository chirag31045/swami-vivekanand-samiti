import jwt from "jsonwebtoken";
import PushToken from "../models/pushTokenModel.js";
import { attachDeviceToken } from "../services/deviceSessionService.js";

export async function registerPushToken(req, res) {
  try {
    const token = String(req.body?.token || "").trim();
    const platform = req.body?.platform === "web" ? "web" : "android";
    const role = req.admin?.role || "admin";
    const userId = String(req.admin?.id || req.admin?._id || "");
    const sessionId = String(req.admin?.jti || "");
    const name = String(
      req.body?.name ||
        req.admin?.displayName ||
        req.admin?.username ||
        "Admin",
    ).slice(0, 160);
    const email = String(req.body?.email || req.admin?.email || "")
      .trim()
      .toLowerCase();
    const phone = String(req.body?.phone || req.admin?.phone || "").trim();
    const deviceName = String(
      req.body?.deviceName ||
        (platform === "web" ? "Web browser" : "Android device"),
    ).slice(0, 160);
    if (!token || token.length > 4096)
      return res
        .status(400)
        .json({ success: false, message: "Valid push token is required." });
    const decoded = jwt.decode(
      String(req.headers.authorization || "")
        .slice(7)
        .trim(),
    );
    const finalSessionId = sessionId || String(decoded?.jti || "");
    await PushToken.findOneAndUpdate(
      { token },
      {
        $set: {
          platform,
          role: "admin",
          active: true,
          userId,
          sessionId: finalSessionId,
          name,
          email,
          phone,
          deviceName,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await attachDeviceToken({ sessionId: finalSessionId, deviceToken: token });
    return res
      .status(200)
      .json({ success: true, message: "Admin device push token registered." });
  } catch (error) {
    console.error("Push token registration failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not register push token." });
  }
}
