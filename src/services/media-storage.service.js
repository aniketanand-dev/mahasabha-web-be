const fs = require("fs/promises");
const path = require("path");
const paths = require("../config/paths");
const { UPLOAD } = require("../constants");

const allowedUploadFolders = new Set(UPLOAD.ALLOWED_FOLDERS);

const sanitizeBaseName = (fileName) => {
  return fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "image";
};

const isManagedUploadPath = (filePath) => {
  return typeof filePath === "string" && filePath.startsWith(`${UPLOAD.ROUTE_PREFIX}/`);
};

const isAllowedFolder = (folder) => {
  return typeof folder === "string" && allowedUploadFolders.has(folder);
};

const getUploadFolderDir = (folder) => {
  if (!isAllowedFolder(folder)) {
    throw new Error("Invalid upload folder.");
  }

  return path.join(paths.uploadsRootDir, folder);
};

const createManagedSrc = (folder, fileName) => {
  return `${UPLOAD.ROUTE_PREFIX}/${folder}/${fileName}`;
};

const resolveManagedPath = (src) => {
  if (!isManagedUploadPath(src)) {
    return null;
  }

  const normalized = path.normalize(src.replace(/^\//, ""));
  const segments = normalized.split(path.sep).filter(Boolean);
  const folder = segments[1];

  if (!isAllowedFolder(folder)) {
    return null;
  }

  const fileName = segments.slice(2).join(path.sep);
  const absolutePath = path.join(getUploadFolderDir(folder), fileName);
  const allowedRoot = path.join(paths.uploadsRootDir, folder);

  if (!absolutePath.startsWith(allowedRoot)) {
    return null;
  }

  return absolutePath;
};

const ensureStorage = async (folder) => {
  await fs.mkdir(getUploadFolderDir(folder), { recursive: true });
};

const ensureAllStorageFolders = async () => {
  await Promise.all(UPLOAD.ALLOWED_FOLDERS.map((folder) => ensureStorage(folder)));
};

const readGallery = async () => {
  try {
    const fileContent = await fs.readFile(paths.galleryDataFile, "utf8");
    const parsed = JSON.parse(fileContent);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
};

const writeGallery = async (items) => {
  await fs.writeFile(paths.galleryDataFile, `${JSON.stringify(items, null, 2)}\n`, "utf8");
};

const removeManagedFile = async (src) => {
  const absolutePath = resolveManagedPath(src);

  if (!absolutePath) {
    return;
  }

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

module.exports = {
  allowedUploadFolders,
  sanitizeBaseName,
  isManagedUploadPath,
  isAllowedFolder,
  getUploadFolderDir,
  createManagedSrc,
  resolveManagedPath,
  ensureStorage,
  ensureAllStorageFolders,
  readGallery,
  writeGallery,
  removeManagedFile
};
