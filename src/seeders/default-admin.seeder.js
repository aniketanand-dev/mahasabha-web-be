const authService = require("../services/auth.service");
const { hashPassword } = require("../services/hash.service");
const { STATIC_VALUES, ROLES, MESSAGES } = require("../constants");
const logger = require("../utils/logger");

const ensureDefaultAdmin = async () => {
  const existingAdmin = await authService.findAdminByUsername(STATIC_VALUES.DEFAULT_ADMIN_USERNAME);

  if (existingAdmin) {
    logger.info(MESSAGES.DEFAULT_ADMIN.EXISTS);
    return;
  }

  const passwordHash = await hashPassword(STATIC_VALUES.DEFAULT_ADMIN_PASSWORD);

  await authService.createAdmin({
    username: STATIC_VALUES.DEFAULT_ADMIN_USERNAME,
    email: STATIC_VALUES.DEFAULT_ADMIN_EMAIL,
    passwordHash,
    role: ROLES.ADMIN
  });

  logger.info(MESSAGES.DEFAULT_ADMIN.CREATED);
};

module.exports = ensureDefaultAdmin;
