/**
 * @fileoverview SubhaLagna v2.0.0 — File Upload Middleware (Multer)
 * @description   Configures Multer for local disk storage with:
 *                - Image-only file filter (jpg, jpeg, png, webp)
 *                - 5MB size limit per file
 *                - Unique timestamped filenames
 *                - Named upload configurations (profilePhoto, additionalPhotos)
 *
 *                For production, replace diskStorage with a Cloudinary
 *                or S3 storage engine (CloudinaryStorage from multer-storage-cloudinary).
 *
 * @author        SubhaLagna Team
 * @version       2.0.2
 */

'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ── Ensure uploads directory exists ──────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Disk Storage Engine ───────────────────────────────────────────────────────
const storage = multer.diskStorage({
  /**
   * Set the destination folder for uploaded files.
   * @param {*} req
   * @param {*} file
   * @param {Function} cb
   */
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },

  /**
   * Generate a unique filename: fieldname-timestamp-randomhex.ext
   * @param {*} req
   * @param {*} file
   * @param {Function} cb
   */
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// ── File Type Filter ──────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = /image\/(jpeg|jpg|png|webp)/;
const ALLOWED_EXTENSIONS = /\.(jpeg|jpg|png|webp)$/i;

/**
 * Validate file type — rejects non-image files with a descriptive error.
 *
 * @param {import('express').Request} req
 * @param {Express.Multer.File}       file
 * @param {Function}                  cb
 */
const fileFilter = (req, file, cb) => {
  const isValidMime = ALLOWED_MIME_TYPES.test(file.mimetype);
  const isValidExt  = ALLOWED_EXTENSIONS.test(path.extname(file.originalname));

  if (isValidMime && isValidExt) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WebP image files are allowed'), false);
  }
};

// ── Multer Instance ───────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 6,                   // max 6 files in a single request
  },
});

/**
 * Pre-configured upload for profile setup and editing:
 *  - profilePhoto    → single image
 *  - additionalPhotos → up to 5 images
 */
const uploadProfilePhotos = upload.fields([
  { name: 'profilePhoto',    maxCount: 1 },
  { name: 'additionalPhotos', maxCount: 5 },
]);

/**
 * Pre-configured upload for single profile photo only.
 */
const uploadSinglePhoto = upload.single('profilePhoto');

module.exports = { upload, uploadProfilePhotos, uploadSinglePhoto };
