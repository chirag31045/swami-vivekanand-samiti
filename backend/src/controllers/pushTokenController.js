import PushToken from "../models/pushTokenModel.js";
export async function registerPushToken(req, res) {
  try {
    const token = String(req.body?.token || "").trim();
    const platform = req.body?.platform === "web" ? "web" : "android";
    if (!token || token.length > 4096)
      return res
        .status(400)
        .json({ success: false, message: "Valid push token is required." });
    await PushToken.findOneAndUpdate(
      { token },
      { $set: { platform, role: "admin", active: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Push token registration failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Could not register push token." });
  }
}
