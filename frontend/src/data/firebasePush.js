import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export async function registerAdminWebPush(apiBase, adminToken) {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey || !config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) return;
  try {
    if (!(await isSupported()) || !("serviceWorker" in navigator)) return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
    const app = initializeApp(config, "samiti-admin-push");
    const swConfig = new URLSearchParams(config).toString();
    const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swConfig}`);
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return;
    await fetch(`${apiBase}/push-tokens`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ token, platform: "web", role: "admin" }),
    });
  } catch (error) {
    console.warn("Web push registration skipped:", error?.message || error);
  }
}
