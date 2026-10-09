const express = require("express");
const router = express.Router();
const multer = require("multer");
const photoController = require("../controllers/photoController");
const authMiddleware = require("../middleware/auth");

// Configure multer for memory buffer upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, WebP, etc.) are permitted."));
    }
  },
});

router.post("/upload-ipfs", authMiddleware, upload.single("image"), photoController.uploadToIPFS);
router.post("/check-duplicate", authMiddleware, photoController.checkDuplicate);
router.post("/", authMiddleware, photoController.savePhoto);
router.get("/mine", authMiddleware, photoController.getMyPhotos);
router.get("/stats", authMiddleware, photoController.getStats);
router.get("/recent", photoController.getRecentPhotos);
router.get("/verify/:hash", photoController.verifyPhotoByHash);
router.put("/transfer", authMiddleware, photoController.transferPhoto);

module.exports = router;
