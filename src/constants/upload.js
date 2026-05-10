const UPLOAD = Object.freeze({
  ROUTE_PREFIX: "/uploads",
  API_UPLOADS_PREFIX: "/api/uploads",
  API_GALLERY_PREFIX: "/api/gallery",
  ALLOWED_FOLDERS: [
    "gallery",
    "documents",
    "magazines",
    "placeholders",
    "navbar",
    "hero",
    "president",
    "bhavan",
    "leaders",
    "past-presidents",
    "events",
    "founders",
    "hostels",
    "scholarships"
  ],
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  IMAGE_MIME_PREFIX: "image/",
  VIDEO_MIME_PREFIX: "video/",
  PDF_MIME_TYPE: "application/pdf"
});

module.exports = UPLOAD;
