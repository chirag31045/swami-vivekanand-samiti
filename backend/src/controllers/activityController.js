import Activity from "../models/activityModel.js";
import {
  storeImage,
  deleteStoredImage,
} from "../middleware/imageStorage.js";

/* =====================================================
   GET ALL ACTIVITIES
===================================================== */

export async function getActivities(req, res) {
  try {
    const activities = await Activity.find()
      .sort({ activityNo: 1 })
      .lean();

    return res.json({
      success: true,
      items: activities,
    });
  } catch (error) {
    console.error("Get activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load activities.",
    });
  }
}

/* =====================================================
   GET SINGLE ACTIVITY
===================================================== */

export async function getActivity(req, res) {
  try {
    const activityNo = Number(req.params.activityNo);

    if (
      !Number.isInteger(activityNo) ||
      activityNo < 1 ||
      activityNo > 15
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity number.",
      });
    }

    const activity = await Activity.findOne({
      activityNo,
    }).lean();

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found.",
      });
    }

    return res.json({
      success: true,
      item: activity,
    });
  } catch (error) {
    console.error("Get activity error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load activity.",
    });
  }
}

/* =====================================================
   ADD ACTIVITY
===================================================== */

export async function createActivity(req, res) {
  let uploaded = null;

  try {
    const {
      activityNo,
      hiTitle,
      hiShortText,
      hiDetails,
      enTitle,
      enShortText,
      enDetails,
    } = req.body;

    const no = Number(activityNo);

    if (!Number.isInteger(no) || no < 1 || no > 15) {
      return res.status(400).json({
        success: false,
        message: "Activity number must be between 1 and 15.",
      });
    }

    if (!hiTitle?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Hindi title is required.",
      });
    }

    if (!enTitle?.trim()) {
      return res.status(400).json({
        success: false,
        message: "English title is required.",
      });
    }

    if (!hiShortText?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Hindi short content is required.",
      });
    }

    if (!enShortText?.trim()) {
      return res.status(400).json({
        success: false,
        message: "English short content is required.",
      });
    }

    if (!hiDetails?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Hindi details are required.",
      });
    }

    if (!enDetails?.trim()) {
      return res.status(400).json({
        success: false,
        message: "English details are required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Activity image is required.",
      });
    }

    const exists = await Activity.findOne({
      activityNo: no,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: `Activity ${no} already exists.`,
      });
    }

    uploaded = await storeImage(req.file, "activities");

    const activity = await Activity.create({
      activityNo: no,

      hi: {
        title: hiTitle.trim(),
        shortText: hiShortText.trim(),
        details: hiDetails.trim(),
      },

      en: {
        title: enTitle.trim(),
        shortText: enShortText.trim(),
        details: enDetails.trim(),
      },

      image: uploaded.url,
      imageName: req.file.originalname,
    });

    return res.status(201).json({
      success: true,
      message: "Activity added successfully.",
      item: activity,
    });
  } catch (error) {
    console.error("Create activity error:", error);

    if (uploaded?.url) {
      await deleteStoredImage(uploaded.url);
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add activity.",
    });
  }
}

/* =====================================================
   UPDATE ACTIVITY
===================================================== */

export async function updateActivity(req, res) {
  let uploaded = null;

  try {
    const activityNo = Number(req.params.activityNo);

    const activity = await Activity.findOne({
      activityNo,
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found.",
      });
    }

    const {
      hiTitle,
      hiShortText,
      hiDetails,
      enTitle,
      enShortText,
      enDetails,
    } = req.body;

    if (hiTitle !== undefined) {
      activity.hi.title = hiTitle.trim();
    }

    if (hiShortText !== undefined) {
      activity.hi.shortText = hiShortText.trim();
    }

    if (hiDetails !== undefined) {
      activity.hi.details = hiDetails.trim();
    }

    if (enTitle !== undefined) {
      activity.en.title = enTitle.trim();
    }

    if (enShortText !== undefined) {
      activity.en.shortText = enShortText.trim();
    }

    if (enDetails !== undefined) {
      activity.en.details = enDetails.trim();
    }

    let oldUrl = null;

    if (req.file) {
      uploaded = await storeImage(req.file, "activities");

      oldUrl = activity.image;
      activity.image = uploaded.url;
      activity.imageName = req.file.originalname;
    }

    await activity.save();

    if (oldUrl) {
      await deleteStoredImage(oldUrl);
    }

    return res.json({
      success: true,
      message: "Activity updated successfully.",
      item: activity,
    });
  } catch (error) {
    console.error("Update activity error:", error);

    if (uploaded?.url) {
      await deleteStoredImage(uploaded.url);
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update activity.",
    });
  }
}

/* =====================================================
   DELETE ACTIVITY
===================================================== */

export async function deleteActivity(req, res) {
  try {
    const activityNo = Number(req.params.activityNo);

    const activity = await Activity.findOneAndDelete({
      activityNo,
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found.",
      });
    }

    await deleteStoredImage(activity.image);

    return res.json({
      success: true,
      message: "Activity deleted successfully.",
    });
  } catch (error) {
    console.error("Delete activity error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete activity.",
    });
  }
}

/* =====================================================
   BULK CREATE ACTIVITIES
   Maximum 15 Activities
===================================================== */

export async function bulkCreateActivities(req, res) {
  const uploadedUrls = [];

  try {
    let activities;

    try {
      activities =
        typeof req.body.activities === "string"
          ? JSON.parse(req.body.activities)
          : req.body.activities;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid activities JSON data.",
      });
    }

    if (!Array.isArray(activities)) {
      return res.status(400).json({
        success: false,
        message: "Activities must be an array.",
      });
    }

    if (activities.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide activities.",
      });
    }

    if (activities.length > 15) {
      return res.status(400).json({
        success: false,
        message: "Maximum 15 activities are allowed.",
      });
    }

    const activityNumbers = activities.map((item) =>
      Number(item.activityNo),
    );

    const invalidNumbers = activityNumbers.some(
      (no) => !Number.isInteger(no) || no < 1 || no > 15,
    );

    if (invalidNumbers) {
      return res.status(400).json({
        success: false,
        message: "Activity number must be between 1 and 15.",
      });
    }

    const duplicateNumbers = activityNumbers.filter(
      (no, index) => activityNumbers.indexOf(no) !== index,
    );

    if (duplicateNumbers.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate activity numbers found.",
      });
    }

    const existing = await Activity.find({
      activityNo: {
        $in: activityNumbers,
      },
    }).select("activityNo");

    if (existing.length > 0) {
      const existingNumbers = existing.map(
        (item) => item.activityNo,
      );

      return res.status(409).json({
        success: false,
        message: `Activities already exist: ${existingNumbers.join(", ")}`,
      });
    }

    const uploadedFiles = req.files || [];

    if (uploadedFiles.length !== activities.length) {
      return res.status(400).json({
        success: false,
        message: `Please upload exactly ${activities.length} images.`,
      });
    }

    const documents = [];

    for (let index = 0; index < activities.length; index += 1) {
      const item = activities[index];
      const file = uploadedFiles[index];

      const uploaded = await storeImage(file, "activities");
      uploadedUrls.push(uploaded.url);

      documents.push({
        activityNo: Number(item.activityNo),

        hi: {
          title: item.hiTitle?.trim() || "",
          shortText: item.hiShortText?.trim() || "",
          details: item.hiDetails?.trim() || "",
        },

        en: {
          title: item.enTitle?.trim() || "",
          shortText: item.enShortText?.trim() || "",
          details: item.enDetails?.trim() || "",
        },

        image: uploaded.url,
        imageName: file.originalname,
      });
    }

    for (const item of documents) {
      if (!item.hi.title) {
        throw new Error(
          `Hindi title is required for Activity ${item.activityNo}.`,
        );
      }

      if (!item.en.title) {
        throw new Error(
          `English title is required for Activity ${item.activityNo}.`,
        );
      }

      if (!item.hi.shortText) {
        throw new Error(
          `Hindi short content is required for Activity ${item.activityNo}.`,
        );
      }

      if (!item.en.shortText) {
        throw new Error(
          `English short content is required for Activity ${item.activityNo}.`,
        );
      }

      if (!item.hi.details) {
        throw new Error(
          `Hindi details are required for Activity ${item.activityNo}.`,
        );
      }

      if (!item.en.details) {
        throw new Error(
          `English details are required for Activity ${item.activityNo}.`,
        );
      }
    }

    const created = await Activity.insertMany(documents);

    return res.status(201).json({
      success: true,
      message: `${created.length} activities added successfully.`,
      items: created,
    });
  } catch (error) {
    console.error("Bulk create activities error:", error);

    await Promise.all(
      uploadedUrls.map((url) => deleteStoredImage(url)),
    );

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add activities.",
    });
  }
}
