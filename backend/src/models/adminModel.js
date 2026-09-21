import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    displayName: {
      type: String,
      trim: true,
      default: "Admin",
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
    designation: {
      type: String,
      trim: true,
      default: "Administrator",
    },
    department: {
      type: String,
      trim: true,
      default: "Administration",
    },
    bio: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    profileImage: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["env", "registered"],
      default: "registered",
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Admin", adminSchema);
