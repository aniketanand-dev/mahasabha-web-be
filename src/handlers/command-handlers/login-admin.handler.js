const LoginAdminCommand = require("../../commands/auth/login-admin.command");
const GetAdminByUsernameQuery = require("../../queries/auth/get-admin-by-username.query");
const { validateLoginInput } = require("../../validators/auth.validator");
const { comparePassword } = require("../../services/hash.service");
const { signAccessToken } = require("../../services/token.service");
const authService = require("../../services/auth.service");
const { MESSAGES, STATUS_CODES, JWT } = require("../../constants");
const AppError = require("../../utils/app-error");

class LoginAdminHandler {
  constructor({ queryBus }) {
    this.queryBus = queryBus;
  }

  async execute(command) {
    if (!(command instanceof LoginAdminCommand)) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    const { username, password } = validateLoginInput(command.payload);
    const admin = await this.queryBus.execute(new GetAdminByUsernameQuery({ username }));

    if (!admin) {
      throw new AppError(MESSAGES.AUTH.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
    }

    const isPasswordValid = await comparePassword(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(MESSAGES.AUTH.INVALID_CREDENTIALS, STATUS_CODES.UNAUTHORIZED);
    }

    if (!admin.isActive) {
      throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, STATUS_CODES.FORBIDDEN);
    }

    await authService.updateAdminLoginTime(admin._id);

    const accessToken = signAccessToken({
      sub: String(admin._id),
      username: admin.username,
      role: admin.role
    });

    return {
      accessToken,
      tokenType: JWT.TOKEN_TYPE,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    };
  }
}

module.exports = LoginAdminHandler;
