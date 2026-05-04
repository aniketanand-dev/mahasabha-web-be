const mongoose = require("mongoose");
const { connectDatabase } = require("../src/config/database");
const AcademicYear = require("../src/models/academic-year.model");
const ScholarshipApplication = require("../src/models/scholarship-application.model");

const ACADEMIC_YEAR_PATTERN = /^AY-(\d{4})-(\d{4})$/;

const createAcademicYearLabel = (startYear) => `AY-${startYear}-${startYear + 1}`;

const deriveAcademicYearLabelFromDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  const startYear = date.getMonth() < 5
    ? date.getFullYear() - 1
    : date.getFullYear();

  return createAcademicYearLabel(startYear);
};

const normalizeAcademicYearLabel = (application) => {
  const existingLabel = String(application.academicYear || "").trim();
  if (ACADEMIC_YEAR_PATTERN.test(existingLabel)) {
    return existingLabel;
  }

  return deriveAcademicYearLabelFromDate(application.submittedAt || application.createdAt);
};

const parseStartYear = (label) => {
  const match = String(label || "").match(ACADEMIC_YEAR_PATTERN);
  if (!match) {
    return Number.NaN;
  }

  return Number.parseInt(match[1], 10);
};

const ensureAcademicYear = async (label, cache) => {
  if (cache.has(label)) {
    return cache.get(label);
  }

  const startYear = parseStartYear(label);
  if (!Number.isInteger(startYear)) {
    return null;
  }

  let academicYear = await AcademicYear.findOne({ startYear }).select("_id label startYear").lean();
  if (!academicYear) {
    const created = await AcademicYear.create({ label, startYear });
    academicYear = { _id: created._id, label: created.label, startYear: created.startYear };
  }

  cache.set(label, academicYear);
  return academicYear;
};

const run = async () => {
  await connectDatabase();

  const cache = new Map();
  const summary = {
    scanned: 0,
    updated: 0,
    alreadyNormalized: 0,
    createdAcademicYears: 0,
    skipped: 0,
  };

  const knownAcademicYearCount = await AcademicYear.countDocuments({});
  const applications = await ScholarshipApplication.find({}).select("_id academicYear academicYearId submittedAt createdAt").lean();

  for (const application of applications) {
    summary.scanned += 1;

    const normalizedLabel = normalizeAcademicYearLabel(application);
    if (!normalizedLabel) {
      summary.skipped += 1;
      continue;
    }

    const academicYear = await ensureAcademicYear(normalizedLabel, cache);
    if (!academicYear) {
      summary.skipped += 1;
      continue;
    }

    const normalizedAcademicYearId = String(academicYear._id);
    const currentAcademicYearId = application.academicYearId ? String(application.academicYearId) : "";
    const needsAcademicYearIdUpdate = currentAcademicYearId !== normalizedAcademicYearId;
    const needsAcademicYearLabelUpdate = String(application.academicYear || "").trim() !== normalizedLabel;

    if (!needsAcademicYearIdUpdate && !needsAcademicYearLabelUpdate) {
      summary.alreadyNormalized += 1;
      continue;
    }

    await ScholarshipApplication.updateOne(
      { _id: application._id },
      {
        $set: {
          academicYearId: new mongoose.Types.ObjectId(normalizedAcademicYearId),
          academicYear: normalizedLabel,
        },
      }
    );

    summary.updated += 1;
  }

  await AcademicYear.syncIndexes();
  await ScholarshipApplication.syncIndexes();

  const finalAcademicYearCount = await AcademicYear.countDocuments({});
  summary.createdAcademicYears = Math.max(0, finalAcademicYearCount - knownAcademicYearCount);

  console.log("Scholarship academic year migration completed.");
  console.log(JSON.stringify(summary, null, 2));
};

run()
  .catch((error) => {
    console.error("Scholarship academic year migration failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });