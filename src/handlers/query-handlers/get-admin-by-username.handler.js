const authService = require("../../services/auth.service");

class GetAdminByUsernameHandler {
  async execute(query) {
    return authService.findAdminByUsername(query.payload.username);
  }
}

module.exports = GetAdminByUsernameHandler;
