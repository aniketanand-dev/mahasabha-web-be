const Admin = require("../models/admin.model");
const PasswordResetToken = require("../models/password-reset-token.model");

const createAdmin = async ({ username, email, passwordHash, role }) => {
  return Admin.create({ username, email, passwordHash, role });
};

const findAdminByUsername = async (username) => {
  return Admin.findOne({ username }).lean();
};

const findAdminByEmail = async (email) => {
  return Admin.findOne({ email }).lean();
};

const findAdminByUsernameOrEmail = async ({ username, email }) => {
  return Admin.findOne({ $or: [{ username }, { email }] }).lean();
};

const updateAdminLoginTime = async (adminId) => {
  return Admin.findByIdAndUpdate(adminId, { lastLoginAt: new Date() }, { new: true }).lean();
};

const updateAdminPassword = async (adminId, passwordHash) => {
  return Admin.findByIdAndUpdate(adminId, { passwordHash }, { new: true }).lean();
};

const storeResetToken = async ({ adminId, tokenHash, expiresAt }) => {
  return PasswordResetToken.create({ adminId, tokenHash, expiresAt });
};

const findValidResetToken = async (tokenHash, now) => {
  return PasswordResetToken.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: now }
  }).lean();
};

const markResetTokenUsed = async (tokenId) => {
  return PasswordResetToken.findByIdAndUpdate(tokenId, { usedAt: new Date() }, { new: true }).lean();
};

const findAdminById = async (adminId) => {
  return Admin.findById(adminId).lean();
};

module.exports = {
  createAdmin,
  findAdminByUsername,
  findAdminByEmail,
  findAdminByUsernameOrEmail,
  updateAdminLoginTime,
  updateAdminPassword,
  storeResetToken,
  findValidResetToken,
  markResetTokenUsed,
  findAdminById
};
