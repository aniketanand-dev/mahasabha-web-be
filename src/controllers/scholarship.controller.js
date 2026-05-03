const path = require("path");
const archiver = require("archiver");
const ScholarshipApplication = require("../models/scholarship-application.model");
const Counter = require("../models/counter.model");
const { MESSAGES, STATUS_CODES } = require("../constants");
const { sendSuccess } = require("../utils/api-response");
const AppError = require("../utils/app-error");
const { removeManagedFile, resolveManagedPath, sanitizeBaseName } = require("../services/media-storage.service");
const { readAadhaarOfflineData } = require("../services/aadhaar-offline.service");

const BOARD_OPTIONS = new Set(["state", "ICSE", "CBSE", "Other"]);
const STANDARD_OPTIONS = new Set(["10th", "12th"]);
const GENDER_OPTIONS = new Set(["Male", "Female", "Other"]);
const MEMBER_CATEGORY_OPTIONS = new Set([
  "Life Member",
  "Ashrayadataru",
  "Upaposhakaru",
  "Sahaposhakaru",
  "District Committee Member",
  "Mahadanigalu",
  "Danashiromanigalu",
  "Dasohigalu",
  "Mahadasohigalu",
  "Paramadasohigalu",
  "Institutional Member"
]);
const SCHOLARSHIP_COUNTER_ID = "scholarshipApplications";

const asTrimmedString = (value) => String(value || "").trim();
const parseNumber = (value) => Number.parseFloat(String(value || "").trim());
const parseBoolean = (value) => value === true || String(value).toLowerCase() === "true";
const isValidMarksInput = (value) => /^\d{1,4}$/.test(String(value || "").trim());

const buildApplicationNumber = () => {
  const stamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PP-2025-2026-${stamp}${random}`;
};

const getNextSerialNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: SCHOLARSHIP_COUNTER_ID },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return counter.value;
};

const cleanupFiles = async (filePaths = []) => {
  await Promise.all(filePaths.filter(Boolean).map((filePath) => removeManagedFile(filePath)));
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const fileEntriesForApplication = (application) => {
  return [
    { label: "profile-photo", src: application.profilePhotoUrl },
    { label: "caste-certificate", src: application.casteCertificateUrl },
    { label: "marks-card", src: application.marksCardUrl },
    { label: "aadhaar-offline", src: application.aadhaarOfflineFileUrl }
  ];
};

const buildArchiveBaseName = (application) => {
  const fullName = sanitizeBaseName([
    application.firstName,
    application.middleName,
    application.lastName
  ].filter(Boolean).join(" "));
  const aadhaarNumber = String(application.aadhaarNumber || "unknown-aadhaar").replace(/\D/g, "") || "unknown-aadhaar";

  return `${fullName}-${aadhaarNumber}`;
};

class ScholarshipController {
  getPublicSummary = async (_req, res) => {
    const totalApplications = await ScholarshipApplication.countDocuments({});

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
      totalApplications
    });
  };

  checkRegistrationAvailability = async (req, res) => {
    const registrationNo = asTrimmedString(req.query.registrationNo);

    if (!registrationNo) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    const existingApplication = await ScholarshipApplication.findOne({ registrationNo }).select("_id").lean();

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
      registrationNo,
      available: !existingApplication,
      message: existingApplication
        ? MESSAGES.SCHOLARSHIPS.REGISTRATION_NO_ALREADY_EXISTS
        : "Registration number is available"
    });
  };

  listApplications = async (req, res) => {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 100);
    const fetchAll = String(req.query.all || "").toLowerCase() === "true";

    const baseQuery = ScholarshipApplication.find({}).sort({ submittedAt: -1, _id: -1 });

    if (fetchAll) {
      const items = await baseQuery.lean();
      return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
        items,
        pagination: {
          page: 1,
          limit: items.length,
          totalItems: items.length,
          totalPages: items.length ? 1 : 0,
        },
      });
    }

    const totalItems = await ScholarshipApplication.countDocuments({});
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;

    const items = await baseQuery
      .skip((safePage - 1) * limit)
      .limit(limit)
      .lean();

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
      items,
      pagination: {
        page: safePage,
        limit,
        totalItems,
        totalPages,
      },
    });
  };

  exportApplicationsZip = async (_req, res) => {
    const items = await ScholarshipApplication.find({}).sort({ submittedAt: -1, _id: -1 }).lean();

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="scholarship-uploads-${new Date().toISOString().slice(0, 10)}.zip"`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (error) => {
      if (!res.headersSent) {
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).end();
        return;
      }

      res.destroy(error);
    });

    archive.pipe(res);

    for (const application of items) {
      const baseName = buildArchiveBaseName(application);
      const folderName = `${baseName}-${sanitizeBaseName(application.applicationNumber || application._id)}`;

      for (const entry of fileEntriesForApplication(application)) {
        const absolutePath = resolveManagedPath(entry.src);
        if (!absolutePath) {
          continue;
        }

        const extension = path.extname(absolutePath) || "";
        const archiveEntryName = `${folderName}/${baseName}-${entry.label}${extension.toLowerCase()}`;
        archive.file(absolutePath, { name: archiveEntryName });
      }
    }

    await archive.finalize();
  };

  previewAadhaarData = async (req, res) => {
    if (!req.file) {
      throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_AADHAAR_FILE_FORMAT, STATUS_CODES.BAD_REQUEST);
    }

    const aadhaarShareCode = asTrimmedString(req.body.aadhaarShareCode);
    const parsedData = await readAadhaarOfflineData({
      fileBuffer: req.file.buffer,
      originalName: req.file.originalname,
      shareCode: aadhaarShareCode
    });

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, parsedData);
  };

  submitApplication = async (req, res) => {
    const uploadedFiles = req.uploadedFiles || [];

    try {
      const firstName = asTrimmedString(req.body.firstName);
      const middleName = asTrimmedString(req.body.middleName);
      const lastName = asTrimmedString(req.body.lastName);
      const registrationNo = asTrimmedString(req.body.registrationNo);
      const gender = asTrimmedString(req.body.gender);
      const fatherName = asTrimmedString(req.body.fatherName);
      const motherName = asTrimmedString(req.body.motherName);
      const mobile = asTrimmedString(req.body.mobile);
      const village = asTrimmedString(req.body.village);
      const taluk = asTrimmedString(req.body.taluk);
      const district = asTrimmedString(req.body.district);
      const state = asTrimmedString(req.body.state);
      const pinCode = asTrimmedString(req.body.pinCode);
      const aadhaarNumber = asTrimmedString(req.body.aadhaarNumber);
      const aadhaarShareCode = asTrimmedString(req.body.aadhaarShareCode);
      const board = asTrimmedString(req.body.board);
      const otherBoard = asTrimmedString(req.body.otherBoard);
      const standard = asTrimmedString(req.body.standard);
      const academicYear = asTrimmedString(req.body.academicYear) || "AY-2025-2026";
      const marksObtained = parseNumber(req.body.marksObtained);
      const totalMarks = parseNumber(req.body.totalMarks);
      const percentage = parseNumber(req.body.percentage);
      const heardFromMember = parseBoolean(req.body.heardFromMember);
      const referringMemberCategory = asTrimmedString(req.body.referringMemberCategory);
      const referringMemberName = asTrimmedString(req.body.referringMemberName);
      const referringMemberRegistrationNo = asTrimmedString(req.body.referringMemberRegistrationNo);
      const termsAccepted = parseBoolean(req.body.termsAccepted);
      const declarationAccepted = parseBoolean(req.body.declarationAccepted);

      const files = req.files || {};
      const profilePhoto = files.profilePhoto?.[0];
      const casteCertificate = files.casteCertificate?.[0];
      const marksCard = files.marksCard?.[0];
      const aadhaarOfflineFile = files.aadhaarOfflineFile?.[0];

      if (!registrationNo || !firstName || !lastName || !gender || !fatherName || !motherName || !mobile || !aadhaarNumber) {
        throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
      }

      if (!village || !taluk || !district || !state || !pinCode) {
        throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
      }

      if (state !== "Karnataka") {
        throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_STATE, STATUS_CODES.BAD_REQUEST);
      }

      if (!GENDER_OPTIONS.has(gender)) {
        throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
      }

      if (!/^\d{10}$/.test(mobile) || !/^\d{12}$/.test(aadhaarNumber)) {
        throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
      }

      const existingRegistrationApplication = await ScholarshipApplication.findOne({ registrationNo }).lean();
      if (existingRegistrationApplication) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.REGISTRATION_NO_ALREADY_EXISTS, STATUS_CODES.CONFLICT);
      }

      const existingAadhaarApplication = await ScholarshipApplication.findOne({ aadhaarNumber }).lean();
      if (existingAadhaarApplication) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.AADHAAR_ALREADY_EXISTS, STATUS_CODES.CONFLICT);
      }

      if (!/^\d{6}$/.test(pinCode)) {
        throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
      }

      if (!BOARD_OPTIONS.has(board) || (board === "Other" && !otherBoard)) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_BOARD, STATUS_CODES.BAD_REQUEST);
      }

      if (!STANDARD_OPTIONS.has(standard)) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_STANDARD, STATUS_CODES.BAD_REQUEST);
      }

      if (!aadhaarShareCode || !/^\S{4,32}$/.test(aadhaarShareCode)) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_AADHAAR_SHARE_CODE, STATUS_CODES.BAD_REQUEST);
      }

      if (!isValidMarksInput(req.body.marksObtained) || !isValidMarksInput(req.body.totalMarks)) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_MARKS_FORMAT, STATUS_CODES.BAD_REQUEST);
      }

      if (!Number.isFinite(marksObtained) || !Number.isFinite(totalMarks) || totalMarks <= 0 || marksObtained < 0) {
        throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
      }

      if (!Number.isInteger(marksObtained) || !Number.isInteger(totalMarks) || marksObtained > 9999 || totalMarks > 9999) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_MARKS_FORMAT, STATUS_CODES.BAD_REQUEST);
      }

      if (marksObtained > totalMarks) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_MARKS, STATUS_CODES.BAD_REQUEST);
      }

      if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
        throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
      }

      if (!profilePhoto || !casteCertificate || !marksCard || !aadhaarOfflineFile) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.REQUIRED_FILES, STATUS_CODES.BAD_REQUEST);
      }

      if (heardFromMember) {
        if (!MEMBER_CATEGORY_OPTIONS.has(referringMemberCategory)) {
          throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_REFERRING_MEMBER_CATEGORY, STATUS_CODES.BAD_REQUEST);
        }

        if (!referringMemberName || !referringMemberRegistrationNo) {
          throw new AppError(MESSAGES.SCHOLARSHIPS.REFERRING_MEMBER_DETAILS_REQUIRED, STATUS_CODES.BAD_REQUEST);
        }
      }

      if (!termsAccepted || !declarationAccepted) {
        throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
      }

      const serialNumber = await getNextSerialNumber();

      const created = await ScholarshipApplication.create({
        applicationNumber: buildApplicationNumber(),
        academicYear,
        serialNumber,
        registrationNo,
        firstName,
        middleName,
        lastName,
        gender,
        fatherName,
        motherName,
        mobile,
        village,
        taluk,
        district,
        state,
        pinCode,
        aadhaarNumber,
        aadhaarShareCode,
        board,
        otherBoard,
        standard,
        otherStandard: "",
        marksObtained,
        totalMarks,
        percentage,
        heardFromMember,
        referringMemberCategory: heardFromMember ? referringMemberCategory : "",
        referringMemberName: heardFromMember ? referringMemberName : "",
        referringMemberRegistrationNo: heardFromMember ? referringMemberRegistrationNo : "",
        profilePhotoUrl: profilePhoto.managedSrc,
        casteCertificateUrl: casteCertificate.managedSrc,
        marksCardUrl: marksCard.managedSrc,
        aadhaarOfflineFileUrl: aadhaarOfflineFile.managedSrc,
        termsAccepted,
        declarationAccepted,
        submittedAt: new Date()
      });

      return sendSuccess(res, STATUS_CODES.CREATED, MESSAGES.SCHOLARSHIPS.APPLICATION_SUBMITTED, {
        id: created.id,
        applicationNumber: created.applicationNumber,
        serialNumber: created.serialNumber,
        totalApplications: created.serialNumber,
        submittedAt: created.submittedAt,
        status: created.status
      });
    } catch (error) {
      await cleanupFiles(uploadedFiles);

      if (error && error.code === 11000 && error.keyPattern && error.keyPattern.aadhaarNumber) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.AADHAAR_ALREADY_EXISTS, STATUS_CODES.CONFLICT);
      }

      if (error && error.code === 11000 && error.keyPattern && error.keyPattern.registrationNo) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.REGISTRATION_NO_ALREADY_EXISTS, STATUS_CODES.CONFLICT);
      }

      throw error;
    }
  };
}

module.exports = ScholarshipController;
