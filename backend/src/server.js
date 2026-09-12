import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";

import donationRoutes from "./routes/donationRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";

import {
  notFound,
  errorHandler,
} from "./middleware/error.js";


const app = express();


// --------------------------------------------------
// PATH
// --------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// --------------------------------------------------
// PORT
// --------------------------------------------------

const PORT = process.env.PORT || 5000;


// --------------------------------------------------
// CORS
// --------------------------------------------------

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);


// --------------------------------------------------
// HELMET
// --------------------------------------------------

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);


// --------------------------------------------------
// BODY
// --------------------------------------------------

app.use(
  express.json({
    limit: "1mb",
  })
);


// --------------------------------------------------
// RATE LIMIT
// --------------------------------------------------

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
  })
);


// --------------------------------------------------
// HEALTH
// --------------------------------------------------

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,
      service:
        "Swami Vivekanand Samiti API",
      time:
        new Date().toISOString(),
    });
  }
);


// --------------------------------------------------
// GALLERY STATIC FILES
// --------------------------------------------------

// IMPORTANT FIX
// This allows localhost:5173
// to display images from localhost:5000

app.use(
  "/uploads",
  (req, res, next) => {

    res.setHeader(
      "Cross-Origin-Resource-Policy",
      "cross-origin"
    );

    res.setHeader(
      "Access-Control-Allow-Origin",
      process.env.FRONTEND_URL ||
        "http://localhost:5173"
    );

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, OPTIONS"
    );

    next();
  },

  express.static(
    path.join(
      __dirname,
      "../uploads"
    )
  )
);


// --------------------------------------------------
// API ROUTES
// --------------------------------------------------

app.use(
  "/api/donations",
  donationRoutes
);

app.use(
  "/api/finance",
  financeRoutes
);

app.use(
  "/api/gallery",
  galleryRoutes
);

app.use(
  "/api/volunteers",
  volunteerRoutes
);


// --------------------------------------------------
// ERROR HANDLING
// --------------------------------------------------

app.use(notFound);

app.use(errorHandler);


// --------------------------------------------------
// DATABASE + SERVER
// --------------------------------------------------

connectDB()
  .finally(() => {

    app.listen(
      PORT,
      () => {
        console.log(
          `API running on http://localhost:${PORT}`
        );
      }
    );

  });