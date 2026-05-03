const ResetPasswordCommand = require("../../commands/auth/reset-password.command");
const GetValidResetTokenQuery = require("../../queries/auth/get-valid-reset-token.query");
const { validateResetPasswordInput } = require("../../validators/auth.validator");
const { hashResetToken } = require("../../services/token.service");
const { hashPassword } = require("../../services/hash.service");
const authService = require("../../services/auth.service");
const { MESSAGES, STATUS_CODES } = require("../../constants");
const AppError = require("../../utils/app-error");

class ResetPasswordHandler {
  constructor({ queryBus }) {
    this.queryBus = queryBus;
  }

  async execute(command) {
    if (!(command instanceof ResetPasswordCommand)) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    const { token, password } = validateResetPasswordInput(command.payload);
    const tokenHash = hashResetToken(token);
    const tokenRecord = await this.queryBus.execute(new GetValidResetTokenQuery({ tokenHash }));

    if (!tokenRecord) {
      throw new AppError(MESSAGES.AUTH.INVALID_OR_EXPIRED_RESET_TOKEN, STATUS_CODES.UNAUTHORIZED);
    }

    const newPasswordHash = await hashPassword(password);
    await authService.updateAdminPassword(tokenRecord.adminId, newPasswordHash);
    await authService.markResetTokenUsed(tokenRecord._id);

    return { message: MESSAGES.AUTH.RESET_PASSWORD_SUCCESS };
  }
}

module.exports = ResetPasswordHandler;
