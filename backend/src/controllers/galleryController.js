import fs from "fs";
import path from "path";

const items = [];

export function listGallery(req, res) {
  res.json({ success: true, items });
}

export function uploadGallery(req, res) {
  if (!req.file) return res.status(400).json({ success: false, message: "Please select an image." });
  const item = {
    url: `/uploads/gallery/${req.file.filename}`,
    originalName: req.file.originalname,
    createdAt: new Date().toISOString()
  };
  items.unshift(item);
  res.status(201).json({ success: true, item });
}
