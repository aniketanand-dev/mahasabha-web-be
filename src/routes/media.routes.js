const express = require("express");
const fs = require("fs/promises");
const multer = require("multer");
const path = require("path");
const paths = require("../config/paths");
const { UPLOAD } = require("../constants");
const {
  sanitizeBaseName,
  isAllowedFolder,
  getUploadFolderDir,
  createManagedSrc,
  ensureStorage,
  readGallery,
  writeGallery,
  removeManagedFile
} = require("../services/media-storage.service");

const router = express.Router();

const storage = multer.diskStorage({
  destination: async (request, _file, callback) => {
    try {
      const folder = request.params.folder || request.body.folder;

      if (!isAllowedFolder(folder)) {
        callback(new Error("Invalid upload folder."));
        return;
      }

      await ensureStorage(folder);
      callback(null, getUploadFolderDir(folder));
    } catch (error) {
      callback(error);
    }
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname) || ".jpg";
    const safeName = sanitizeBaseName(file.originalname);
    callback(null, `${Date.now()}-${safeName}${extension.toLowerCase()}`);
  }
});

const galleryStorage = multer.diskStorage({
  destination: async (_request, _file, callback) => {
    try {
      await ensureStorage("gallery");
      callback(null, getUploadFolderDir("gallery"));
    } catch (error) {
      callback(error);
    }
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname) || ".jpg";
    const safeName = sanitizeBaseName(file.originalname);
    callback(null, `${Date.now()}-${safeName}${extension.toLowerCase()}`);
  }
});

const imageFileFilter = (_request, file, callback) => {
  if (!file.mimetype.startsWith(UPLOAD.IMAGE_MIME_PREFIX)) {
    callback(new Error("Only image uploads are allowed."));
    return;
  }

  callback(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE_BYTES },
  fileFilter: imageFileFilter
});

const galleryUpload = multer({
  storage: galleryStorage,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE_BYTES },
  fileFilter: imageFileFilter
});

router.post(`${UPLOAD.API_UPLOADS_PREFIX}/:folder`, upload.single("image"), async (request, response, next) => {
  try {
    const folder = request.params.folder;

    if (!isAllowedFolder(folder)) {
      response.status(400).json({ message: "Invalid upload folder." });
      return;
    }

    if (!request.file) {
      response.status(400).json({ message: "Image file is required." });
      return;
    }

    response.status(201).json({
      src: createManagedSrc(folder, request.file.filename)
    });
  } catch (error) {
    next(error);
  }
});

router.delete(UPLOAD.API_UPLOADS_PREFIX, async (request, response, next) => {
  try {
    await removeManagedFile(request.body?.path);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get(UPLOAD.API_GALLERY_PREFIX, async (_request, response, next) => {
  try {
    response.json(await readGallery());
  } catch (error) {
    next(error);
  }
});

router.post(UPLOAD.API_GALLERY_PREFIX, galleryUpload.single("image"), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ message: "Image file is required." });
      return;
    }

    const items = await readGallery();
    const created = {
      id: Date.now(),
      src: createManagedSrc("gallery", request.file.filename),
      caption: String(request.body.caption || "").trim()
    };

    items.push(created);
    await writeGallery(items);
    response.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.patch(`${UPLOAD.API_GALLERY_PREFIX}/:id`, galleryUpload.single("image"), async (request, response, next) => {
  try {
    const itemId = Number(request.params.id);
    const items = await readGallery();
    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      if (request.file) {
        await fs.unlink(request.file.path);
      }

      response.status(404).json({ message: "Gallery item not found." });
      return;
    }

    const existingItem = items[itemIndex];
    const nextItem = {
      ...existingItem,
      caption: request.body.caption !== undefined ? String(request.body.caption).trim() : existingItem.caption
    };

    if (request.file) {
      await removeManagedFile(existingItem.src);
      nextItem.src = createManagedSrc("gallery", request.file.filename);
    }

    items[itemIndex] = nextItem;
    await writeGallery(items);
    response.json(nextItem);
  } catch (error) {
    next(error);
  }
});

router.delete(`${UPLOAD.API_GALLERY_PREFIX}/:id`, async (request, response, next) => {
  try {
    const itemId = Number(request.params.id);
    const items = await readGallery();
    const existingItem = items.find((item) => item.id === itemId);

    if (!existingItem) {
      response.status(404).json({ message: "Gallery item not found." });
      return;
    }

    await removeManagedFile(existingItem.src);
    await writeGallery(items.filter((item) => item.id !== itemId));
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
