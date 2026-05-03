const SignupAdminCommand = require("../commands/auth/signup-admin.command");
const LoginAdminCommand = require("../commands/auth/login-admin.command");
const ForgotPasswordCommand = require("../commands/auth/forgot-password.command");
const ResetPasswordCommand = require("../commands/auth/reset-password.command");
const { sendSuccess } = require("../utils/api-response");
const { STATUS_CODES, MESSAGES } = require("../constants");

class AuthController {
  constructor({ commandBus }) {
    this.commandBus = commandBus;
  }

  signup = async (req, res) => {
    const data = await this.commandBus.execute(new SignupAdminCommand(req.body));
    return sendSuccess(res, STATUS_CODES.CREATED, MESSAGES.AUTH.SIGNUP_SUCCESS, data);
  };

  login = async (req, res) => {
    const data = await this.commandBus.execute(new LoginAdminCommand(req.body));
    return sendSuccess(res, STATUS_CODES.OK, MESSAGES.AUTH.LOGIN_SUCCESS, data);
  };

  forgotPassword = async (req, res) => {
    const data = await this.commandBus.execute(new ForgotPasswordCommand(req.body));
    return sendSuccess(res, STATUS_CODES.OK, data.message, null);
  };

  resetPassword = async (req, res) => {
    const data = await this.commandBus.execute(new ResetPasswordCommand(req.body));
    return sendSuccess(res, STATUS_CODES.OK, data.message, null);
  };
}

module.exports = AuthController;
