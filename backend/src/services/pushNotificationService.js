import PushToken from "../models/pushTokenModel.js";
let firebaseAdmin = null;
let firebaseInitAttempted = false;
async function getMessaging() {
  if (firebaseInitAttempted) return firebaseAdmin?.messaging?.() || null;
  firebaseInitAttempted = true;
  try {
    const credentialJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!credentialJson) {
      console.error(
        "Firebase push is not configured: FIREBASE_SERVICE_ACCOUNT_JSON is missing.",
      );
      return null;
    }
    const admin = await import("firebase-admin");
    const serviceAccount = JSON.parse(credentialJson);
    if (!admin.default.apps.length)
      admin.default.initializeApp({
        credential: admin.default.credential.cert(serviceAccount),
      });
    firebaseAdmin = admin.default;
    return firebaseAdmin.messaging();
  } catch (error) {
    console.error("Firebase push is not configured:", error.message);
    return null;
  }
}
export async function sendPushToAdmins({ title, body, data = {} }) {
  const messaging = await getMessaging();
  if (!messaging) return;
  const tokens = await PushToken.find({ active: true, role: "admin" })
    .select("token")
    .lean();
  if (!tokens.length) {
    console.warn(
      "Push not sent: no active admin device tokens are registered in MongoDB.",
    );
    return { sent: 0, failed: 0 };
  }
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    try {
      const result = await messaging.sendEachForMulticast({
        tokens: batch.map((x) => x.token),
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)]),
        ),
        android: {
          priority: "high",
          notification: { channelId: "samiti_notifications", sound: "default" },
        },
        webpush: {
          notification: {
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
          },
          fcmOptions: { link: "/admin/dashboard?section=notifications" },
        },
      });
      console.info(
        `Admin push result: ${result.successCount} succeeded, ${result.failureCount} failed.`,
      );
      const invalid = [];
      result.responses.forEach((r, idx) => {
        if (
          !r.success &&
          [
            "messaging/registration-token-not-registered",
            "messaging/invalid-registration-token",
          ].includes(r.error?.code)
        )
          invalid.push(batch[idx].token);
      });
      if (invalid.length)
        await PushToken.updateMany(
          { token: { $in: invalid } },
          { $set: { active: false } },
        );
      return { sent: result.successCount, failed: result.failureCount };
    } catch (error) {
      console.error("Push delivery failed:", error.code || "", error.message);
      return { sent: 0, failed: batch.length, error: error.message };
    }
  }
}
