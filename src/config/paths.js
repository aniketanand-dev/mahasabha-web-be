const path = require("path");
const fs = require("fs");

const backendRootDir = path.resolve(__dirname, "..", "..");
const workspaceRootDir = path.resolve(backendRootDir, "..");
const frontendRootDir = path.join(workspaceRootDir, "Veerashiva_Mahasabha");
const backendUploadsRootDir = path.join(backendRootDir, "uploads");
const frontendGalleryDataDir = path.join(frontendRootDir, "data");
const backendGalleryDataDir = path.join(backendRootDir, "data");

const resolveGalleryDataFile = () => {
  if (process.env.GALLERY_DATA_FILE) {
    return path.resolve(process.env.GALLERY_DATA_FILE);
  }

  if (fs.existsSync(frontendGalleryDataDir)) {
    return path.join(frontendGalleryDataDir, "gallery.json");
  }

  return path.join(backendGalleryDataDir, "gallery.json");
};

module.exports = {
  backendRootDir,
  workspaceRootDir,
  frontendRootDir,
  uploadsRootDir: backendUploadsRootDir,
  galleryDataFile: resolveGalleryDataFile()
};
