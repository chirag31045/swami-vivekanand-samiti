import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    applicationNo: { type: String, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    city: String,
    area: String,
    message: String,
    status: { type: String, default: "new" },
  },
  { timestamps: true },
);
export default mongoose.model("Volunteer", schema);
