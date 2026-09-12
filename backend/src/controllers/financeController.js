import FinancialRecord from "../models/FinancialRecord.js";

const demoRecords = [
  { type: "income", category: "Donations", description: "General seva donations", amount: 125000, date: "2026-08-10" },
  { type: "income", category: "Membership", description: "Annual membership", amount: 32000, date: "2026-08-15" },
  { type: "expense", category: "Education", description: "Study material distribution", amount: 28000, date: "2026-08-18" },
  { type: "expense", category: "Seva", description: "Community service activity", amount: 18500, date: "2026-08-25" }
];

export async function getFinanceSummary(req, res, next) {
  try {
    let records = demoRecords;
    if (FinancialRecord.db?.readyState === 1) {
      records = await FinancialRecord.find().sort({ date: -1 });
    }
    const income = records.filter(r => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
    const expense = records.filter(r => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);
    res.json({ success: true, summary: { income, expense, balance: income - expense }, records });
  } catch (err) {
    next(err);
  }
}
