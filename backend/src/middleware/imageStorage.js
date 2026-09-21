import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const getCloudinaryConfig = () => ({
  cloudName: String(process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
  apiKey: String(process.env.CLOUDINARY_API_KEY || "").trim(),
  apiSecret: String(process.env.CLOUDINARY_API_SECRET || "").trim(),
});

export const isCloudinaryConfigured = () => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  return Boolean(cloudName && apiKey && apiSecret);
};

const signCloudinaryParams = (params, apiSecret) => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${query}${apiSecret}`)
    .digest("hex");
};

const cloudinaryUpload = async (file, folder) => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;

  const params = {
    folder: `samiti/${folder}`,
    public_id: publicId,
    timestamp,
  };

  const signature = signCloudinaryParams(params, apiSecret);

  const body = new FormData();
  body.append(
    "file",
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
  );
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", params.folder);
  body.append("public_id", publicId);
  body.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    {
      method: "POST",
      body,
    },
  );

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    throw new Error(
      data?.error?.message || "Cloudinary image upload failed.",
    );
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
};

const extractCloudinaryPublicId = (url) => {
  try {
    const parsed = new URL(url);
    const marker = "/upload/";
    const index = parsed.pathname.indexOf(marker);

    if (index === -1) return null;

    let value = parsed.pathname.slice(index + marker.length);

    const parts = value.split("/").filter(Boolean);
    const versionIndex = parts.findIndex((part) => /^v\d+$/.test(part));

    if (versionIndex >= 0) {
      value = parts.slice(versionIndex + 1).join("/");
    } else {
      value = parts.join("/");
    }

    return value.replace(/\.[^/.]+$/, "") || null;
  } catch {
    return null;
  }
};

const cloudinaryDelete = async (url) => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const publicId = extractCloudinaryPublicId(url);

  if (!publicId) return;

  const timestamp = Math.floor(Date.now() / 1000);

  const params = {
    public_id: publicId,
    timestamp,
  };

  const signature = signCloudinaryParams(params, apiSecret);

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const data = await response.json();

  if (!response.ok || !["ok", "not found"].includes(data?.result)) {
    throw new Error(
      data?.error?.message || "Cloudinary image delete failed.",
    );
  }
};

const saveLocalImage = async (file, folder) => {
  const uploadDir = path.join(process.cwd(), "uploads", folder);

  await fs.mkdir(uploadDir, { recursive: true });

  const ext =
    path.extname(file.originalname || "").toLowerCase() || ".jpg";

  const filename = `${Date.now()}-${crypto
    .randomBytes(8)
    .toString("hex")}${ext}`;

  const filePath = path.join(uploadDir, filename);

  await fs.writeFile(filePath, file.buffer);

  return {
    url: `/uploads/${folder}/${filename}`,
    filename,
    path: filePath,
    publicId: null,
  };
};

export const storeImage = async (file, folder) => {
  if (!file) {
    throw new Error("Image file is required.");
  }

  if (isCloudinaryConfigured()) {
    const result = await cloudinaryUpload(file, folder);

    return {
      url: result.url,
      filename: result.publicId,
      path: null,
      publicId: result.publicId,
    };
  }

  if (process.env.VERCEL === "1") {
    throw new Error(
      "Cloudinary is required for image uploads on Vercel. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    );
  }

  return saveLocalImage(file, folder);
};

export const deleteStoredImage = async (url) => {
  if (!url) return;

  if (url.startsWith("https://res.cloudinary.com/")) {
    if (!isCloudinaryConfigured()) return;

    try {
      await cloudinaryDelete(url);
    } catch (error) {
      console.error("Cloudinary image delete error:", error);
    }

    return;
  }

  if (!url.startsWith("/uploads/")) return;

  if (process.env.VERCEL === "1") return;

  const filePath = path.join(process.cwd(), url.replace(/^\/+/, ""));

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.error("Local image delete error:", error);
    }
  }
};

export const deleteUploadedFile = deleteStoredImage;
