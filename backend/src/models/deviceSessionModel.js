import mongoose from "mongoose";

const deviceSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ["admin", "volunteer"], required: true, index: true },
  name: { type: String, default: "" },
  email: { type: String, default: "", lowercase: true, trim: true },
  phone: { type: String, default: "", trim: true },
  deviceName: { type: String, default: "Unknown device" },
  platform: { type: String, enum: ["android", "web", "ios", "unknown"], default: "unknown" },
  deviceToken: { type: String, default: "" },
  tokenHash: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  ipAddress: { type: String, default: "" },
  loginAt: { type: Date, default: Date.now, index: true },
  logoutAt: { type: Date, default: null },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

deviceSessionSchema.index({ userId: 1, role: 1, loginAt: -1 });
export default mongoose.model("DeviceSession", deviceSessionSchema);
