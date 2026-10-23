import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
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
export async function uploadRelease(req, res) {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Choose an .apk file." });
    if (!req.file.originalname.toLowerCase().endsWith(".apk"))
      return res
        .status(400)
        .json({
          success: false,
          message: "Only Android .apk files are allowed.",
        });
    const version = String(req.body.version || "").trim();
    if (!version)
      return res
        .status(400)
        .json({ success: false, message: "Version is required." });
    const fileUrl = await saveApk(req.file);
    const item = await AppRelease.create({
      title: String(req.body.title || "Swami Samiti Android App").trim(),
      version,
      notes: String(req.body.notes || "").trim(),
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      isPublished: req.body.isPublished !== "false",
    });
    return res
      .status(201)
      .json({ success: true, message: "APK published successfully.", item });
  } catch (e) {
    console.error("APK upload error:", e);
    return res
      .status(500)
      .json({ success: false, message: e.message || "APK upload failed." });
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
