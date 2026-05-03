const mongoose = require("mongoose");
const { COLLECTION_NAMES } = require("../constants");

const passwordResetTokenSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null }
  },
  {
    collection: COLLECTION_NAMES.PASSWORD_RESET_TOKENS,
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model("PasswordResetToken", passwordResetTokenSchema);
