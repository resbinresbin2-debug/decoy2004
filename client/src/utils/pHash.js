/**
 * Browser-based Perceptual Hash (pHash) implementation using HTML5 Canvas & 2D DCT.
 * Yields a robust 64-bit perceptual fingerprint (16 hexadecimal characters).
 */

/**
 * Loads an image File or Data URL into an HTMLImageElement
 * @param {File|Blob|string} source
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error("Failed to load image for pHash processing"));

    if (typeof source === "string") {
      img.src = source;
    } else {
      const url = URL.createObjectURL(source);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.src = url;
    }
  });
}

/**
 * Computes 1D Discrete Cosine Transform
 */
function applyDCT1D(vector) {
  const N = vector.length;
  const result = new Float64Array(N);
  const factor = Math.PI / N;

  for (let k = 0; k < N; k++) {
    let sum = 0;
    for (let n = 0; n < N; n++) {
      sum += vector[n] * Math.cos(factor * (n + 0.5) * k);
    }
    const c = k === 0 ? 1 / Math.sqrt(2) : 1;
    result[k] = sum * c * Math.sqrt(2 / N);
  }
  return result;
}

/**
 * Computes 2D Discrete Cosine Transform on 32x32 matrix
 */
function applyDCT2D(matrix, size = 32) {
  const rows = [];
  for (let i = 0; i < size; i++) {
    rows.push(applyDCT1D(matrix[i]));
  }

  const result = [];
  for (let i = 0; i < size; i++) {
    result.push(new Float64Array(size));
  }

  for (let j = 0; j < size; j++) {
    const col = new Float64Array(size);
    for (let i = 0; i < size; i++) {
      col[i] = rows[i][j];
    }
    const dctCol = applyDCT1D(col);
    for (let i = 0; i < size; i++) {
      result[i][j] = dctCol[i];
    }
  }

  return result;
}

/**
 * Computes the 64-bit pHash of an image
 * @param {File|Blob|string} imageSource
 * @returns {Promise<string>} 16-character hexadecimal hash
 */
export async function computePHash(imageSource) {
  try {
    const img = await loadImage(imageSource);
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      throw new Error("Unable to initialize canvas 2d context");
    }

    // Draw and downscale image to 32x32
    ctx.drawImage(img, 0, 0, 32, 32);
    const imgData = ctx.getImageData(0, 0, 32, 32).data;

    // Convert to grayscale 32x32 2D array
    const grayMatrix = [];
    for (let y = 0; y < 32; y++) {
      const row = new Float64Array(32);
      for (let x = 0; x < 32; x++) {
        const idx = (y * 32 + x) * 4;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        // Luminance calculation
        row[x] = 0.299 * r + 0.587 * g + 0.114 * b;
      }
      grayMatrix.push(row);
    }

    // Apply 2D DCT
    const dct = applyDCT2D(grayMatrix, 32);

    // Extract top-left 8x8 low frequency matrix (excluding DC component [0][0] for mean calculation)
    const lowFreq = [];
    let sum = 0;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const val = dct[y][x];
        lowFreq.push(val);
        if (x !== 0 || y !== 0) {
          sum += val;
        }
      }
    }

    // Average value of the 63 AC components
    const average = sum / 63;

    // Build 64-bit binary string
    let binary = "";
    for (let i = 0; i < 64; i++) {
      binary += lowFreq[i] > average ? "1" : "0";
    }

    // Convert 64-bit binary to 16 hex characters
    let hex = "";
    for (let i = 0; i < 64; i += 4) {
      const nibble = binary.substr(i, 4);
      hex += parseInt(nibble, 2).toString(16);
    }

    return hex.toLowerCase();
  } catch (error) {
    console.error("pHash computation error:", error);
    // Fallback pseudo pHash
    return "0000000000000000";
  }
}

/**
 * Calculates Hamming distance between two 16-character hex pHash strings
 * @param {string} hashA
 * @param {string} hashB
 * @returns {number} Distance between 0 (identical) and 64 (completely different)
 */
export function calculateHammingDistance(hashA, hashB) {
  if (!hashA || !hashB) return 64;

  const hexToBin = (hex) => {
    let bin = "";
    for (let i = 0; i < hex.length; i++) {
      bin += parseInt(hex[i], 16).toString(2).padStart(4, "0");
    }
    return bin;
  };

  const binA = hexToBin(hashA.trim());
  const binB = hexToBin(hashB.trim());

  let distance = 0;
  const len = Math.min(binA.length, binB.length);
  for (let i = 0; i < len; i++) {
    if (binA[i] !== binB[i]) distance++;
  }
  distance += Math.abs(binA.length - binB.length);
  return distance;
}

/**
 * Converts Hamming distance to percentage similarity
 * @param {number} distance
 * @returns {number} 0 to 100 percentage
 */
export function getSimilarityPercentage(distance) {
  const sim = ((64 - distance) / 64) * 100;
  return Math.max(0, Math.min(100, Math.round(sim)));
}
