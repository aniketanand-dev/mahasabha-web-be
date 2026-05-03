const CommandBus = require("./command-bus");
const QueryBus = require("./query-bus");

const SignupAdminHandler = require("../handlers/command-handlers/signup-admin.handler");
const LoginAdminHandler = require("../handlers/command-handlers/login-admin.handler");
const ForgotPasswordHandler = require("../handlers/command-handlers/forgot-password.handler");
const ResetPasswordHandler = require("../handlers/command-handlers/reset-password.handler");

const GetAdminByUsernameHandler = require("../handlers/query-handlers/get-admin-by-username.handler");
const GetAdminByEmailHandler = require("../handlers/query-handlers/get-admin-by-email.handler");
const GetValidResetTokenHandler = require("../handlers/query-handlers/get-valid-reset-token.handler");

const SignupAdminCommand = require("../commands/auth/signup-admin.command");
const LoginAdminCommand = require("../commands/auth/login-admin.command");
const ForgotPasswordCommand = require("../commands/auth/forgot-password.command");
const ResetPasswordCommand = require("../commands/auth/reset-password.command");

const GetAdminByUsernameQuery = require("../queries/auth/get-admin-by-username.query");
const GetAdminByEmailQuery = require("../queries/auth/get-admin-by-email.query");
const GetValidResetTokenQuery = require("../queries/auth/get-valid-reset-token.query");

const createBuses = () => {
  const commandBus = new CommandBus();
  const queryBus = new QueryBus();

  queryBus.register(GetAdminByUsernameQuery.name, new GetAdminByUsernameHandler());
  queryBus.register(GetAdminByEmailQuery.name, new GetAdminByEmailHandler());
  queryBus.register(GetValidResetTokenQuery.name, new GetValidResetTokenHandler());

  commandBus.register(SignupAdminCommand.name, new SignupAdminHandler({ queryBus }));
  commandBus.register(LoginAdminCommand.name, new LoginAdminHandler({ queryBus }));
  commandBus.register(ForgotPasswordCommand.name, new ForgotPasswordHandler({ queryBus }));
  commandBus.register(ResetPasswordCommand.name, new ResetPasswordHandler({ queryBus }));

  return { commandBus, queryBus };
};

module.exports = createBuses;
