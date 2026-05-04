const path = require("path");

const backendRootDir = path.resolve(__dirname, "..", "..");
const workspaceRootDir = path.resolve(backendRootDir, "..");
const frontendRootDir = path.join(workspaceRootDir, "Veerashiva_Mahasabha");
const backendUploadsRootDir = path.join(backendRootDir, "uploads");

module.exports = {
  backendRootDir,
  workspaceRootDir,
  frontendRootDir,
  uploadsRootDir: backendUploadsRootDir,
  galleryDataFile: path.join(frontendRootDir, "data", "gallery.json")
};
