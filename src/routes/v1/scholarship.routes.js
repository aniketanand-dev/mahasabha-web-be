const express = require("express");
const multer = require("multer");
const path = require("path");
const ScholarshipController = require("../../controllers/scholarship.controller");
const asyncHandler = require("../../utils/async-handler");
const AppError = require("../../utils/app-error");
const { STATUS_CODES } = require("../../constants");
const { sanitizeBaseName, ensureStorage, getUploadFolderDir, createManagedSrc } = require("../../services/media-storage.service");
const { requireAdminAuth } = require("../../middleware/auth.middleware");
const { uploadRateLimiter } = require("../../middleware/rate-limit.middleware");

const router = express.Router();
const controller = new ScholarshipController();

const storage = multer.diskStorage({
  destination: async (_request, _file, callback) => {
    try {
      await ensureStorage("scholarships");
      callback(null, getUploadFolderDir("scholarships"));
    } catch (error) {
      callback(error);
    }
  },
  filename: (request, file, callback) => {
    const extension = path.extname(file.originalname) || "";
    const firstName = sanitizeBaseName(String(request.body.firstName || "student"));
    const lastName = sanitizeBaseName(String(request.body.lastName || ""));
    const mobile = String(request.body.mobile || "").replace(/\D/g, "").slice(0, 10) || "unknown-mobile";
    const docType = sanitizeBaseName(file.fieldname || file.originalname);
    const namePart = [firstName, lastName].filter(Boolean).join("-");

    callback(null, `${Date.now()}-${namePart}-${mobile}-${docType}${extension.toLowerCase()}`);
  }
});

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
const aadhaarMimeTypes = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
  "text/xml",
  "application/xml"
]);

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const isAadhaarField = file.fieldname === "aadhaarOfflineFile";
    const isValidType = isAadhaarField ? aadhaarMimeTypes.has(file.mimetype) : imageMimeTypes.has(file.mimetype);

    if (!isValidType) {
      callback(new AppError("Invalid file format uploaded.", STATUS_CODES.BAD_REQUEST));
      return;
    }

    callback(null, true);
  }
});

const aadhaarPreviewUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!aadhaarMimeTypes.has(file.mimetype)) {
      callback(new AppError("Invalid file format uploaded.", STATUS_CODES.BAD_REQUEST));
      return;
    }

    callback(null, true);
  }
});

const attachManagedFilePaths = (req, _res, next) => {
  const files = req.files || {};
  const allFiles = Object.values(files).flat();

  req.uploadedFiles = allFiles.map((file) => {
    file.managedSrc = createManagedSrc("scholarships", file.filename);
    return file.managedSrc;
  });

  next();
};

router.post(
  "/aadhaar/preview",
  uploadRateLimiter,
  aadhaarPreviewUpload.single("aadhaarOfflineFile"),
  asyncHandler(controller.previewAadhaarData)
);

router.get(
  "/summary",
  asyncHandler(controller.getPublicSummary)
);

router.get(
  "/registration-status",
  asyncHandler(controller.checkRegistrationAvailability)
);

router.get(
  "/academic-years",
  asyncHandler(controller.listAcademicYears)
);

router.get(
  "/applications",
  requireAdminAuth,
  asyncHandler(controller.listApplications)
);

router.get(
  "/applications/export-zip",
  requireAdminAuth,
  asyncHandler(controller.exportApplicationsZip)
);

router.post(
  "/applications",
  uploadRateLimiter,
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "casteCertificate", maxCount: 1 },
    { name: "marksCard", maxCount: 1 },
    { name: "aadhaarOfflineFile", maxCount: 1 }
  ]),
  attachManagedFilePaths,
  asyncHandler(controller.submitApplication)
);

router.patch(
  "/applications/:id/status",
  requireAdminAuth,
  asyncHandler(controller.updateApplicationStatus)
);

module.exports = router;
