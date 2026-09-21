import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    activityNo: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      max: 15,
    },

    hi: {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      shortText: {
        type: String,
        required: true,
        trim: true,
      },

      details: {
        type: String,
        required: true,
        trim: true,
      },
    },

    en: {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      shortText: {
        type: String,
        required: true,
        trim: true,
      },

      details: {
        type: String,
        required: true,
        trim: true,
      },
    },

    image: {
      type: String,
      required: true,
      trim: true,
    },

    imageName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model(
  "Activity",
  activitySchema,
);