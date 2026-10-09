/**
 * Cryptographic utility functions for browser-based hashing & formatting
 */

/**
 * Computes SHA-256 hash of a File or Blob using native Web Crypto API.
 * @param {File|Blob} file
 * @returns {Promise<string>} 64-character hex string (lowercase)
 */
export async function computeSHA256(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hexString = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hexString;
}

/**
 * Formats a clean 64-character hex hash into bytes32 representation (0x prefixed).
 * @param {string} hex
 * @returns {string} 0x...
 */
export function toBytes32(hex) {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  return `0x${clean.padStart(64, "0").slice(0, 64)}`;
}

/**
 * Shortens an Ethereum address for display (e.g. 0x1234...5678)
 * @param {string} address
 * @param {number} chars
 */
export function shortenAddress(address, chars = 4) {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Shortens a cryptographic hash or CID for display
 * @param {string} hash
 * @param {number} chars
 */
export function shortenHash(hash, chars = 6) {
  if (!hash) return "";
  if (hash.length <= chars * 2 + 3) return hash;
  return `${hash.substring(0, chars)}...${hash.substring(hash.length - chars)}`;
}

/**
 * Formats a unix timestamp (seconds or ms) to readable date and time
 * @param {number|string|Date} timestamp
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return "N/A";
  let date;
  if (typeof timestamp === "number") {
    // Check if in seconds (typical blockchain timestamp)
    date = timestamp < 1e12 ? new Date(timestamp * 1000) : new Date(timestamp);
  } else {
    date = new Date(timestamp);
  }
  if (isNaN(date.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

/**
 * Formats file size in bytes to human-readable format
 * @param {number} bytes
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
