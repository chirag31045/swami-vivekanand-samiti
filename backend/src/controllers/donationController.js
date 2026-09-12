import Donation from "../models/Donation.js";

let demoDonations = [];

export async function createDonation(req, res, next) {
  try {
    const { donorName, email, phone, amount, purpose } = req.body;
    if (!donorName || !amount || Number(amount) < 1) {
      return res.status(400).json({ success: false, message: "Name and valid amount are required." });
    }

    const donation = {
      donorName,
      email,
      phone,
      amount: Number(amount),
      purpose: purpose || "General Seva",
      paymentStatus: "pending",
      receiptNo: `SVS-${Date.now()}`
    };

    if (Donation.db?.readyState === 1) {
      const saved = await Donation.create(donation);
      return res.status(201).json({ success: true, donation: saved });
    }

    demoDonations.push({ ...donation, createdAt: new Date() });
    return res.status(201).json({ success: true, donation });
  } catch (err) {
    next(err);
  }
}

export async function listDonations(req, res, next) {
  try {
    if (Donation.db?.readyState === 1) {
      const items = await Donation.find().sort({ createdAt: -1 }).limit(100);
      return res.json({ success: true, items });
    }
    res.json({ success: true, items: demoDonations });
  } catch (err) {
    next(err);
  }
}
