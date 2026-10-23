import AdminNotification from "../models/adminNotificationModel.js";

// Idempotent event keys prevent duplicate alerts from verify + Razorpay webhook.
export async function createAdminNotification({ eventKey, type, title, message, entityId = "" }) {
  if (!eventKey || !type || !title || !message) return null;
  try {
    return await AdminNotification.findOneAndUpdate(
      { eventKey },
      { $setOnInsert: { eventKey, type, title, message, entityId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    // Duplicate-key can occur if webhook and verify race on the same payment.
    if (error?.code === 11000) return AdminNotification.findOne({ eventKey });
    console.error("Admin notification save failed:", error);
    return null;
  }
}
