import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ["android", "web"], default: "android" },
    role: {
      type: String,
      enum: ["admin", "volunteer", "user"],
      default: "user",
    },
    active: { type: Boolean, default: true },
    userId: { type: String, default: "", index: true },
    sessionId: { type: String, default: "", index: true },
    name: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    deviceName: { type: String, default: "Unknown device" },
  },
  { timestamps: true },
);
export default mongoose.model("PushToken", schema);
