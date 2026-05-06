const mongoose = require("mongoose");
const SiteContent = require("../models/site-content.model");
const SECTION_CONTENT_MODELS = require("../models/section-content.models");
const { sendSuccess } = require("../utils/api-response");
const { STATUS_CODES, MESSAGES } = require("../constants");
const AppError = require("../utils/app-error");

const ALLOWED_CONTENT_KEYS = new Set(Object.keys(SECTION_CONTENT_MODELS));

const normalizeKey = (value) => String(value || "").trim();
const normalizeUpdatedBy = (value) => {
  const normalized = String(value || "").trim();
  return normalized && mongoose.isValidObjectId(normalized) ? normalized : null;
};

class SiteContentController {
  migrateLegacyValue = async (key, model) => {
    const legacy = await SiteContent.findOne({ key }).lean();

    if (!legacy) {
      return null;
    }

    return model.findOneAndUpdate(
      {},
      { value: legacy.value, updatedBy: legacy.updatedBy || null },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
  };

  list = async (req, res) => {
    const rawKeys = String(req.query.keys || "").trim();
    const keys = rawKeys
      ? rawKeys
          .split(",")
          .map((key) => normalizeKey(key))
          .filter(Boolean)
      : [];

    const targetKeys = keys.length ? keys : [...ALLOWED_CONTENT_KEYS];
    const items = {};

    for (const key of targetKeys) {
      if (!ALLOWED_CONTENT_KEYS.has(key)) {
        continue;
      }

      const model = SECTION_CONTENT_MODELS[key];
      let row = await model.findOne({}).lean();

      if (!row) {
        row = await this.migrateLegacyValue(key, model);
      }

      if (row && Object.prototype.hasOwnProperty.call(row, "value")) {
        items[key] = row.value;
      }
    }

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, { items });
  };

  upsert = async (req, res) => {
    const key = normalizeKey(req.params.key);

    if (!ALLOWED_CONTENT_KEYS.has(key)) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    if (!Object.prototype.hasOwnProperty.call(req.body || {}, "value")) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    const updatedBy = normalizeUpdatedBy(req.user?.sub);

    const model = SECTION_CONTENT_MODELS[key];

    const row = await model.findOneAndUpdate(
      {},
      { value: req.body.value, updatedBy },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.COMMON.SUCCESS, {
      key: row.key,
      value: row.value,
      updatedAt: row.updatedAt,
    });
  };
}

module.exports = SiteContentController;
