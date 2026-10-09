const Photo = require("../models/Photo");
const pinataService = require("../services/pinataService");

// Helper to convert hex string to binary string
function hexToBinary(hex) {
  let bin = "";
  for (let i = 0; i < hex.length; i++) {
    const b = parseInt(hex[i], 16).toString(2).padStart(4, "0");
    bin += b;
  }
  return bin;
}

// Calculate Hamming distance between two pHash hex strings
function calculateHammingDistance(hexA, hexB) {
  if (!hexA || !hexB) return 64;
  const binA = hexToBinary(hexA.trim());
  const binB = hexToBinary(hexB.trim());
  let dist = 0;
  const len = Math.min(binA.length, binB.length);
  for (let i = 0; i < len; i++) {
    if (binA[i] !== binB[i]) dist++;
  }
  dist += Math.abs(binA.length - binB.length);
  return dist;
}

// @desc Upload photo file to IPFS via Pinata
// @route POST /api/photos/upload-ipfs
exports.uploadToIPFS = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided for upload.",
      });
    }

    const { originalname, buffer, mimetype, size } = req.file;

    const ipfsResult = await pinataService.uploadFileToIPFS(buffer, originalname, {
      userId: req.user._id.toString(),
      mimeType: mimetype,
      fileSize: size,
    });

    return res.status(200).json({
      success: true,
      data: {
        ...ipfsResult,
        fileName: originalname,
        fileSize: size,
        mimeType: mimetype,
      },
    });
  } catch (error) {
    console.error("IPFS upload controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload image to IPFS.",
      error: error.message,
    });
  }
};

// @desc Check for duplicate or near-duplicate photo (SHA-256 and pHash)
// @route POST /api/photos/check-duplicate
exports.checkDuplicate = async (req, res) => {
  try {
    const { sha256Hash, pHash } = req.body;

    if (!sha256Hash) {
      return res.status(400).json({
        success: false,
        message: "SHA-256 hash is required for duplicate verification.",
      });
    }

    const normalizedHash = sha256Hash.toLowerCase().trim();

    // 1. Exact SHA-256 duplicate match
    const exactMatch = await Photo.findOne({ sha256Hash: normalizedHash }).populate("owner", "name email");
    if (exactMatch) {
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        type: "exact",
        matchPercentage: 100,
        message: "Exact photo duplicate detected. This cryptographic hash is already registered on-chain.",
        photo: exactMatch,
      });
    }

    // 2. Near-duplicate perceptual hash (pHash) match
    if (pHash) {
      const allPhotos = await Photo.find({}).populate("owner", "name email");
      let closestMatch = null;
      let minDistance = 64;

      for (const photo of allPhotos) {
        if (photo.pHash) {
          const dist = calculateHammingDistance(pHash, photo.pHash);
          if (dist < minDistance) {
            minDistance = dist;
            closestMatch = photo;
          }
        }
      }

      // 64-bit pHash: distance <= 10 indicates high perceptual similarity (>= 84.3%)
      if (closestMatch && minDistance <= 10) {
        const similarityPct = Math.round(((64 - minDistance) / 64) * 100);
        return res.status(200).json({
          success: true,
          isDuplicate: true,
          type: "near",
          hammingDistance: minDistance,
          matchPercentage: similarityPct,
          message: `Near-duplicate photo detected (${similarityPct}% visual similarity, Hamming distance: ${minDistance}/64).`,
          photo: closestMatch,
        });
      }
    }

    return res.status(200).json({
      success: true,
      isDuplicate: false,
      message: "No duplicates found. The photo is unique and ready for registration.",
    });
  } catch (error) {
    console.error("Duplicate check error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying photo uniqueness.",
      error: error.message,
    });
  }
};

// @desc Save photo registration metadata in database
// @route POST /api/photos
exports.savePhoto = async (req, res) => {
  try {
    const {
      title,
      description,
      authorName,
      sha256Hash,
      pHash,
      ipfsCID,
      ipfsUrl,
      txHash,
      blockNumber,
      walletAddress,
      blockchainTimestamp,
      fileSize,
      mimeType,
    } = req.body;

    if (!title || !sha256Hash || !pHash || !ipfsCID || !txHash || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Missing mandatory registration fields (title, sha256Hash, pHash, ipfsCID, txHash, walletAddress).",
      });
    }

    const normalizedHash = sha256Hash.toLowerCase().trim();

    // Check if already in DB
    const existing = await Photo.findOne({ sha256Hash: normalizedHash });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A photo with this cryptographic hash has already been registered.",
        photo: existing,
      });
    }

    const photo = await Photo.create({
      title,
      description: description || "",
      authorName: authorName || req.user.name,
      sha256Hash: normalizedHash,
      pHash,
      ipfsCID,
      ipfsUrl,
      txHash,
      blockNumber: blockNumber || null,
      walletAddress: walletAddress.toLowerCase(),
      owner: req.user._id,
      blockchainTimestamp: blockchainTimestamp || Math.floor(Date.now() / 1000),
      fileSize: fileSize || 0,
      mimeType: mimeType || "image/jpeg",
    });

    return res.status(201).json({
      success: true,
      message: "Photo registration metadata saved successfully.",
      photo,
    });
  } catch (error) {
    console.error("Save photo error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error saving photo registration.",
      error: error.message,
    });
  }
};

// @desc Get all photos registered by current user
// @route GET /api/photos/mine
exports.getMyPhotos = async (req, res) => {
  try {
    const query = {
      $or: [
        { owner: req.user._id },
      ],
    };

    if (req.user.walletAddress) {
      query.$or.push({ walletAddress: req.user.walletAddress.toLowerCase() });
    }

    const photos = await Photo.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: photos.length,
      photos,
    });
  } catch (error) {
    console.error("Get my photos error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user photos.",
      error: error.message,
    });
  }
};

// @desc Get recent photo registrations for public feed/dashboard
// @route GET /api/photos/recent
exports.getRecentPhotos = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const photos = await Photo.find({})
      .populate("owner", "name avatar")
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: photos.length,
      photos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent photos.",
      error: error.message,
    });
  }
};

// @desc Get app and user dashboard statistics
// @route GET /api/photos/stats
exports.getStats = async (req, res) => {
  try {
    const totalPhotos = await Photo.countDocuments();
    let myPhotosCount = 0;

    if (req.user) {
      const query = {
        $or: [{ owner: req.user._id }],
      };
      if (req.user.walletAddress) {
        query.$or.push({ walletAddress: req.user.walletAddress.toLowerCase() });
      }
      myPhotosCount = await Photo.countDocuments(query);
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalPhotos,
        myPhotosCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving statistics.",
    });
  }
};

// @desc Verify photo ownership by SHA-256 hash
// @route GET /api/photos/verify/:hash
exports.verifyPhotoByHash = async (req, res) => {
  try {
    const { hash } = req.params;
    if (!hash) {
      return res.status(400).json({
        success: false,
        message: "Hash parameter is required.",
      });
    }

    const normalizedHash = hash.toLowerCase().trim();
    const photo = await Photo.findOne({ sha256Hash: normalizedHash }).populate("owner", "name email avatar");

    if (!photo) {
      return res.status(404).json({
        success: false,
        isRegistered: false,
        message: "Photo hash is not registered in the system.",
      });
    }

    return res.status(200).json({
      success: true,
      isRegistered: true,
      photo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error verifying photo hash.",
      error: error.message,
    });
  }
};

// @desc Transfer ownership of photo record in DB
// @route PUT /api/photos/transfer
exports.transferPhoto = async (req, res) => {
  try {
    const { sha256Hash, newOwnerWallet, txHash } = req.body;

    if (!sha256Hash || !newOwnerWallet || !txHash) {
      return res.status(400).json({
        success: false,
        message: "sha256Hash, newOwnerWallet, and txHash are required.",
      });
    }

    const photo = await Photo.findOne({ sha256Hash: sha256Hash.toLowerCase().trim() });
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Photo not found.",
      });
    }

    const previousOwner = photo.walletAddress;
    photo.walletAddress = newOwnerWallet.toLowerCase().trim();
    photo.transferHistory.push({
      fromAddress: previousOwner,
      toAddress: newOwnerWallet.toLowerCase().trim(),
      txHash,
      timestamp: new Date(),
    });

    await photo.save();

    return res.status(200).json({
      success: true,
      message: "Ownership record transferred successfully.",
      photo,
    });
  } catch (error) {
    console.error("Transfer photo controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to transfer photo metadata.",
      error: error.message,
    });
  }
};
