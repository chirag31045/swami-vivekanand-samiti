import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import AppRelease from "../models/AppRelease.js";

const cloudConfigured = () =>
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;
function signParams(params, secret) {
  const text = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return crypto.createHash("sha1").update(`${text}${secret}`).digest("hex");
}
async function saveApk(file) {
  if (cloudConfigured()) {
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `samiti-apk-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const params = { public_id: publicId, timestamp, folder: "samiti/apk" };
    const signature = signParams(params, process.env.CLOUDINARY_API_SECRET);
    const body = new FormData();
    body.append(
      "file",
      new Blob([file.buffer], {
        type: "application/vnd.android.package-archive",
      }),
      file.originalname,
    );
    body.append("api_key", process.env.CLOUDINARY_API_KEY);
    body.append("timestamp", String(timestamp));
    body.append("folder", params.folder);
    body.append("public_id", publicId);
    body.append("signature", signature);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(process.env.CLOUDINARY_CLOUD_NAME)}/raw/upload`,
      { method: "POST", body },
    );
    const data = await response.json();
    console.log("Cloudinary status:", response.status);
console.log("Cloudinary error:", data?.error?.message);
    if (!response.ok || !data.secure_url)
      throw new Error(
        data?.error?.message ||
          "APK cloud upload failed. Configure Cloudinary RAW upload.",
      );
    return data.secure_url;
  }
  if (process.env.VERCEL === "1")
    throw new Error(
      "APK upload on Vercel needs Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) or another persistent file store.",
    );
  const dir = path.join(process.cwd(), "uploads", "apk");
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${Date.now()}-${crypto.randomBytes(5).toString("hex")}.apk`;
  await fs.writeFile(path.join(dir, fileName), file.buffer);
  return `/uploads/apk/${fileName}`;
}
export async function listPublicReleases(_req, res) {
  try {
    const items = await AppRelease.find({ isPublished: true })
      .select("title version notes fileUrl fileName fileSize createdAt")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, items });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load app releases." });
  }
}
export async function listAdminReleases(_req, res) {
  try {
    const items = await AppRelease.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, items });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load releases." });
  }
}
export async function deleteRelease(req, res) {
  try {
    const item = await AppRelease.findByIdAndDelete(req.params.id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Release not found." });
    return res.json({ success: true, message: "Release deleted." });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete release." });
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

const BUCKET = process.env.SUPABASE_BUCKET || "apk-releases";
const MAX_APK_SIZE = 49 * 1024 * 1024;

export async function createApkUploadUrl(req, res) {
  try {
    const { fileName, fileSize } = req.body;

    if (
      typeof fileName !== "string" ||
      !fileName.toLowerCase().endsWith(".apk")
    ) {
      return res.status(400).json({
        success: false,
        message: "Only APK files are allowed.",
      });
    }

    if (
      !Number.isFinite(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_APK_SIZE
    ) {
      return res.status(400).json({
        success: false,
        message: "APK size must be less than 49 MB.",
      });
    }

    const safeName = fileName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-100);

    const uploadPath = `releases/${randomUUID()}-${safeName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(uploadPath);

    if (error) throw error;

    return res.json({
      success: true,
      uploadPath,
      token: data.token,
    });
  } catch (error) {
    console.error("Create APK upload URL error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not prepare APK upload.",
    });
  }
}


export async function completeApkUpload(req, res) {
  try {
    const { version, notes = "", uploadPath } = req.body;

    if (
      typeof version !== "string" ||
      !version.trim() ||
      typeof uploadPath !== "string" ||
      !uploadPath.startsWith("releases/") ||
      !uploadPath.toLowerCase().endsWith(".apk")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid release details.",
      });
    }

    const fileName = uploadPath.split("/").pop();

    // Verify that the uploaded APK exists in Supabase Storage
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET)
      .list("releases", {
        search: fileName,
        limit: 100,
      });

    if (listError) throw listError;

    const uploadedFile = files?.find(
      (file) => file.name === fileName
    );

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "APK upload was not found in Storage.",
      });
    }

    // Get the public download URL
    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(uploadPath);

    if (!publicData?.publicUrl) {
      throw new Error("Could not generate APK public URL.");
    }

    // Save using the exact fields defined in AppRelease schema
    const release = await AppRelease.create({
      title: "Swami Samiti Android App",
      version: version.trim(),
      notes: String(notes).slice(0, 5000),
      fileUrl: publicData.publicUrl,
      fileName,
      fileSize: uploadedFile.metadata?.size ?? 0,
      isPublished: true,
    });

    return res.status(201).json({
      success: true,
      message: "APK release published successfully.",
      release,
    });
  } catch (error) {
    console.error("Complete APK upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not publish APK release.",
    });
  }
}
