import mongoose from "mongoose";

const schema = new mongoose.Schema({
  eventKey: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ["volunteer", "payment"], required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  entityId: { type: String, default: "" },
  readAt: { type: Date, default: null },
}, { timestamps: true });

schema.index({ createdAt: -1 });
export default mongoose.model("AdminNotification", schema);
