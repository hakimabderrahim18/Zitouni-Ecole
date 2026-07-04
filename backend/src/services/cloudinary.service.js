const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'zitouni-cloudinary',
  api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'abcdefghijklmnopqrstuvwxyz12',
});

/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer File buffer from Multer
 * @param {string} folder Target Cloudinary directory
 * @returns {Promise<object>} Upload response metadata
 */
const uploadBuffer = (fileBuffer, folder = 'zitouni_school') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: 'auto' },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = { uploadBuffer };
