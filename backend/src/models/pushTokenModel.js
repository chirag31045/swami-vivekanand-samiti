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
  },
  { timestamps: true },
);
export default mongoose.model("PushToken", schema);
