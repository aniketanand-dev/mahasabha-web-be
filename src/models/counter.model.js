const mongoose = require("mongoose");
const { COLLECTION_NAMES } = require("../constants");

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true, trim: true },
    value: { type: Number, required: true, default: 0, min: 0 }
  },
  {
    collection: COLLECTION_NAMES.COUNTERS,
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model("Counter", counterSchema);