const SignupAdminCommand = require("../../commands/auth/signup-admin.command");
const GetAdminByUsernameQuery = require("../../queries/auth/get-admin-by-username.query");
const GetAdminByEmailQuery = require("../../queries/auth/get-admin-by-email.query");
const { validateSignupInput } = require("../../validators/auth.validator");
const { hashPassword } = require("../../services/hash.service");
const authService = require("../../services/auth.service");
const { MESSAGES, ROLES, STATUS_CODES } = require("../../constants");
const AppError = require("../../utils/app-error");

class SignupAdminHandler {
  constructor({ queryBus }) {
    this.queryBus = queryBus;
  }

  async execute(command) {
    if (!(command instanceof SignupAdminCommand)) {
      throw new AppError(MESSAGES.COMMON.VALIDATION_ERROR, STATUS_CODES.BAD_REQUEST);
    }

    const { username, email, password } = validateSignupInput(command.payload);

    const existingByUsername = await this.queryBus.execute(new GetAdminByUsernameQuery({ username }));
    if (existingByUsername) {
      throw new AppError(MESSAGES.AUTH.ADMIN_EXISTS, STATUS_CODES.CONFLICT);
    }

    const existingByEmail = await this.queryBus.execute(new GetAdminByEmailQuery({ email }));
    if (existingByEmail) {
      throw new AppError(MESSAGES.AUTH.ADMIN_EXISTS, STATUS_CODES.CONFLICT);
    }

    const passwordHash = await hashPassword(password);
    const admin = await authService.createAdmin({ username, email, passwordHash, role: ROLES.ADMIN });

    return {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt
    };
  }
}

module.exports = SignupAdminHandler;
