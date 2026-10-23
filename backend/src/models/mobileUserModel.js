import mongoose from "mongoose";

const mobileUserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  phone: { type: String, required: true, unique: true, index: true },
  role: { type: String, enum: ["user"], default: "user" },
  active: { type: Boolean, default: true },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model("MobileUser", mobileUserSchema);
