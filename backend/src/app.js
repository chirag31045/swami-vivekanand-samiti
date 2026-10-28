import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";

import adminRoutes from "./routes/adminRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import siteSettingsRoutes from "./routes/siteSettingsRoutes.js";
import donationWebhookRoutes from "./routes/donationWebhookRoutes.js";
import donationSettingsRoutes from "./routes/donationSettingsRoutes.js";
import mobileAuthRoutes from "./routes/mobileAuthRoutes.js";
import appReleaseRoutes from "./routes/appReleaseRoutes.js";
import { registerPushToken } from "./controllers/pushTokenController.js";
import { listDeviceSessions, logoutDeviceSession } from "./controllers/deviceSessionController.js";
import { requireAdmin } from "./middleware/auth.js";
import { requireVolunteer } from "./middleware/auth.js";
import { getMyProfile, updateMyProfile, getMyDonations, uploadMyPhoto, } from "./controllers/volunteerSelfController.js";
import { imageUpload } from "./middleware/imageUpload.js";
import adminNotificationRoutes from "./routes/adminNotificationRoutes.js"


import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

app.set("trust proxy", 1);

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
});

app.use(limiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configuredOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server, curl, Postman, or requests without origin
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/+$/, "");

    // Matches any localhost port (e.g., http://localhost:5173, http://localhost:3000)
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin);
    const isAllowedConfig = configuredOrigins.includes(cleanOrigin);

    if (isLocalhost || isAllowedConfig) {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Origin not permitted: ${origin}`);
    return callback(new Error(`CORS origin is not allowed: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use("/api/donations/webhook", donationWebhookRoutes);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

app.get("/api/health", async (_req, res) => {
  const connected = await connectDB();

  return res.json({
    success: true,
    service: "Swami Vivekanand Samiti API",
    database: connected ? "connected" : "not-configured",
    time: new Date().toISOString(),
  });
});

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    next();
  },
  express.static(path.join(__dirname, "../uploads")),
);

app.use(async (req, res, next) => {
  if (!process.env.MONGODB_URI) {
    return next();
  }

  const connected = await connectDB();

  if (!connected) {
    return res.status(503).json({
      success: false,
      message: "Database connection is unavailable.",
    });
  }

  return next();
});

app.use("/api/donations", donationRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/site-settings", siteSettingsRoutes);
app.use("/api/donation-settings", donationSettingsRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/mobile-auth", mobileAuthRoutes);
app.use("/api/app-releases", appReleaseRoutes);
app.post("/api/push-tokens", requireAdmin, registerPushToken);
app.get("/api/device-sessions", requireAdmin, listDeviceSessions);
app.post("/api/device-sessions/logout", logoutDeviceSession);
app.get("/api/volunteer/me", requireVolunteer, getMyProfile);
app.patch("/api/volunteer/me", requireVolunteer, updateMyProfile);
app.get("/api/donations/my", requireVolunteer, getMyDonations);
app.post(
  "/api/volunteer/me/photo",
  requireVolunteer,
  imageUpload.single("image"),
  uploadMyPhoto
);

app.use("/api/admin/notifications", adminNotificationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
