const { STATUS_CODES, MESSAGES } = require("../constants");
const { sendError } = require("../utils/api-response");

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
  const message = error.message || MESSAGES.COMMON.INTERNAL_SERVER_ERROR;

  return sendError(res, statusCode, message, error.details || null);
};

module.exports = errorHandler;
