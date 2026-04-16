const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "fullstack-car-app",
      resource_type: "auto", // handles both image and video
    };
  },
});

function mediaFileFilter(req, file, cb) {
  const mime = String(file.mimetype || "").toLowerCase();
  if (mime.startsWith("image/") || mime.startsWith("video/")) {
    cb(null, true);
    return;
  }

  cb(new Error("Only image and video files are allowed"));
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: mediaFileFilter,
});

module.exports = upload;
