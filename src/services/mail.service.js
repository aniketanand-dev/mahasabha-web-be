const nodemailer = require("nodemailer");
const env = require("../config/env");
const logger = require("../utils/logger");

const canUseSmtp = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const transporter = canUseSmtp
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    })
  : null;

const sendPasswordResetMail = async ({ to, resetUrl }) => {
  if (!transporter) {
    logger.warn("SMTP not configured. Password reset URL:", resetUrl);
    return false;
  }

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Password Reset Request",
    text: `Reset your password using this link: ${resetUrl}`
  });

  return true;
};

module.exports = {
  sendPasswordResetMail
};
