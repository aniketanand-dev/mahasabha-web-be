const { hashPassword } = require("../services/hash.service");
const Admin = require("../models/admin.model");
const { STATIC_VALUES, ROLES, MESSAGES } = require("../constants");
const logger = require("../utils/logger");

const ensureDefaultAdmin = async () => {
  const passwordHash = await hashPassword(STATIC_VALUES.DEFAULT_ADMIN_PASSWORD);

  try {
    const result = await Admin.updateOne(
      { username: STATIC_VALUES.DEFAULT_ADMIN_USERNAME },
      {
        $setOnInsert: {
          username: STATIC_VALUES.DEFAULT_ADMIN_USERNAME,
          email: STATIC_VALUES.DEFAULT_ADMIN_EMAIL,
          passwordHash,
          role: ROLES.ADMIN
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      logger.info(MESSAGES.DEFAULT_ADMIN.CREATED);
      return;
    }

    logger.info(MESSAGES.DEFAULT_ADMIN.EXISTS);
  } catch (error) {
    if (error?.code === 11000) {
      logger.info(MESSAGES.DEFAULT_ADMIN.EXISTS);
      return;
    }

    throw error;
  }
};

module.exports = ensureDefaultAdmin;
