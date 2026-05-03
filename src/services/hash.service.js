const bcrypt = require("bcryptjs");
const env = require("../config/env");

const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);
};

const comparePassword = async (plainPassword, passwordHash) => {
  return bcrypt.compare(plainPassword, passwordHash);
};

module.exports = {
  hashPassword,
  comparePassword
};
