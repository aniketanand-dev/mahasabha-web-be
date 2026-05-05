const rateLimit = require("express-rate-limit");
const env = require("../config/env");
const { STATUS_CODES, MESSAGES } = require("../constants");
const { sendError } = require("../utils/api-response");

const createRateLimiter = (maxRequests, message) => {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_request, response) => {
      return sendError(response, STATUS_CODES.TOO_MANY_REQUESTS, message);
    }
  });
};

const apiRateLimiter = createRateLimiter(
  env.RATE_LIMIT_MAX_REQUESTS,
  MESSAGES.COMMON.TOO_MANY_REQUESTS
);

const authRateLimiter = createRateLimiter(
  env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  MESSAGES.AUTH.TOO_MANY_REQUESTS
);

const uploadRateLimiter = createRateLimiter(
  env.UPLOAD_RATE_LIMIT_MAX_REQUESTS,
  MESSAGES.COMMON.TOO_MANY_REQUESTS
);

module.exports = {
  apiRateLimiter,
  authRateLimiter,
  uploadRateLimiter,
};