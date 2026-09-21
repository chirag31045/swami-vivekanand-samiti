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

import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin is not allowed."));
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

app.use(notFound);
app.use(errorHandler);

export default app;
