const authService = require("../../services/auth.service");

class GetAdminByEmailHandler {
  async execute(query) {
    return authService.findAdminByEmail(query.payload.email);
  }
}

module.exports = GetAdminByEmailHandler;
