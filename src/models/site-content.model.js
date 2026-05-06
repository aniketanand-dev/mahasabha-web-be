const mongoose = require("mongoose");
const { COLLECTION_NAMES } = require("../constants");

const siteContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  {
    collection: COLLECTION_NAMES.SITE_CONTENT,
    timestamps: true,
  }
);

module.exports = mongoose.model("SiteContent", siteContentSchema);
