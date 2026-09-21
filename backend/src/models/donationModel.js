import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    donorName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "INR",
    },

    purpose: {
      type: String,
      trim: true,
      default: "General Seva",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    paymentSource: {
      type: String,
      enum: ["razorpay", "upi_qr"],
      default: "razorpay",
      index: true,
    },

    paymentMethod: {
      type: String,
      default: "",
      trim: true,
    },

    razorpayOrderId: {
      type: String,
      default: "",
      index: true,
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
      trim: true,
      default: undefined,
    },

    razorpaySignature: {
      type: String,
      default: "",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: "",
      trim: true,
    },

    lastWebhookEvent: {
      type: String,
      default: "",
      trim: true,
    },

    lastWebhookEventId: {
      type: String,
      default: "",
      trim: true,
    },

    webhookReceivedAt: {
      type: Date,
      default: null,
    },

    receiptEmailLock: {
      type: Boolean,
      default: false,
    },

    receiptEmailSentAt: {
      type: Date,
      default: null,
    },

    receiptEmailError: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model(
  "Donation",
  donationSchema,
);
