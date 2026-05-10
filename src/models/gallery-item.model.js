const mongoose = require("mongoose");
const { COLLECTION_NAMES } = require("../constants");

const galleryItemSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    src: {
      type: String,
      required: true,
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
      trim: true,
    },
    caption: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    collection: COLLECTION_NAMES.GALLERY_ITEMS,
    timestamps: true,
  }
);

module.exports = mongoose.model("GalleryItem", galleryItemSchema);
