const mongoose = require("mongoose");
const { COLLECTION_NAMES } = require("../constants");

const academicYearSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, unique: true },
    startYear: { type: Number, required: true, unique: true, min: 2000 },
  },
  {
    collection: COLLECTION_NAMES.ACADEMIC_YEARS,
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("AcademicYear", academicYearSchema);