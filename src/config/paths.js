const path = require("path");

const backendRootDir = path.resolve(__dirname, "..", "..");
const workspaceRootDir = path.resolve(backendRootDir, "..");
const frontendRootDir = path.join(workspaceRootDir, "Veerashiva_Mahasabha");

module.exports = {
  backendRootDir,
  workspaceRootDir,
  frontendRootDir,
  uploadsRootDir: path.join(frontendRootDir, "public", "uploads"),
  galleryDataFile: path.join(frontendRootDir, "data", "gallery.json")
};
