import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { computeSHA256, toBytes32, formatDateTime, shortenAddress, formatBytes } from "../utils/cryptoUtils";
import { computePHash } from "../utils/pHash";
import api from "../utils/api";
import {
  UploadCloud,
  FileImage,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink,
  Loader2,
  Fingerprint,
  Layers,
  ArrowRight,
  Wallet,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";
import { getEtherscanTxUrl } from "../contracts/contractConfig";

export default function RegisterPhoto() {
  const { user } = useAuth();
  const { account, isConnected, isSepolia, connectWallet, switchToSepolia, getContract } = useWallet();
  const navigate = useNavigate();

  // Form State
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [authorName, setAuthorName] = useState(user?.name || "");

  // Crypto Computation State
  const [isHashing, setIsHashing] = useState(false);
  const [sha256Hash, setSha256Hash] = useState("");
  const [pHash, setPHash] = useState("");

  // Duplicate Check State
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState(null);

  // Registration Execution State
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentStep, setCurrentStep] = useState(""); // 'ipfs' | 'metamask' | 'saving' | 'complete'
  const [txHash, setTxHash] = useState(null);
  const [registeredPhoto, setRegisteredPhoto] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Update default authorName when user loads
  useEffect(() => {
    if (user?.name && !authorName) {
      setAuthorName(user.name);
    }
  }, [user]);

  // Handle file selection
  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setDuplicateResult(null);
    setTxHash(null);
    setRegisteredPhoto(null);

    // Auto title if empty
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName);
    }

    // Set preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Compute browser hashes (SHA-256 and pHash)
    try {
      setIsHashing(true);
      const [sha, perceptual] = await Promise.all([
        computeSHA256(selectedFile),
        computePHash(selectedFile),
      ]);

      setSha256Hash(sha);
      setPHash(perceptual);

      // Trigger server duplicate check
      await runDuplicateCheck(sha, perceptual);
    } catch (err) {
      console.error("Hashing failed:", err);
      setError("Failed to compute cryptographic hashes in browser.");
    } finally {
      setIsHashing(false);
    }
  };

  const runDuplicateCheck = async (sha, perceptual) => {
    try {
      setIsCheckingDuplicate(true);
      const res = await api.post("/photos/check-duplicate", {
        sha256Hash: sha,
        pHash: perceptual,
      });

      if (res.data.isDuplicate) {
        setDuplicateResult(res.data);
      } else {
        setDuplicateResult(null);
      }
    } catch (err) {
      console.warn("Duplicate check server warning:", err.message);
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Final submit: Upload to IPFS + Ethereum Sepolia Smart Contract + MongoDB Save
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!file || !sha256Hash || !pHash) {
      setError("Please select an image and wait for hash computation.");
      return;
    }

    if (duplicateResult && duplicateResult.type === "exact") {
      setError("Cannot register: This exact photo is already registered on-chain.");
      return;
    }

    // 1. Ensure Wallet Connection
    let activeAccount = account;
    if (!isConnected) {
      try {
        activeAccount = await connectWallet();
        if (!activeAccount) {
          setError("MetaMask connection is required to record photo ownership on-chain.");
          return;
        }
      } catch (err) {
        setError("Failed to connect MetaMask: " + err.message);
        return;
      }
    }

    if (!isSepolia) {
      try {
        await switchToSepolia();
      } catch (err) {
        setError("Please switch your MetaMask network to Ethereum Sepolia Testnet.");
        return;
      }
    }

    try {
      setIsRegistering(true);

      // STEP 1: Upload image file to Pinata IPFS
      setCurrentStep("ipfs");
      const formData = new FormData();
      formData.append("image", file);

      const ipfsRes = await api.post("/photos/upload-ipfs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { cid, ipfsUrl } = ipfsRes.data.data;
      console.log("[IPFS] Uploaded successfully, CID:", cid);

      // STEP 2: Call Smart Contract registerPhoto(bytes32, string)
      setCurrentStep("metamask");
      const contract = await getContract(true);
      const photoBytes32 = toBytes32(sha256Hash);

      console.log(`[Contract] Calling registerPhoto(${photoBytes32}, ${cid})...`);
      const tx = await contract.registerPhoto(photoBytes32, cid);
      setTxHash(tx.hash);

      console.log("[Contract] Transaction broadcasted:", tx.hash);
      const receipt = await tx.wait(1);
      console.log("[Contract] Transaction confirmed in block:", receipt.blockNumber);

      // STEP 3: Save Photo Metadata in MongoDB
      setCurrentStep("saving");
      const photoData = {
        title,
        description,
        authorName: authorName || user?.name || "Anonymous Creator",
        sha256Hash,
        pHash,
        ipfsCID: cid,
        ipfsUrl,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        walletAddress: activeAccount,
        fileSize: file.size,
        mimeType: file.type,
      };

      const saveRes = await api.post("/photos", photoData);
      setRegisteredPhoto(saveRes.data.photo);
      setCurrentStep("complete");
    } catch (err) {
      console.error("Photo registration error:", err);
      setError(
        err.reason ||
          err.response?.data?.message ||
          err.message ||
          "An error occurred during photo registration."
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setTitle("");
    setDescription("");
    setSha256Hash("");
    setPHash("");
    setDuplicateResult(null);
    setCurrentStep("");
    setTxHash(null);
    setRegisteredPhoto(null);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Register Photo Proof
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Anchor your photo's SHA-256 fingerprint, perceptual hash, and IPFS storage directly onto Ethereum Sepolia.
        </p>
      </div>

      {/* Completion View */}
      {currentStep === "complete" && registeredPhoto ? (
        <div className="glass-panel p-8 rounded-2xl border border-brand-500/40 shadow-2xl text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-glow">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">Photo Ownership Immutably Recorded!</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-lg mx-auto">
              Your photo is now permanently registered on the Ethereum blockchain. A cryptographic proof
              has been minted to your wallet address.
            </p>
          </div>

          <div className="max-w-xl mx-auto p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-left space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Photo Title:</span>
              <span className="text-slate-200 font-sans font-bold">{registeredPhoto.title}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Owner Wallet:</span>
              <span className="text-brand-300">{shortenAddress(registeredPhoto.walletAddress, 6)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">SHA-256 Hash:</span>
              <span className="text-brand-400 truncate max-w-xs">{registeredPhoto.sha256Hash}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">IPFS CID:</span>
              <span className="text-slate-300 truncate max-w-xs">{registeredPhoto.ipfsCID}</span>
            </div>
            <div className="flex justify-between py-1 items-center">
              <span className="text-slate-500">Sepolia Tx:</span>
              <a
                href={getEtherscanTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <span>{shortenAddress(txHash, 8)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/gallery"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-navy-950 hover:bg-brand-400 transition-all shadow-glow"
            >
              View in My Gallery
            </Link>
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Register Another Photo
            </button>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-3 text-xs sm:text-sm text-rose-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Registration Error</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-brand-400 bg-brand-500/10 scale-[1.01]"
                : file
                ? "border-brand-500/40 bg-slate-900/60"
                : "border-slate-700 bg-slate-900/30 hover:border-brand-500/40 hover:bg-slate-900/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-72 mx-auto rounded-xl object-contain border border-slate-700 shadow-xl"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="absolute -top-3 -right-3 p-1.5 bg-slate-800 hover:bg-rose-600 text-white rounded-full shadow-lg transition-colors"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-center space-x-3 font-mono">
                  <span>{file.name}</span>
                  <span>•</span>
                  <span>{formatBytes(file.size)}</span>
                  <span>•</span>
                  <span className="text-brand-400">Click to change</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 mx-auto shadow-glow">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-200">
                    Drag and drop your photo here, or{" "}
                    <span className="text-brand-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports high-resolution JPG, PNG, WebP up to 25MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Browser Cryptographic Verification Panel */}
          {file && (
            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-brand-400 font-semibold text-sm">
                  <Fingerprint className="w-4 h-4" />
                  <span>Browser-Computed Cryptographic Fingerprints</span>
                </div>
                {isHashing && (
                  <span className="text-xs text-brand-300 flex items-center space-x-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Computing hashes...</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {/* SHA-256 */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold">SHA-256 Hash (Exact ID):</span>
                    <span className="text-[10px] text-slate-500">256-bit</span>
                  </div>
                  <div className="text-brand-300 break-all select-all text-[11px]">
                    {sha256Hash || "Computing..."}
                  </div>
                </div>

                {/* pHash */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold">Perceptual Hash (pHash):</span>
                    <span className="text-[10px] text-slate-500">64-bit DCT</span>
                  </div>
                  <div className="text-teal-300 break-all select-all text-[11px]">
                    {pHash || "Computing..."}
                  </div>
                </div>
              </div>

              {/* Duplicate Detection Alert */}
              {isCheckingDuplicate ? (
                <div className="p-3 bg-slate-900/60 rounded-lg flex items-center space-x-2 text-xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                  <span>Checking database for duplicates & near-duplicates...</span>
                </div>
              ) : duplicateResult ? (
                <div
                  className={`p-4 rounded-xl border flex items-start space-x-3 text-xs ${
                    duplicateResult.type === "exact"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <span className="font-bold block text-sm">
                      {duplicateResult.type === "exact"
                        ? "Exact Duplicate Detected!"
                        : `Near-Duplicate Image Detected (${duplicateResult.matchPercentage}% visual similarity)`}
                    </span>
                    <p className="text-xs opacity-90 leading-relaxed">
                      {duplicateResult.message}
                    </p>
                    {duplicateResult.photo && (
                      <div className="mt-2 pt-2 border-t border-current/20 font-mono text-[11px] space-y-1">
                        <div>
                          <strong>Registered Owner:</strong>{" "}
                          {shortenAddress(duplicateResult.photo.walletAddress, 6)} (
                          {duplicateResult.photo.authorName || "Creator"})
                        </div>
                        <div>
                          <strong>Registered On:</strong>{" "}
                          {formatDateTime(
                            duplicateResult.photo.blockchainTimestamp ||
                              duplicateResult.photo.createdAt
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center space-x-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Uniqueness confirmed: No exact or near-duplicates found.</span>
                </div>
              )}
            </div>
          )}

          {/* Metadata Inputs */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Metadata & Copyright Declaration</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Photo Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunset over Golden Gate"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Author / Creator Name *
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Satoshi Nakamoto"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description / Provenance Notes (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Camera model, location, or additional copyright information..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Wallet & Registration Trigger */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isConnected ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                }`}
              >
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Signer Wallet</span>
                {isConnected ? (
                  <span className="text-sm font-mono font-bold text-white">
                    {shortenAddress(account, 6)}
                  </span>
                ) : (
                  <span className="text-xs text-amber-400">Not Connected</span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {!isConnected ? (
                <button
                  type="button"
                  onClick={connectWallet}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-navy-950 hover:bg-brand-400 transition-all shadow-glow flex items-center justify-center space-x-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect MetaMask</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={
                    isRegistering ||
                    !file ||
                    isHashing ||
                    (duplicateResult && duplicateResult.type === "exact")
                  }
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-brand-500 text-navy-950 hover:brightness-110 shadow-glow transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {currentStep === "ipfs"
                          ? "Uploading to IPFS..."
                          : currentStep === "metamask"
                          ? "Confirming on Sepolia..."
                          : "Finalizing..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Register on Blockchain</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
