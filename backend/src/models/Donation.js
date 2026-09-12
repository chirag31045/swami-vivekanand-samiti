import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
  donorName: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  amount: { type: Number, required: true, min: 1 },
  purpose: { type: String, default: "General Seva" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  receiptNo: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Donation", donationSchema);
