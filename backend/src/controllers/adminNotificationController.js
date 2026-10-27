import AdminNotification from "../models/adminNotificationModel.js";

export async function getAdminNotifications(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const filter = {};

    const [notifications, total, unreadCount] = await Promise.all([
      AdminNotification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AdminNotification.countDocuments(filter),
      AdminNotification.countDocuments({ ...filter, readAt: null }),
    ]);

    return res.status(200).json({
      success: true,
      data: notifications.map((item) => ({
        ...item,
        read: Boolean(item.readAt),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Fetch admin notifications failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
}

export async function markAdminNotificationRead(req, res) {
  try {
    const item = await AdminNotification.findByIdAndUpdate(
      req.params.id,
      { $set: { readAt: new Date() } },
      { new: true, runValidators: true },
    );
    if (!item) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    return res.status(200).json({ success: true, item });
  } catch (error) {
    console.error("Mark notification read failed:", error);
    return res.status(500).json({ success: false, message: "Unable to update notification." });
  }
}

export async function markAllAdminNotificationsRead(_req, res) {
  try {
    await AdminNotification.updateMany({ readAt: null }, { $set: { readAt: new Date() } });
    return res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    console.error("Mark all notifications read failed:", error);
    return res.status(500).json({ success: false, message: "Unable to update notifications." });
  }
}
