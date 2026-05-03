const { MESSAGES, STATUS_CODES, STATIC_VALUES } = require("../constants");
const AppError = require("../utils/app-error");

const normalizeIdentity = (value) => String(value || "").trim().toLowerCase();

const validateSignupInput = ({ username, password, email }) => {
  if (!username || !password || !email) {
    throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
  }

  if (String(password).length < STATIC_VALUES.MIN_PASSWORD_LENGTH) {
    throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.UNPROCESSABLE_ENTITY, {
      password: `Minimum length is ${STATIC_VALUES.MIN_PASSWORD_LENGTH}`
    });
  }

  return {
    username: normalizeIdentity(username),
    password: String(password),
    email: normalizeIdentity(email)
  };
};

const validateLoginInput = ({ username, password }) => {
  if (!username || !password) {
    throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
  }

  return {
    username: normalizeIdentity(username),
    password: String(password)
  };
};

const validateForgotPasswordInput = ({ email }) => {
  if (!email) {
    throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
  }

  return { email: normalizeIdentity(email) };
};

const validateResetPasswordInput = ({ token, password }) => {
  if (!token) {
    throw new AppError(MESSAGES.AUTH.TOKEN_REQUIRED, STATUS_CODES.BAD_REQUEST);
  }

  if (!password || String(password).length < STATIC_VALUES.MIN_PASSWORD_LENGTH) {
    throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.UNPROCESSABLE_ENTITY, {
      password: `Minimum length is ${STATIC_VALUES.MIN_PASSWORD_LENGTH}`
    });
  }

  return {
    token: String(token),
    password: String(password)
  };
};

module.exports = {
  validateSignupInput,
  validateLoginInput,
  validateForgotPasswordInput,
  validateResetPasswordInput
};
