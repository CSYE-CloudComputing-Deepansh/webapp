// upload-config.js
const multer = require('multer');

let upload;

try {
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5 MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type, only JPEG and PNG are allowed!"), false);
      }
    },
  });
} catch (error) {
  console.error("Error configuring multer:", error.message);
  throw new Error("Failed to initialize multer for file uploads");
}

module.exports = upload;
