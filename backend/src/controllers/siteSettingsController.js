import SiteSettings from "../models/siteSettingsModel.js";
import {
  storeImage,
  deleteStoredImage,
} from "../middleware/imageStorage.js";

/* =========================================================
   HELPERS
========================================================= */

const parseLeaders = (value) => {
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return undefined;
    }

    return parsed.map((leader) => ({
      roleHi: String(leader?.roleHi || "").trim(),
      roleEn: String(leader?.roleEn || "").trim(),
      nameHi: String(leader?.nameHi || "").trim(),
      nameEn: String(leader?.nameEn || "").trim(),
      phone: String(leader?.phone || "").trim(),
    }));
  } catch {
    return undefined;
  }
};

/* =========================================================
   GET PUBLIC
========================================================= */

export async function getPublicSiteSettings(req, res) {
  try {
    let settings = await SiteSettings.findOne({
      key: "main",
    }).lean();

    if (!settings) {
      const newSettings = await SiteSettings.create({
        key: "main",
      });

      settings = newSettings.toObject();
    }

    return res.json({
      success: true,
      item: settings,
    });
  } catch (error) {
    console.error("Public site settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load website settings.",
    });
  }
}

/* =========================================================
   GET ADMIN
========================================================= */

export async function getAdminSiteSettings(req, res) {
  try {
    let settings = await SiteSettings.findOne({
      key: "main",
    }).lean();

    if (!settings) {
      const newSettings = await SiteSettings.create({
        key: "main",
      });

      settings = newSettings.toObject();
    }

    return res.json({
      success: true,
      item: settings,
    });
  } catch (error) {
    console.error("Admin site settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load website settings.",
    });
  }
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateSiteSettings(req, res) {
  const uploadedUrls = [];

  try {
    let settings = await SiteSettings.findOne({
      key: "main",
    });

    if (!settings) {
      settings = new SiteSettings({
        key: "main",
      });
    }

    const logoFile = req.files?.logo?.[0];
    const posterFile = req.files?.poster?.[0];

    const fields = [
      "nameHi",
      "nameEn",
      "taglineHi",
      "taglineEn",
      "registrationHi",
      "registrationEn",
      "uniqueIdHi",
      "uniqueIdEn",
      "contactIntroHi",
      "contactIntroEn",
      "addressHi",
      "addressEn",
      "phone",
      "email",
      "mapUrl",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = String(req.body[field] || "").trim();
      }
    });

    settings.social = {
      instagram: String(req.body.instagram || "").trim(),
      facebook: String(req.body.facebook || "").trim(),
      whatsapp: String(req.body.whatsapp || "").trim(),
      twitter: String(req.body.twitter || "").trim(),
    };

    const leaders = parseLeaders(req.body.leaders);

    if (leaders !== undefined) {
      settings.leaders = leaders;
    }

    const oldLogo = settings.logo;
    const oldPoster = settings.poster;

    if (logoFile) {
      const uploaded = await storeImage(logoFile, "site");
      uploadedUrls.push(uploaded.url);
      settings.logo = uploaded.url;
    }

    if (posterFile) {
      const uploaded = await storeImage(posterFile, "site");
      uploadedUrls.push(uploaded.url);
      settings.poster = uploaded.url;
    }

    await settings.save();

    if (logoFile) {
      await deleteStoredImage(oldLogo);
    }

    if (posterFile) {
      await deleteStoredImage(oldPoster);
    }

    return res.json({
      success: true,
      message: "Website settings updated successfully.",
      item: settings,
    });
  } catch (error) {
    console.error("Update site settings error:", error);

    await Promise.all(
      uploadedUrls.map((url) => deleteStoredImage(url)),
    );

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update website settings.",
    });
  }
}
