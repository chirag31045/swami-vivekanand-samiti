import mongoose from "mongoose";

const donationSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: "main",
      index: true,
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    razorpayEnabled: {
      type: Boolean,
      default: true,
    },

    minimumAmount: {
      type: Number,
      min: 1,
      default: 1,
    },

    maximumAmount: {
      type: Number,
      min: 1,
      default: 500000,
    },

    qrImage: {
      type: String,
      trim: true,
      default: "",
    },

    receiptPrefix: {
      type: String,
      trim: true,
      uppercase: true,
      default: "SVV",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model(
  "DonationSettings",
  donationSettingsSchema,
);
