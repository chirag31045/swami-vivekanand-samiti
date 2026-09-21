import Gallery from "../models/galleryModel.js";
import {
  storeImage,
  deleteStoredImage,
} from "../middleware/imageStorage.js";

// --------------------------------------------------
// GET ALL GALLERY IMAGES
// --------------------------------------------------

export async function listGallery(req, res) {
  try {
    const items = await Gallery.find({
      type: "gallery",
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("List gallery error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load gallery.",
    });
  }
}

// --------------------------------------------------
// UPLOAD GALLERY IMAGE
// --------------------------------------------------

export async function uploadGallery(req, res) {
  let uploaded = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image.",
      });
    }

    uploaded = await storeImage(req.file, "gallery");

    const item = await Gallery.create({
      url: uploaded.url,
      originalName: req.file.originalname,
      type: "gallery",
    });

    return res.status(201).json({
      success: true,
      message: "Gallery image uploaded successfully.",
      item,
    });
  } catch (error) {
    console.error("Upload gallery error:", error);

    if (uploaded?.url) {
      await deleteStoredImage(uploaded.url);
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload gallery image.",
    });
  }
}

// --------------------------------------------------
// UPDATE GALLERY IMAGE
// --------------------------------------------------

export async function updateGallery(req, res) {
  let uploaded = null;

  try {
    const { id } = req.params;

    const item = await Gallery.findOne({
      _id: id,
      type: "gallery",
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found.",
      });
    }

    if (req.file) {
      uploaded = await storeImage(req.file, "gallery");

      const oldUrl = item.url;

      item.url = uploaded.url;
      item.originalName = req.file.originalname;

      await item.save();

      await deleteStoredImage(oldUrl);
    } else {
      await item.save();
    }

    return res.json({
      success: true,
      message: "Gallery image updated successfully.",
      item,
    });
  } catch (error) {
    console.error("Update gallery error:", error);

    if (uploaded?.url) {
      await deleteStoredImage(uploaded.url);
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update gallery image.",
    });
  }
}

// --------------------------------------------------
// DELETE GALLERY IMAGE
// --------------------------------------------------

export async function deleteGallery(req, res) {
  try {
    const { id } = req.params;

    const item = await Gallery.findOne({
      _id: id,
      type: "gallery",
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found.",
      });
    }

    await Gallery.deleteOne({
      _id: id,
    });

    await deleteStoredImage(item.url);

    return res.json({
      success: true,
      message: "Gallery image deleted successfully.",
    });
  } catch (error) {
    console.error("Delete gallery error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete gallery image.",
    });
  }
};
