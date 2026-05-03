const JWT = Object.freeze({
  TOKEN_TYPE: "Bearer",
  DEFAULT_EXPIRES_IN: "1d",
  DEFAULT_ISSUER: "mahasabha-backend",
  DEFAULT_AUDIENCE: "mahasabha-admin"
});

module.exports = JWT;
