const mongoose = require("mongoose");
const { COLLECTION_NAMES } = require("../constants");

const hostelSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    contact: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    capacity: {
      type: String,
      default: "",
      trim: true,
    },
    img: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    collection: COLLECTION_NAMES.HOSTELS,
    timestamps: true,
  }
);

module.exports = mongoose.model("Hostel", hostelSchema);
