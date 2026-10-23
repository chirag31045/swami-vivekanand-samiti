import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    applicationNo: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: undefined },
    city: { type: String, default: "" },
    area: { type: String, default: "" },
    message: { type: String, default: "" },
    status: { type: String, default: "pending", lowercase: true, index: true },
    passwordHash: {type: String,required: true, select: false},
    photoUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

// Unique constraints are also checked explicitly in the registration controller.
schema.index({ phone: 1 }, { unique: true });
schema.index({ email: 1 }, { unique: true });

export default mongoose.model("Volunteer", schema);
