const mongoose = require("mongoose");
const { COLLECTION_NAMES } = require("../constants");

const siteVisitorSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    firstVisitedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastVisitedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    visitCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastPath: {
      type: String,
      trim: true,
      default: "/",
    },
    lastReferrer: {
      type: String,
      trim: true,
      default: "",
    },
    lastUserAgent: {
      type: String,
      trim: true,
      default: "",
    },
    lastIp: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    collection: COLLECTION_NAMES.SITE_VISITORS,
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("SiteVisitor", siteVisitorSchema);
