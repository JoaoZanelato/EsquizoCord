// esquizocord-backend/utils/multer-config.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function setupMulter(folder, transformation = null) {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
      const userId = req.session.user ? req.session.user.id_usuario : "unknown";
      const params = {
        folder: folder,
        public_id: `${folder.slice(0, 10)}-${userId}-${Date.now()}`,
      };
      if (transformation) {
        params.transformation = [transformation];
      }
      return params;
    },
  });
  return multer({ storage: storage });
}

module.exports = { setupMulter };
