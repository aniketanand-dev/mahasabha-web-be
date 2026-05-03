const { MESSAGES } = require("../constants");

const sendSuccess = (res, statusCode, message = MESSAGES.COMMON.SUCCESS, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, statusCode, message, details = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    details
  });
};

module.exports = { sendSuccess, sendError };
