const ForgotPasswordCommand = require("../../commands/auth/forgot-password.command");
const GetAdminByEmailQuery = require("../../queries/auth/get-admin-by-email.query");
const { validateForgotPasswordInput } = require("../../validators/auth.validator");
const { generatePasswordResetToken, hashResetToken } = require("../../services/token.service");
const { sendPasswordResetMail } = require("../../services/mail.service");
const authService = require("../../services/auth.service");
const env = require("../../config/env");
const { MESSAGES, STATIC_VALUES, STATUS_CODES } = require("../../constants");
const AppError = require("../../utils/app-error");

class ForgotPasswordHandler {
  constructor({ queryBus }) {
    this.queryBus = queryBus;
  }

  async execute(command) {
    if (!(command instanceof ForgotPasswordCommand)) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    const { email } = validateForgotPasswordInput(command.payload);
    const admin = await this.queryBus.execute(new GetAdminByEmailQuery({ email }));

    if (!admin) {
      return { message: MESSAGES.AUTH.FORGOT_PASSWORD_SUCCESS };
    }

    const rawToken = generatePasswordResetToken();
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await authService.storeResetToken({ adminId: admin._id, tokenHash, expiresAt });

    const resetUrl = `${env.FRONTEND_URL}${STATIC_VALUES.PASSWORD_RESET_URL_PATH}?token=${rawToken}`;
    await sendPasswordResetMail({ to: admin.email, resetUrl });

    return { message: MESSAGES.AUTH.FORGOT_PASSWORD_SUCCESS };
  }
}

module.exports = ForgotPasswordHandler;
