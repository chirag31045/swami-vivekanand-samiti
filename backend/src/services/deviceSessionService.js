import crypto from "crypto";
import DeviceSession from "../models/deviceSessionModel.js";

const hashToken = (token) => token ? crypto.createHash("sha256").update(token).digest("hex") : "";

export async function createDeviceSession({ req, token, decoded, role, userId, name, email, phone }) {
  if (!decoded?.jti) {
    console.warn("Device audit skipped: login JWT has no jti.");
    return null;
  }
  const body = req.body || {};
  const platformRaw = String(body.platform || "unknown").toLowerCase();
  const platform = ["android", "web", "ios"].includes(platformRaw) ? platformRaw : "unknown";
  const deviceName = String(body.deviceName || (platform === "web" ? "Web browser" : "Unknown device")).slice(0, 160);
  const userAgent = String(body.userAgent || req.get("user-agent") || "").slice(0, 500);
  try {
    return await DeviceSession.findOneAndUpdate(
    { sessionId: decoded.jti },
    { $set: {
      sessionId: decoded.jti, userId: String(userId), role,
      name: String(name || ""), email: String(email || "").toLowerCase(), phone: String(phone || ""),
      deviceName, platform, userAgent, ipAddress: String(req.ip || "").slice(0, 100),
      tokenHash: hashToken(token), loginAt: new Date(), logoutAt: null, active: true,
    } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    console.error("Device login audit could not be saved:", error.message);
    return null;
  }
}

export async function closeDeviceSession(sessionId, deviceToken = "") {
  if (!sessionId) return null;
  const update = { active: false, logoutAt: new Date() };
  if (deviceToken) update.deviceToken = deviceToken;
  return DeviceSession.findOneAndUpdate({ sessionId, active: true }, { $set: update }, { new: true });
}

export async function attachDeviceToken({ sessionId, deviceToken }) {
  if (!sessionId || !deviceToken) return;
  await DeviceSession.updateOne({ sessionId, active: true }, { $set: { deviceToken } });
}
