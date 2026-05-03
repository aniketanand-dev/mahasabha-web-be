const { verifyAccessToken } = require("../services/token.service");
const { MESSAGES, STATUS_CODES, JWT } = require("../constants");
const AppError = require("../utils/app-error");

const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [tokenType, token] = authHeader.split(" ");

  if (!token || tokenType !== JWT.TOKEN_TYPE) {
    return next(new AppError(MESSAGES.COMMON.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return next(new AppError(MESSAGES.COMMON.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED));
  }
};

module.exports = { requireAdminAuth };
