import mongoose from "mongoose";
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, default: "Swami Samiti Android App" },
  version: { type: String, required: true, trim: true },
  notes: { type: String, default: "", trim: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });
schema.index({ createdAt: -1 });
export default mongoose.model("AppRelease", schema);
