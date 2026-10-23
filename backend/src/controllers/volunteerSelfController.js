import { storeImage } from "../middleware/imageStorage.js";
import Donation from "../models/donationModel.js";
export async function getMyProfile(req, res) { const v = req.volunteer; return res.json({ success: true, item: { id: v._id, applicationNo: v.applicationNo, name: v.name, phone: v.phone, email: v.email || "", city: v.city || "", area: v.area || "", message: v.message || "", status: v.status, photoUrl: v.photoUrl || "" } }); }
export async function updateMyProfile(req, res) {
  const v = req.volunteer;
  for (const key of ["name", "email", "city", "area", "photoUrl"]) { if (req.body?.[key] !== undefined) { const value = String(req.body[key] || "").trim(); if (key === "name" && value.length < 2) return res.status(400).json({ success: false, message: "Name must contain at least 2 characters." }); if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return res.status(400).json({ success: false, message: "Enter a valid email address." }); if (value.length > (key === "photoUrl" ? 2000 : 250)) return res.status(400).json({ success: false, message: `${key} value bahut lambi hai.` }); v[key] = value; } }
  try {
    await v.save();
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.email) return res.status(409).json({ success: false, message: "This email address is already used by another volunteer." });
    if (error?.code === 11000 && error?.keyPattern?.phone) return res.status(409).json({ success: false, message: "This mobile number is already used by another volunteer." });
    throw error;
  }
  return getMyProfile({ ...req, volunteer: v }, res);
}
export async function getMyDonations(req, res) {
  const v = req.volunteer; const digits = String(v.phone || "").replace(/\D/g, "").slice(-10);
  const items = await Donation.find({ phone: { $regex: `${digits}$` }, status: { $in: ["paid", "pending", "failed", "refunded"] } }).sort({ createdAt: -1 }).limit(100).select("receiptNo donorName amount purpose status paymentMethod razorpayPaymentId paidAt createdAt").lean();
  const paid = items.filter(x => x.status === "paid").reduce((sum, x) => sum + Number(x.amount || 0), 0);
  return res.json({ success: true, totalPaid: paid, count: items.filter(x => x.status === "paid").length, items });
}

export async function uploadMyPhoto(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Select an image file first." });
    const saved = await storeImage(req.file, "volunteer-profile");
    req.volunteer.photoUrl = saved.url;
    await req.volunteer.save();
    return res.json({ success: true, photoUrl: saved.url, message: "Profile photo updated." });
  } catch (error) {
    console.error("Volunteer photo upload failed:", error?.message);
    return res.status(500).json({ success: false, message: error?.message || "Photo upload failed." });
  }
}
