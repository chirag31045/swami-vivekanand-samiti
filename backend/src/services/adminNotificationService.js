import AdminNotification from "../models/adminNotificationModel.js";
import { sendPushToAdmins } from "./pushNotificationService.js";

export async function createAdminNotification({ eventKey, type, title, message, entityId = "" }) {
  if (!eventKey || !type || !title || !message) return null;
  try {
    const result = await AdminNotification.updateOne(
      { eventKey }, { $setOnInsert: { eventKey, type, title, message, entityId } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    const notification = await AdminNotification.findOne({ eventKey });
    if (result.upsertedCount > 0) {
      await sendPushToAdmins({ title, body: message, data: { type, entityId, notificationId: String(notification?._id || "") } });
    }
    return notification;
  } catch (error) {
    if (error?.code === 11000) return AdminNotification.findOne({ eventKey });
    console.error("Admin notification save failed:", error);
    return null;
  }
}
