import AdminNotification from "../models/adminNotificationModel.js";

export async function listAdminNotifications(req, res) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const items = await AdminNotification.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ success: true, items });
  } catch (error) {
    console.error("List admin notifications error:", error);
    return res.status(500).json({ success: false, message: "Unable to load admin notifications." });
  }
}
