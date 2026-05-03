const mongoose = require("mongoose");
const { COLLECTION_NAMES, ROLES } = require("../constants");

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, default: ROLES.ADMIN },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date }
  },
  {
    collection: COLLECTION_NAMES.ADMINS,
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model("Admin", adminSchema);
