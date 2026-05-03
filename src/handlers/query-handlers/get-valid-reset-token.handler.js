const authService = require("../../services/auth.service");

class GetValidResetTokenHandler {
  async execute(query) {
    return authService.findValidResetToken(query.payload.tokenHash, new Date());
  }
}

module.exports = GetValidResetTokenHandler;
