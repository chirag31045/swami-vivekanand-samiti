import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["gallery", "activity"],
      default: "gallery",
    },

    activityId: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Gallery", gallerySchema);