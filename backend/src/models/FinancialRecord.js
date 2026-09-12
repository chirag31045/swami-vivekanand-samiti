import mongoose from "mongoose";

const financialRecordSchema = new mongoose.Schema({
  type: { type: String, enum: ["income", "expense"], required: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  reference: { type: String, trim: true }
}, { timestamps: true });

export default mongoose.model("FinancialRecord", financialRecordSchema);
