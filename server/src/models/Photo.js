const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    authorName: {
      type: String,
      trim: true,
      default: "Anonymous Creator",
    },
    sha256Hash: {
      type: String,
      required: [true, "SHA-256 hash is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    pHash: {
      type: String,
      required: [true, "Perceptual hash (pHash) is required"],
      trim: true,
      index: true,
    },
    ipfsCID: {
      type: String,
      required: [true, "IPFS CID is required"],
      trim: true,
    },
    ipfsUrl: {
      type: String,
      required: true,
    },
    txHash: {
      type: String,
      required: [true, "Transaction hash is required"],
      trim: true,
    },
    blockNumber: {
      type: Number,
      default: null,
    },
    walletAddress: {
      type: String,
      required: [true, "Owner wallet address is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: "image/jpeg",
    },
    blockchainTimestamp: {
      type: Number,
      default: null,
    },
    transferHistory: [
      {
        fromAddress: String,
        toAddress: String,
        txHash: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Helpful index for owner and pHash queries
photoSchema.index({ owner: 1, createdAt: -1 });

const Photo = mongoose.model("Photo", photoSchema);

module.exports = Photo;
