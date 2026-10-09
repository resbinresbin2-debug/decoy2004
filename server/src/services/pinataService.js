const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

class PinataService {
  constructor() {
    this.apiKey = process.env.PINATA_API_KEY;
    this.apiSecret = process.env.PINATA_API_SECRET;
    this.jwt = process.env.PINATA_JWT;
    this.gatewayUrl = process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";
  }

  hasPinataCredentials() {
    return Boolean(this.jwt || (this.apiKey && this.apiSecret));
  }

  /**
   * Upload buffer / stream to Pinata IPFS
   * @param {Buffer} fileBuffer
   * @param {string} fileName
   * @param {object} metadata
   * @returns {Promise<{ cid: string, ipfsUrl: string }>}
   */
  async uploadFileToIPFS(fileBuffer, fileName, metadata = {}) {
    if (this.hasPinataCredentials()) {
      try {
        const formData = new FormData();
        formData.append("file", fileBuffer, { filename: fileName });

        const pinataMetadata = JSON.stringify({
          name: fileName || "photoproof-image",
          keyvalues: {
            app: "PhotoProof",
            uploadedAt: new Date().toISOString(),
            ...metadata,
          },
        });
        formData.append("pinataMetadata", pinataMetadata);

        const pinataOptions = JSON.stringify({
          cidVersion: 0,
        });
        formData.append("pinataOptions", pinataOptions);

        const headers = {
          ...formData.getHeaders(),
        };

        if (this.jwt) {
          headers.Authorization = `Bearer ${this.jwt}`;
        } else {
          headers.pinata_api_key = this.apiKey;
          headers.pinata_secret_api_key = this.apiSecret;
        }

        const response = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          formData,
          {
            maxBodyLength: "Infinity",
            headers,
            timeout: 60000,
          }
        );

        const cid = response.data.IpfsHash;
        return {
          cid,
          ipfsUrl: `${this.gatewayUrl}/${cid}`,
          isMock: false,
        };
      } catch (error) {
        console.error("[Pinata] Error uploading to Pinata:", error.response?.data || error.message);
        console.warn("[Pinata] Falling back to local IPFS simulation mode...");
      }
    }

    // Local / Dev Fallback: Create deterministic mock CID from content hash
    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    // Format pseudo IPFS CID (base58-like string)
    const mockCID = `Qm${hash.substring(0, 44)}`;

    // Store local upload in /uploads for dev preview
    const uploadsDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const safeFilename = `${mockCID}-${fileName || "image.jpg"}`;
    fs.writeFileSync(path.join(uploadsDir, safeFilename), fileBuffer);

    return {
      cid: mockCID,
      ipfsUrl: `/uploads/${safeFilename}`,
      isMock: true,
      message: "Pinned using local storage simulation. Configure Pinata API keys in .env for live IPFS pinning.",
    };
  }
}

module.exports = new PinataService();
