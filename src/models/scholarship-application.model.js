const mongoose = require("mongoose");
const { COLLECTION_NAMES } = require("../constants");

const scholarshipApplicationSchema = new mongoose.Schema(
  {
    applicationNumber: { type: String, required: true, unique: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    serialNumber: { type: Number, required: true, unique: true, min: 1 },
    registrationNo: { type: String, required: true, trim: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: "" },
    lastName: { type: String, required: true, trim: true },
    gender: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    motherName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    village: { type: String, required: true, trim: true },
    taluk: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, trim: true },
    aadhaarNumber: { type: String, required: true, trim: true, unique: true },
    aadhaarShareCode: { type: String, required: true, trim: true, uppercase: true },
    board: { type: String, required: true, trim: true },
    otherBoard: { type: String, trim: true, default: "" },
    standard: { type: String, required: true, trim: true },
    otherStandard: { type: String, trim: true, default: "" },
    marksObtained: { type: Number, required: true, min: 0 },
    totalMarks: { type: Number, required: true, min: 1 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    heardFromMember: { type: Boolean, required: true, default: false },
    referringMemberCategory: { type: String, trim: true, default: "" },
    referringMemberName: { type: String, trim: true, default: "" },
    referringMemberRegistrationNo: { type: String, trim: true, default: "" },
    profilePhotoUrl: { type: String, required: true, trim: true },
    casteCertificateUrl: { type: String, required: true, trim: true },
    marksCardUrl: { type: String, required: true, trim: true },
    aadhaarOfflineFileUrl: { type: String, required: true, trim: true },
    termsAccepted: { type: Boolean, required: true, default: false },
    declarationAccepted: { type: Boolean, required: true, default: false },
    status: { type: String, required: true, default: "submitted" },
    submittedAt: { type: Date, required: true, default: Date.now }
  },
  {
    collection: COLLECTION_NAMES.SCHOLARSHIP_APPLICATIONS,
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model("ScholarshipApplication", scholarshipApplicationSchema);
