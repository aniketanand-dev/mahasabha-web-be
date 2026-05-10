const express = require("express");
const fs = require("fs/promises");
const multer = require("multer");
const path = require("path");
const GalleryItem = require("../models/gallery-item.model");
const { UPLOAD } = require("../constants");
const {
  sanitizeBaseName,
  isAllowedFolder,
  getUploadFolderDir,
  createManagedSrc,
  ensureStorage,
  removeManagedFile
} = require("../services/media-storage.service");
const { uploadRateLimiter } = require("../middleware/rate-limit.middleware");

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

const uploadFileFilter = (request, file, callback) => {
  const folder = request.params.folder || request.body.folder;

  if (folder === "documents" || folder === "magazines") {
    if (file.mimetype !== UPLOAD.PDF_MIME_TYPE) {
      callback(new Error("Only PDF uploads are allowed in this folder."));
      return;
    }

    callback(null, true);
    return;
  }

  if (!file.mimetype.startsWith(UPLOAD.IMAGE_MIME_PREFIX)) {
    callback(new Error("Only image uploads are allowed."));
    return;
  }

  callback(null, true);
};

const galleryFileFilter = (_request, file, callback) => {
  if (
    !file.mimetype.startsWith(UPLOAD.IMAGE_MIME_PREFIX)
    && !file.mimetype.startsWith(UPLOAD.VIDEO_MIME_PREFIX)
  ) {
    callback(new Error("Only image and video uploads are allowed for gallery items."));
    return;
  }

  callback(null, true);
};

const getGalleryMediaType = (file) => {
  return file?.mimetype?.startsWith(UPLOAD.VIDEO_MIME_PREFIX) ? "video" : "image";
};

const upload = multer({
  storage,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE_BYTES },
  fileFilter: uploadFileFilter
});

const galleryUpload = multer({
  storage: galleryStorage,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE_BYTES },
  fileFilter: galleryFileFilter
});

router.post(`${UPLOAD.API_UPLOADS_PREFIX}/:folder`, uploadRateLimiter, upload.single("image"), async (request, response, next) => {
  try {
    const folder = request.params.folder;

    if (!isAllowedFolder(folder)) {
      response.status(400).json({ message: "Invalid upload folder." });
      return;
    }

    if (!request.file) {
      response.status(400).json({ message: "Upload file is required." });
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
    const items = await GalleryItem.find({}).sort({ createdAt: 1, _id: 1 }).lean();
    response.json(items.map((item) => ({
      id: item.id,
      src: item.src,
      mediaType: item.mediaType || "image",
      caption: item.caption
    })));
  } catch (error) {
    next(error);
  }
});

router.post(UPLOAD.API_GALLERY_PREFIX, uploadRateLimiter, galleryUpload.single("media"), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ message: "Gallery media file is required." });
      return;
    }

    const created = {
      id: Date.now(),
      src: createManagedSrc("gallery", request.file.filename),
      mediaType: getGalleryMediaType(request.file),
      caption: String(request.body.caption || "").trim()
    };

    await GalleryItem.create(created);
    response.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.patch(`${UPLOAD.API_GALLERY_PREFIX}/:id`, uploadRateLimiter, galleryUpload.single("media"), async (request, response, next) => {
  try {
    const itemId = Number(request.params.id);
    const existingItem = await GalleryItem.findOne({ id: itemId }).lean();

    if (!existingItem) {
      if (request.file) {
        await fs.unlink(request.file.path);
      }

      response.status(404).json({ message: "Gallery item not found." });
      return;
    }

    const nextItem = {
      ...existingItem,
      mediaType: existingItem.mediaType || "image",
      caption: request.body.caption !== undefined ? String(request.body.caption).trim() : existingItem.caption
    };

    if (request.file) {
      await removeManagedFile(existingItem.src);
      nextItem.src = createManagedSrc("gallery", request.file.filename);
      nextItem.mediaType = getGalleryMediaType(request.file);
    }

    await GalleryItem.updateOne(
      { id: itemId },
      { $set: { src: nextItem.src, mediaType: nextItem.mediaType, caption: nextItem.caption } }
    );
    response.json(nextItem);
  } catch (error) {
    next(error);
  }
});

router.delete(`${UPLOAD.API_GALLERY_PREFIX}/:id`, async (request, response, next) => {
  try {
    const itemId = Number(request.params.id);
    const existingItem = await GalleryItem.findOne({ id: itemId }).lean();

    if (!existingItem) {
      response.status(404).json({ message: "Gallery item not found." });
      return;
    }

    await removeManagedFile(existingItem.src);
    await GalleryItem.deleteOne({ id: itemId });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
