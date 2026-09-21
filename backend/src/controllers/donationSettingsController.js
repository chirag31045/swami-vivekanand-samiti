import DonationSettings from "../models/donationSettingsModel.js";
import {
  storeImage,
  deleteStoredImage,
} from "../middleware/imageStorage.js";

export async function getPublicDonationSettings(_req, res) {
  try {
    let settings = await DonationSettings.findOne({
      key: "main",
    }).lean();

    if (!settings) {
      settings = (
        await DonationSettings.create({
          key: "main",
        })
      ).toObject();
    }

    return res.json({
      success: true,
      item: settings,
    });
  } catch (error) {
    console.error("Public donation settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load donation settings.",
    });
  }
}

export async function getAdminDonationSettings(_req, res) {
  try {
    let settings = await DonationSettings.findOne({
      key: "main",
    }).lean();

    if (!settings) {
      settings = (
        await DonationSettings.create({
          key: "main",
        })
      ).toObject();
    }

    return res.json({
      success: true,
      item: settings,
    });
  } catch (error) {
    console.error("Admin donation settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load donation settings.",
    });
  }
}

export async function updateDonationSettings(req, res) {
  let uploaded = null;

  try {
    let settings = await DonationSettings.findOne({
      key: "main",
    });

    if (!settings) {
      settings = new DonationSettings({
        key: "main",
      });
    }

    const booleanFields = [
      "enabled",
      "razorpayEnabled",
      "qrEnabled",
    ];

    booleanFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] =
          req.body[field] === true ||
          String(req.body[field]).toLowerCase() === "true";
      }
    });

    const textFields = [
      "bankName",
      "accountName",
      "accountNumber",
      "ifscCode",
      "upiId",
      "noteHi",
      "noteEn",
      "receiptPrefix",
    ];

    textFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = String(req.body[field] || "").trim();
      }
    });

    if (req.body.minimumAmount !== undefined) {
      settings.minimumAmount = Math.max(
        1,
        Number(req.body.minimumAmount) || 1,
      );
    }

    if (req.body.maximumAmount !== undefined) {
      settings.maximumAmount = Math.max(
        settings.minimumAmount,
        Number(req.body.maximumAmount) || 500000,
      );
    }

    const qrFile =
      req.files?.qrImage?.[0] ||
      req.files?.photo?.[0] ||
      req.file;

    if (qrFile) {
      uploaded = await storeImage(qrFile, "donations");

      const oldQr = settings.qrImage;

      settings.qrImage = uploaded.url;

      await settings.save();

      await deleteStoredImage(oldQr);
    } else {
      await settings.save();
    }

    return res.json({
      success: true,
      message: "Donation settings updated successfully.",
      item: settings,
    });
  } catch (error) {
    console.error("Update donation settings error:", error);

    if (uploaded?.url) {
      await deleteStoredImage(uploaded.url);
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update donation settings.",
    });
  }
}
