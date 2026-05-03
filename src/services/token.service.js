const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { STATIC_VALUES } = require("../constants");

const signAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });
};

const generatePasswordResetToken = () => {
  return crypto.randomBytes(STATIC_VALUES.PASSWORD_RESET_TOKEN_BYTES).toString("hex");
};

const hashResetToken = (rawToken) => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generatePasswordResetToken,
  hashResetToken
};
