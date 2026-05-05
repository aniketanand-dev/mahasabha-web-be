const dotenv = require("dotenv");
const { JWT, STATIC_VALUES } = require("../constants");

dotenv.config();

const parseOrigins = (value, fallback) => {
  const candidates = String(value || fallback)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return candidates.length ? candidates : [fallback];
};

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseTrustProxy = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return false;
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  const parsed = Number.parseInt(normalized, 10);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }

  return value;
};

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URL: process.env.MONGODB_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || JWT.DEFAULT_EXPIRES_IN,
  JWT_ISSUER: process.env.JWT_ISSUER || JWT.DEFAULT_ISSUER,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || JWT.DEFAULT_AUDIENCE,
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES:
    Number(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES) || STATIC_VALUES.DEFAULT_PASSWORD_RESET_EXPIRY_MINUTES,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:4200",
  FRONTEND_ORIGINS: parseOrigins(
    process.env.FRONTEND_ORIGINS,
    process.env.FRONTEND_URL || "http://localhost:4200"
  ),
  RATE_LIMIT_WINDOW_MS: parsePositiveInteger(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: parsePositiveInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 300),
  AUTH_RATE_LIMIT_MAX_REQUESTS: parsePositiveInteger(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 20),
  UPLOAD_RATE_LIMIT_MAX_REQUESTS: parsePositiveInteger(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS, 30),
  TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY),
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "noreply@mahasabha.local"
};

const requiredVars = ["MONGODB_URL", "JWT_SECRET"];
requiredVars.forEach((key) => {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = env;
