import mongoose from "mongoose";

// Twilio Verify owns the OTP itself; this collection stores purpose, cooldown,
// failed-attempt count and expiry metadata only.
const mobileOtpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  purpose: { type: String, enum: ["login", "register", "reset-password"], required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

mobileOtpSchema.index({ phone: 1, purpose: 1 }, { unique: true });
export default mongoose.model("MobileOtp", mobileOtpSchema);
