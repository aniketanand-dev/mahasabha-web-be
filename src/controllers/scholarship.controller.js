const mongoose = require("mongoose");
const path = require("path");
const archiver = require("archiver");
const AcademicYear = require("../models/academic-year.model");
const ScholarshipApplication = require("../models/scholarship-application.model");
const Counter = require("../models/counter.model");
const SECTION_CONTENT_MODELS = require("../models/section-content.models");
const { MESSAGES, STATUS_CODES } = require("../constants");
const { sendSuccess } = require("../utils/api-response");
const AppError = require("../utils/app-error");
const { removeManagedFile, resolveManagedPath, sanitizeBaseName } = require("../services/media-storage.service");

const BOARD_OPTIONS = new Set(["state", "ICSE", "CBSE", "Other"]);
const STANDARD_OPTIONS = new Set(["10th", "12th"]);
const GENDER_OPTIONS = new Set(["Male", "Female", "Other"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_IMAGE_UPLOAD_BYTES = 1024 * 1024;
const IMAGE_UPLOAD_REQUIREMENTS_MESSAGE = "Upload an image file up to 1 MB.";
const MEMBER_CATEGORY_OPTIONS = new Set([
  "Life Member",
  "Ashrayadataru",
  "Upaposhakaru",
  "Sahaposhakaru",
  "Institutional Member",
  "Poshakaru",
  "Mahaposhakaru",
  "Danigalu",
  "Mahadanigalu",
  "Danashiromanigalu",
  "Dasohigalu",
  "Mahadasohigalu",
  "Paramadasohigalu"
]);
const SCHOLARSHIP_COUNTER_ID = "scholarshipApplications";
const SCHOLARSHIP_SETTINGS_MODEL = SECTION_CONTENT_MODELS.adm_scholarship_settings;
const SCHOLARSHIP_SETTINGS_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DEFAULT_SCHOLARSHIP_SETTINGS = Object.freeze({
  applicationDeadline: "",
  closedTitle: "Scholarship Applications Closed",
  closedMessage: "The scholarship application period has ended. Please check back for the next cycle.",
});

const asTrimmedString = (value) => String(value || "").trim();
const parseNumber = (value) => Number.parseFloat(String(value || "").trim());
const parseBoolean = (value) => value === true || String(value).toLowerCase() === "true";
const isValidMarksInput = (value) => /^\d{1,4}$/.test(String(value || "").trim());

const createAcademicYearLabel = (startYear) => `AY-${startYear}-${startYear + 1}`;

const getDefaultAcademicYearLabel = (referenceDate = new Date()) => {
  const startYear = referenceDate.getMonth() < 5
    ? referenceDate.getFullYear() - 1
    : referenceDate.getFullYear();

  return createAcademicYearLabel(startYear);
};

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

const parseDateOnly = (value, { endExclusive = false } = {}) => {
  const normalized = asTrimmedString(value);

  if (!normalized) {
    return null;
  }

  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const date = endExclusive
    ? new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0))
    : new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  if (Number.isNaN(date.getTime())) {
    throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
  }

  return date;
};

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ACADEMIC_YEAR_PATTERN = /^AY-\d{4}-\d{4}$/;
const SCHOLARSHIP_STATUSES = new Set(["pending", "accepted", "rejected"]);

const parseAcademicYearStart = (academicYear) => Number.parseInt(String(academicYear || "").slice(3, 7), 10);

const formatAcademicYear = (academicYear) => ({
  _id: String(academicYear._id),
  label: academicYear.label,
  startYear: academicYear.startYear,
});

const ensureDefaultAcademicYear = async () => {
  const label = getDefaultAcademicYearLabel();
  const startYear = parseAcademicYearStart(label);

  let academicYear = await AcademicYear.findOne({ startYear }).lean();
  if (academicYear) {
    return academicYear;
  }

  academicYear = await AcademicYear.create({ label, startYear });
  return academicYear.toObject();
};

const listAcademicYearDocuments = async () => {
  const ensured = await ensureDefaultAcademicYear();
  return [ensured];
};

const resolveAcademicYear = async (academicYearId, { allowDefault = false } = {}) => {
  const normalizedId = asTrimmedString(academicYearId);

  if (!normalizedId) {
    if (allowDefault) {
      return ensureDefaultAcademicYear();
    }

    throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
  }

  if (!mongoose.isValidObjectId(normalizedId)) {
    throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
  }

  const academicYear = await AcademicYear.findById(normalizedId).lean();
  if (!academicYear) {
    throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
  }

  return academicYear;
};

const buildAcademicYearFilter = (academicYear) => ({
  $or: [
    { academicYearId: academicYear._id },
    { academicYearId: null, academicYear: academicYear.label },
  ],
});

const mergeFilters = (...filters) => {
  const normalizedFilters = filters.filter((filter) => filter && Object.keys(filter).length > 0);

  if (normalizedFilters.length === 0) {
    return {};
  }

  if (normalizedFilters.length === 1) {
    return normalizedFilters[0];
  }

  return { $and: normalizedFilters };
};

const validateScholarshipImageSize = (file) => {
  const fileSize = Number(file?.size || 0);

  if (!Number.isFinite(fileSize) || fileSize > MAX_IMAGE_UPLOAD_BYTES) {
    throw new AppError(IMAGE_UPLOAD_REQUIREMENTS_MESSAGE, STATUS_CODES.BAD_REQUEST);
  }
};

const fileEntriesForApplication = (application) => {
  return [
    { label: "profile-photo", src: application.profilePhotoUrl },
    { label: "caste-certificate", src: application.casteCertificateUrl },
    { label: "marks-card", src: application.marksCardUrl },
    { label: "aadhaar-card", src: application.aadhaarCardUrl },
    { label: "aadhaar-offline", src: application.aadhaarOfflineFileUrl }
  ].filter((entry) => !!entry.src);
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

const normalizeScholarshipSettings = (value) => {
  const next = value && typeof value === "object" ? value : {};
  const applicationDeadline = SCHOLARSHIP_SETTINGS_DATETIME_PATTERN.test(String(next.applicationDeadline || "").trim())
    ? String(next.applicationDeadline).trim()
    : "";

  return {
    applicationDeadline,
    closedTitle: asTrimmedString(next.closedTitle) || DEFAULT_SCHOLARSHIP_SETTINGS.closedTitle,
    closedMessage: asTrimmedString(next.closedMessage) || DEFAULT_SCHOLARSHIP_SETTINGS.closedMessage,
  };
};

const readScholarshipSettings = async () => {
  const row = await SCHOLARSHIP_SETTINGS_MODEL.findOne({}).lean();
  return normalizeScholarshipSettings(row?.value);
};

const buildScholarshipPortalState = (settings, referenceDate = new Date()) => {
  const normalized = normalizeScholarshipSettings(settings);
  const deadlineCutoff = normalized.applicationDeadline
    ? new Date(normalized.applicationDeadline)
    : null;

  return {
    ...normalized,
    isOpen: !deadlineCutoff || Number.isNaN(deadlineCutoff.getTime()) || referenceDate < deadlineCutoff,
  };
};

class ScholarshipController {
  getPortalSettings = async (_req, res) => {
    const settings = await readScholarshipSettings();

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, buildScholarshipPortalState(settings));
  };

  getPublicSummary = async (_req, res) => {
    const totalApplications = await ScholarshipApplication.countDocuments({});

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
      totalApplications
    });
  };

  checkRegistrationAvailability = async (req, res) => {
    const academicYear = await resolveAcademicYear(req.query.academicYearId);
    const registrationNo = asTrimmedString(req.query.registrationNo);

    if (!registrationNo) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    const existingApplication = await ScholarshipApplication.findOne(
      mergeFilters(buildAcademicYearFilter(academicYear), { registrationNo })
    ).select("_id").lean();

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
      academicYearId: String(academicYear._id),
      academicYear: academicYear.label,
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
    const academicYearId = asTrimmedString(req.query.academicYearId);
    const status = asTrimmedString(req.query.status).toLowerCase();
    const search = asTrimmedString(req.query.search);
    const state = asTrimmedString(req.query.state);
    const district = asTrimmedString(req.query.district);
    const taluk = asTrimmedString(req.query.taluk);
    const submittedFrom = parseDateOnly(req.query.submittedFrom);
    const submittedTo = parseDateOnly(req.query.submittedTo, { endExclusive: true });

    const filters = [];
    if (academicYearId) {
      const academicYear = await resolveAcademicYear(academicYearId);
      filters.push(buildAcademicYearFilter(academicYear));
    }

    if (status) {
      if (!SCHOLARSHIP_STATUSES.has(status)) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_STATUS, STATUS_CODES.BAD_REQUEST);
      }

      filters.push({ status });
    }

    if (search) {
      const searchPattern = new RegExp(escapeRegex(search), "i");
      filters.push({
        $or: [
        { applicationNumber: searchPattern },
        { registrationNo: searchPattern },
        { aadhaarNumber: searchPattern },
        { firstName: searchPattern },
        { middleName: searchPattern },
        { lastName: searchPattern },
        { mobile: searchPattern },
        { emailId: searchPattern },
        { fatherName: searchPattern },
        { motherName: searchPattern },
        ],
      });
    }

    if (state) {
      filters.push({ state: new RegExp(`^${escapeRegex(state)}$`, "i") });
    }

    if (district) {
      filters.push({ district: new RegExp(`^${escapeRegex(district)}$`, "i") });
    }

    if (taluk) {
      filters.push({ taluk: new RegExp(`^${escapeRegex(taluk)}$`, "i") });
    }

    if (submittedFrom || submittedTo) {
      const submittedAtFilter = {};

      if (submittedFrom) {
        submittedAtFilter.$gte = submittedFrom;
      }

      if (submittedTo) {
        submittedAtFilter.$lt = submittedTo;
      }

      filters.push({ submittedAt: submittedAtFilter });
    }

    const filter = mergeFilters(...filters);

    const baseQuery = ScholarshipApplication.find(filter).sort({ submittedAt: -1, _id: -1 });

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

    const totalItems = await ScholarshipApplication.countDocuments(filter);
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

  listAcademicYears = async (_req, res) => {
    const years = await listAcademicYearDocuments();

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
      items: years.map(formatAcademicYear),
    });
  };

  exportApplicationsZip = async (req, res) => {
    const academicYearId = asTrimmedString(req.query.academicYearId);
    const filters = [];
    if (academicYearId) {
      const academicYear = await resolveAcademicYear(academicYearId);
      filters.push(buildAcademicYearFilter(academicYear));
    }

    const filter = mergeFilters(...filters);

    const items = await ScholarshipApplication.find(filter).sort({ submittedAt: -1, _id: -1 }).lean();

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

  updateApplicationStatus = async (req, res) => {
    const applicationId = asTrimmedString(req.params.id);
    const status = asTrimmedString(req.body.status).toLowerCase();
    const rejectionComment = asTrimmedString(req.body.rejectionComment);

    if (!applicationId || !SCHOLARSHIP_STATUSES.has(status)) {
      throw new AppError(MESSAGES.SCHOLARSHIPS.INVALID_STATUS, STATUS_CODES.BAD_REQUEST);
    }

    if (status === "rejected" && !rejectionComment) {
      throw new AppError(MESSAGES.SCHOLARSHIPS.REJECTION_COMMENT_REQUIRED, STATUS_CODES.BAD_REQUEST);
    }

    const updated = await ScholarshipApplication.findByIdAndUpdate(
      applicationId,
      {
        status,
        rejectionComment: status === "rejected" ? rejectionComment : "",
        reviewedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!updated) {
      throw new AppError(MESSAGES.COMMON.NOT_FOUND, STATUS_CODES.NOT_FOUND);
    }

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.SCHOLARSHIPS.STATUS_UPDATED, updated);
  };

  submitApplication = async (req, res) => {
    const uploadedFiles = req.uploadedFiles || [];

    try {
      const portalSettings = buildScholarshipPortalState(await readScholarshipSettings());

      if (!portalSettings.isOpen) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.APPLICATIONS_CLOSED, STATUS_CODES.FORBIDDEN);
      }

      const firstName = asTrimmedString(req.body.firstName);
      const middleName = asTrimmedString(req.body.middleName);
      const lastName = asTrimmedString(req.body.lastName);
      const registrationNo = asTrimmedString(req.body.registrationNo);
      const gender = asTrimmedString(req.body.gender);
      const fatherName = asTrimmedString(req.body.fatherName);
      const motherName = asTrimmedString(req.body.motherName);
      const mobile = asTrimmedString(req.body.mobile);
      const emailId = asTrimmedString(req.body.emailId).toLowerCase();
      const village = asTrimmedString(req.body.village);
      const taluk = asTrimmedString(req.body.taluk);
      const district = asTrimmedString(req.body.district);
      const state = asTrimmedString(req.body.state);
      const pinCode = asTrimmedString(req.body.pinCode);
      const aadhaarNumber = asTrimmedString(req.body.aadhaarNumber);
      const board = asTrimmedString(req.body.board);
      const otherBoard = asTrimmedString(req.body.otherBoard);
      const standard = asTrimmedString(req.body.standard);
      const academicYear = await resolveAcademicYear(req.body.academicYearId, { allowDefault: true });
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
      const aadhaarCard = files.aadhaarCard?.[0];

      if (!registrationNo || !firstName || !lastName || !gender || !fatherName || !motherName || !mobile || !emailId || !aadhaarNumber) {
        throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
      }

      if (!village || !taluk || !district || !state || !pinCode) {
        throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
      }

      if (!GENDER_OPTIONS.has(gender)) {
        throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
      }

      if (!/^\d{10}$/.test(mobile) || !/^\d{12}$/.test(aadhaarNumber)) {
        throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
      }

      if (!EMAIL_PATTERN.test(emailId)) {
        throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
      }

      const existingRegistrationApplication = await ScholarshipApplication.findOne(
        mergeFilters(buildAcademicYearFilter(academicYear), { registrationNo })
      ).lean();
      if (existingRegistrationApplication) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.REGISTRATION_NO_ALREADY_EXISTS, STATUS_CODES.CONFLICT);
      }

      const existingAadhaarApplication = await ScholarshipApplication.findOne(
        mergeFilters(buildAcademicYearFilter(academicYear), { aadhaarNumber })
      ).lean();
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

      if (!profilePhoto || !casteCertificate || !marksCard || !aadhaarCard) {
        throw new AppError(MESSAGES.SCHOLARSHIPS.REQUIRED_FILES, STATUS_CODES.BAD_REQUEST);
      }

      [profilePhoto, casteCertificate, marksCard, aadhaarCard].forEach(validateScholarshipImageSize);

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
        academicYearId: academicYear._id,
        academicYear: academicYear.label,
        serialNumber,
        registrationNo,
        firstName,
        middleName,
        lastName,
        gender,
        fatherName,
        motherName,
        mobile,
        emailId,
        village,
        taluk,
        district,
        state,
        pinCode,
        aadhaarNumber,
        aadhaarShareCode: "",
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
        aadhaarCardUrl: aadhaarCard.managedSrc,
        aadhaarOfflineFileUrl: "",
        termsAccepted,
        declarationAccepted,
        status: "pending",
        rejectionComment: "",
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
