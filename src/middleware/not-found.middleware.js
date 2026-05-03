const { STATUS_CODES, MESSAGES } = require("../constants");
const { sendError } = require("../utils/api-response");

const notFoundHandler = (req, res) => {
  return sendError(res, STATUS_CODES.NOT_FOUND, MESSAGES.COMMON.NOT_FOUND);
};

module.exports = notFoundHandler;
