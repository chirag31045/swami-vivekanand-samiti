import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Volunteer from "../models/Volunteer.js";
import Admin from "../models/adminModel.js";
import MobileOtp from "../models/mobileOtpModel.js";

const cleanPhone = (value) => {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};
const phoneQuery = (phone) => ({ phone: { $regex: `${phone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$` } });
const publicVolunteer = (v) => ({ id: v._id, name: v.name, phone: v.phone, email: v.email || "", city: v.city || "", area: v.area || "", message: v.message || "", status: v.status, photoUrl: v.photoUrl || "", applicationNo: v.applicationNo || "" });
const issueToken = (v) => jwt.sign({ sub: String(v._id), role: "volunteer", volunteerId: String(v._id) }, process.env.JWT_SECRET, { expiresIn: "30d" });

export async function registerVolunteerAccount(req, res) {
  try {
    const phone = cleanPhone(req.body?.phone);
    const name = String(req.body?.name || "").trim();
    const password = String(req.body?.password || "");
    const email = String(req.body?.email || "").trim().toLowerCase();
    const city = String(req.body?.city || "").trim();
    const area = String(req.body?.area || "").trim();
    const message = String(req.body?.message || "").trim();
    if (!phone) return res.status(400).json({ success: false, message: "Enter a valid 10-digit Indian mobile number." });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: "Enter a valid email address." });
    if (name.length < 2) return res.status(400).json({ success: false, message: "Full name must contain at least 2 characters." });
    if (password.length < 8) return res.status(400).json({ success: false, message: "Password must contain at least 8 characters." });
    if (!process.env.JWT_SECRET) return res.status(503).json({ success: false, message: "Server JWT_SECRET configure nahi hai." });

    let existing = await Volunteer.findOne(phoneQuery(phone)).select("+passwordHash");
    const emailExisting = await Volunteer.findOne({ email }).select("_id");
    if (emailExisting && (!existing || String(emailExisting._id) !== String(existing._id))) {
      return res.status(409).json({ success: false, message: "This email address is already registered. Use a different email." });
    }
    if (existing) {
      // Existing approved website volunteers can set their first app password; status remains admin-controlled.
      if (String(existing.status).toLowerCase() === "approved" && !existing.passwordHash) {
        existing.passwordHash = await bcrypt.hash(password, 12);
        existing.email = email;
        await existing.save();
        return res.status(201).json({ success: true, message: "Account setup complete. Sign in with your mobile number and password." });
      }
      return res.status(409).json({ success: false, message: "A volunteer application or account already exists for this mobile number." });
    }
    const volunteer = await Volunteer.create({
      applicationNo: `VOL-${Date.now()}`, name, phone, email, city, area, message,
      status: "pending", passwordHash: await bcrypt.hash(password, 12),
    });
    return res.status(201).json({ success: true, message: "Application submitted. You can sign in after admin approval.", item: { applicationNo: volunteer.applicationNo, status: volunteer.status } });
  } catch (error) {
    console.error("Volunteer account registration failed:", error?.message);
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const message = field === "email" ? "This email address is already registered." : field === "phone" ? "This mobile number is already registered." : "This volunteer account already exists.";
      return res.status(409).json({ success: false, message });
    }
    return res.status(500).json({ success: false, message: "Account could not be created. Check the details and try again." });
  }
}

export async function loginVolunteer(req, res) {
  try {
    const phone = cleanPhone(req.body?.phone);
    const password = String(req.body?.password || "");
    if (!phone || !password) return res.status(400).json({ success: false, message: "Enter your mobile number and password." });
    if (!process.env.JWT_SECRET) return res.status(503).json({ success: false, message: "Server JWT_SECRET configure nahi hai." });
    const volunteer = await Volunteer.findOne(phoneQuery(phone)).select("+passwordHash");
    if (!volunteer || !volunteer.passwordHash || !(await bcrypt.compare(password, volunteer.passwordHash))) {
      return res.status(401).json({ success: false, message: "Incorrect mobile number or password." });
    }
    // Approval status is enforced for volunteer accounts only. Admins authenticate on /api/admin/login.
    const status = String(volunteer.status || "pending").toLowerCase();
    if (status !== "approved") {
      const message = status === "rejected" ? "Your volunteer application was rejected. Login is not allowed." : "Your volunteer application is awaiting admin approval.";
      return res.status(403).json({ success: false, status, message });
    }
    return res.json({ success: true, token: issueToken(volunteer), role: "volunteer", user: publicVolunteer(volunteer) });
  } catch (error) {
    console.error("Volunteer login failed:", error?.message);
    return res.status(500).json({ success: false, message: "Login could not be completed. Please try again." });
  }
}


// --- OTP/password recovery support -----------------------------------------
// Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID.
// Twilio Verify sends and checks SMS codes; the backend never stores the OTP.
const normalizeOtpPhone = (value) => {
  const phone = cleanPhone(value);
  return phone;
};
const twilioConfigured = () =>
  Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID);
const twilioRequest = async (endpoint, fields) => {
  if (!twilioConfigured()) {
    const error = new Error("SMS OTP is not configured. Add Twilio Verify credentials to backend environment variables.");
    error.status = 503;
    throw error;
  }
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const url = `https://verify.twilio.com/v2/Services/${serviceSid}/${endpoint}`;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const body = new URLSearchParams(fields);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Twilio Verify request failed:", response.status, data?.code || "");
    const error = new Error("SMS verification service could not complete the request. Please retry.");
    error.status = response.status === 429 ? 429 : 502;
    throw error;
  }
  return data;
};
const phoneTailQuery = (phone) => ({ phone: { $regex: `${phone}$` } });
async function findLoginAccount(phone) {
  // Admin accounts are checked first so they receive an admin-role token.
  const admin = await Admin.findOne({
    ...phoneTailQuery(phone),
    role: "admin",
    active: true,
  });
  if (admin) return { kind: "admin", account: admin };
  const volunteer = await Volunteer.findOne(phoneTailQuery(phone));
  if (volunteer && String(volunteer.status || "").toLowerCase() === "approved") {
    return { kind: "volunteer", account: volunteer };
  }
  return null;
}
const issueAdminOtpToken = (admin) => jwt.sign(
  { id: String(admin._id), username: admin.username, role: "admin", email: admin.email || "" },
  process.env.JWT_SECRET,
  { expiresIn: process.env.ADMIN_SESSION_EXPIRES_IN || "1d" },
);
const otpFailure = (res, error) => res.status(error.status || 500).json({
  success: false,
  message: error.status === 503 ? error.message : (error.status === 429 ? error.message : "OTP request failed. Please try again."),
});

export async function sendLoginOtp(req, res) {
  try {
    const phone = normalizeOtpPhone(req.body?.phone);
    const purpose = String(req.body?.purpose || "login");

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit Indian mobile number.",
      });
    }

    if (!["login", "reset-password"].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported OTP purpose.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(503).json({
        success: false,
        message: "Server JWT_SECRET is not configured.",
      });
    }

    // Verify that an eligible account exists.
    const account = await findLoginAccount(phone);

    if (!account) {
      return res.status(404).json({
        success: false,
        message:
          "No active admin or approved volunteer account found for this mobile number.",
      });
    }

    // Prevent repeated OTP requests within 60 seconds.
    const now = Date.now();
    const existing = await MobileOtp.findOne({ phone, purpose });

    if (
      existing &&
      existing.lastSentAt &&
      now - existing.lastSentAt.getTime() < 60_000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting another OTP.",
      });
    }

    // Send OTP through Twilio Verify.
    const twilioResponse = await twilioRequest(
      "Verifications",
      {
        To: `+91${phone}`,
        Channel: "sms",
      }
    );

    // Save OTP request metadata only after Twilio accepts the request.
    await MobileOtp.findOneAndUpdate(
      { phone, purpose },
      {
        $set: {
          phone,
          purpose,
          attempts: 0,
          lastSentAt: new Date(now),
          expiresAt: new Date(now + 10 * 60_000),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("Twilio Verify request accepted:", {
      status: twilioResponse.status,
      channel: twilioResponse.channel,
      to: twilioResponse.to,
    });

    return res.status(200).json({
      success: true,
      message: "OTP request accepted by Twilio. Please check your SMS.",
    });
  } catch (error) {
    console.error("Send login OTP failed:", {
      message: error?.message,
      status: error?.status,
    });

    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 503
          ? error.message
          : error.status === 429
          ? error.message
          : "OTP could not be sent. Please check the Twilio configuration and try again.",
    });
  }
}

async function verifyTwilioOtp(phone, code) {
  const record = await MobileOtp.findOne({ phone, purpose: "login" });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    const error = new Error("OTP expired. Request a new OTP.");
    error.status = 400;
    throw error;
  }
  if (record.attempts >= 5) {
    const error = new Error("Too many incorrect OTP attempts. Request a new OTP.");
    error.status = 429;
    throw error;
  }
  record.attempts += 1;
  await record.save();
  const result = await twilioRequest("VerificationCheck", { To: `+91${phone}`, Code: code });
  if (result.status !== "approved") {
    const error = new Error("Incorrect or expired OTP.");
    error.status = 401;
    throw error;
  }
  await MobileOtp.deleteOne({ _id: record._id });
}

export async function verifyLoginOtp(req, res) {
  try {
    const phone = normalizeOtpPhone(req.body?.phone);
    const code = String(req.body?.otp || req.body?.code || "").trim();
    if (!phone || !/^\d{6}$/.test(code)) return res.status(400).json({ success: false, message: "Enter a valid mobile number and 6-digit OTP." });
    if (!process.env.JWT_SECRET) return res.status(503).json({ success: false, message: "Server JWT_SECRET is not configured." });
    await verifyTwilioOtp(phone, code);
    const found = await findLoginAccount(phone);
    if (!found) return res.status(403).json({ success: false, message: "This account is unavailable. Volunteers must be approved and admin accounts must be active." });

    if (found.kind === "admin") {
      found.account.lastLoginAt = new Date();
      await found.account.save();
      return res.json({ success: true, token: issueAdminOtpToken(found.account), role: "admin", admin: {
        id: found.account._id, username: found.account.username, displayName: found.account.displayName,
        phone: found.account.phone, email: found.account.email, role: "admin",
      } });
    }
    return res.json({ success: true, token: issueToken(found.account), role: "volunteer", user: publicVolunteer(found.account) });
  } catch (error) {
    console.error("Verify login OTP failed:", error?.message);
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "OTP login could not be completed. Please retry." });
  }
}

export async function resetPasswordWithOtp(req, res) {
  try {
    const phone = normalizeOtpPhone(req.body?.phone);
    const code = String(req.body?.otp || req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "");
    if (!phone || !/^\d{6}$/.test(code)) return res.status(400).json({ success: false, message: "Enter a valid mobile number and 6-digit OTP." });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: "New password must contain at least 8 characters." });
    const record = await MobileOtp.findOne({ phone, purpose: "reset-password" });
    if (!record || record.expiresAt.getTime() < Date.now()) return res.status(400).json({ success: false, message: "OTP expired. Request a new OTP." });
    if (record.attempts >= 5) return res.status(429).json({ success: false, message: "Too many incorrect OTP attempts. Request a new OTP." });
    record.attempts += 1;
    await record.save();
    const result = await twilioRequest("VerificationCheck", { To: `+91${phone}`, Code: code });
    if (result.status !== "approved") return res.status(401).json({ success: false, message: "Incorrect or expired OTP." });

    const found = await findLoginAccount(phone);
    if (!found) return res.status(403).json({ success: false, message: "This account is unavailable for password recovery." });
    found.account.passwordHash = await bcrypt.hash(newPassword, 12);
    await found.account.save();
    await MobileOtp.deleteOne({ _id: record._id });
    return res.json({ success: true, message: "Password reset successfully. Please sign in with your new password." });
  } catch (error) {
    console.error("Password reset failed:", error?.message);
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Password reset could not be completed. Please retry." });
  }
}

export async function changeVolunteerPassword(req, res) {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: "New password must contain at least 8 characters." });
    const volunteer = await Volunteer.findById(req.volunteer._id).select("+passwordHash");
    if (!volunteer || !volunteer.passwordHash || !(await bcrypt.compare(currentPassword, volunteer.passwordHash))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }
    volunteer.passwordHash = await bcrypt.hash(newPassword, 12);
    await volunteer.save();
    return res.json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("Volunteer password change failed:", error?.message);
    return res.status(500).json({ success: false, message: "Password could not be changed. Please retry." });
  }
}

export async function changeAdminPassword(req, res) {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: "New password must contain at least 8 characters." });
    const admin = await Admin.findById(req.admin.id).select("+passwordHash");
    if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }
    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    admin.source = "registered";
    await admin.save();
    return res.json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("Admin password change failed:", error?.message);
    return res.status(500).json({ success: false, message: "Password could not be changed. Please retry." });
  }
}
