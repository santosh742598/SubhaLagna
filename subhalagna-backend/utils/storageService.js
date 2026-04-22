"use strict";

/**
 * @file SubhaLagna v3.0.4 — Unified Storage Service
 * @description   Abstracts file storage logic between Local Disk and AWS S3.
 *                Enables seamless cloud migration via .env toggle.
 *                v2.2.0 changes:
 *                  - Initial implementation with lazy-loaded AWS SDK
 *                  - Support for local filesystem fallback
 * @author        SubhaLagna Team
 * @version      3.0.4
 */

const fs = require('fs');
const path = require('path');

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';

/**
 * Uploads a memory buffer (e.g., from Sharp) to the configured storage.
 * @param {Buffer} buffer - The file buffer to upload.
 * @param {string} filename - The target filename (including extension).
 * @param {string} folder - Optional subfolder (defaults to 'uploads').
 * @returns {Promise<string>} - The accessible URL or relative path to the file.
 */
exports.uploadBuffer = async (buffer, filename, folder = 'uploads') => {
  if (STORAGE_TYPE === 's3') {
    try {
      // Lazy-load AWS SDK to prevent crashes if dependencies are missing during local dev
      const { S3Client } = require('@aws-sdk/client-s3');
      const { Upload } = require('@aws-sdk/lib-storage');

      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `${folder}/${filename}`,
          Body: buffer,
          ContentType: 'image/webp',
        },
      });

      await upload.done();

      return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${folder}/${filename}`;
    } catch (err) {
      console.error('S3 Upload Failed:', err);
      // If S3 fails (missing keys/deps), throw clear error
      throw new Error(
        `Cloud Storage Error: ${err.code === 'MODULE_NOT_FOUND' ? 'AWS SDK missing' : err.message}`,
      );
    }
  } else {
    // ── Local Storage Fallback ──────────────────────────────────────────────
    try {
      const uploadDir = path.join(__dirname, '..', folder);

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filePath, buffer);

      return `/${folder}/${filename}`;
    } catch (err) {
      console.error('Local Upload Failed:', err);
      throw new Error('Failed to save image to local disk');
    }
  }
};

/**
 * Deletes a file from storage.
 * @param {string} fileUrl - The URL or local path of the file to delete.
 * @returns {Promise<void>} - A promise that resolves when the file is deleted.
 */
exports.deleteFile = async (fileUrl) => {
  if (!fileUrl || (fileUrl.startsWith('http') && !fileUrl.includes(process.env.AWS_S3_BUCKET))) {
    return;
  }

  if (STORAGE_TYPE === 's3') {
    try {
      const key = fileUrl.split('.com/')[1];
      if (!key) return;

      const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
        }),
      );
    } catch (err) {
      console.warn('S3 Delete Warning:', err.message);
    }
  } else {
    try {
      const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
      const fullPath = path.join(__dirname, '..', relativePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (err) {
      console.warn('Local Delete Warning:', err.message);
    }
  }
};
