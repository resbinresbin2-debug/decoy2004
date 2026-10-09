import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { computeSHA256, toBytes32, formatDateTime, shortenAddress } from "../utils/cryptoUtils";
import { computePHash } from "../utils/pHash";
import api from "../utils/api";
import {
  ShieldCheck,
  ShieldAlert,
  UploadCloud,
  Search,
  FileCheck2,
  ExternalLink,
  Calendar,
  User,
  Key,
  Layers,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import { getEtherscanTxUrl, getEtherscanAddressUrl } from "../contracts/contractConfig";

export default function VerifyOwnership() {
  const [searchParams] = useSearchParams();
  const { getContract } = useWallet();

  const [inputMode, setInputMode] = useState("upload"); // 'upload' | 'hash'
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [manualHash, setManualHash] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // Auto-verify if hash is in URL query parameter
  useEffect(() => {
    const urlHash = searchParams.get("hash");
    if (urlHash) {
      setInputMode("hash");
      setManualHash(urlHash);
      handleVerifyByHash(urlHash);
    }
  }, [searchParams]);

  const handleFileSelected = async (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setVerificationResult(null);

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    try {
      setIsVerifying(true);
      const [sha, perceptual] = await Promise.all([
        computeSHA256(selectedFile),
        computePHash(selectedFile),
      ]);

      await performVerification(sha, perceptual);
    } catch (err) {
      console.error("Verification file error:", err);
      setError("Failed to process image cryptographic fingerprint.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyByHash = async (hashToVerify) => {
    const target = (hashToVerify || manualHash).trim();
    if (!target) {
      setError("Please enter a SHA-256 cryptographic hash.");
      return;
    }

    setError(null);
    setVerificationResult(null);

    try {
      setIsVerifying(true);
      await performVerification(target, null);
    } catch (err) {
      console.error("Verification hash error:", err);
      setError("Failed to query verification records.");
    } finally {
      setIsVerifying(false);
    }
  };

  const performVerification = async (sha, perceptual) => {
    const cleanSha = sha.startsWith("0x") ? sha.slice(2).toLowerCase() : sha.toLowerCase();

    let dbPhoto = null;
    let nearMatch = null;
    let onChainRecord = null;

    // 1. Check Backend Database
    try {
      const res = await api.get(`/photos/verify/${cleanSha}`);
      if (res.data?.photo) {
        dbPhoto = res.data.photo;
      }
    } catch (dbErr) {
      // If not exact in DB, check for duplicate / near match if pHash is present
      if (perceptual) {
        try {
          const dupRes = await api.post("/photos/check-duplicate", {
            sha256Hash: cleanSha,
            pHash: perceptual,
          });
          if (dupRes.data?.isDuplicate && dupRes.data.photo) {
            nearMatch = {
              photo: dupRes.data.photo,
              similarity: dupRes.data.matchPercentage,
              distance: dupRes.data.hammingDistance,
            };
          }
        } catch (e) {
          // ignore
        }
      }
    }

    // 2. Query Smart Contract directly via RPC for on-chain verification
    try {
      const contract = await getContract(false);
      const photoBytes32 = toBytes32(cleanSha);
      const [owner, timestamp, ipfsCID, isRegistered] = await contract.verifyPhoto(photoBytes32);

      if (isRegistered) {
        onChainRecord = {
          owner,
          timestamp: Number(timestamp),
          ipfsCID,
        };
      }
    } catch (chainErr) {
      console.log("On-chain direct query note:", chainErr.message);
    }

    const isVerified = Boolean(dbPhoto || onChainRecord);

    setVerificationResult({
      hash: cleanSha,
      isVerified,
      dbPhoto,
      nearMatch,
      onChainRecord,
      owner: onChainRecord?.owner || dbPhoto?.walletAddress,
      timestamp: onChainRecord?.timestamp || dbPhoto?.blockchainTimestamp || dbPhoto?.createdAt,
      ipfsCID: onChainRecord?.ipfsCID || dbPhoto?.ipfsCID,
      txHash: dbPhoto?.txHash,
    });
  };

  const resetAll = () => {
    setFile(null);
    setPreviewUrl(null);
    setManualHash("");
    setVerificationResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Independent Blockchain Provenance Inspector</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Verify Photo Ownership
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Verify whether any digital image is cryptographically anchored to an Ethereum wallet and
          confirm its immutable registration date.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex justify-center">
        <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex space-x-1">
          <button
            onClick={() => {
              setInputMode("upload");
              resetAll();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              inputMode === "upload"
                ? "bg-brand-500 text-navy-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Upload Photo File
          </button>
          <button
            onClick={() => {
              setInputMode("hash");
              resetAll();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              inputMode === "hash"
                ? "bg-brand-500 text-navy-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Paste SHA-256 Hash
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        {inputMode === "upload" ? (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-brand-500/50 bg-slate-900/40 rounded-2xl p-8 text-center cursor-pointer transition-colors"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelected(e.target.files[0])}
                accept="image/*"
                className="hidden"
              />

              {previewUrl ? (
                <div className="space-y-3">
                  <img
                    src={previewUrl}
                    alt="Inspection Preview"
                    className="max-h-56 mx-auto rounded-xl object-contain border border-slate-700 shadow-lg"
                  />
                  <p className="text-xs text-brand-400 font-mono">
                    {file?.name} (Click to select another)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Click to upload an image to verify
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Computed client-side: the image never leaves your browser for hash generation
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block text-xs font-medium text-slate-300">
              Paste Image SHA-256 Hash
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualHash}
                onChange={(e) => setManualHash(e.target.value)}
                placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                onClick={() => handleVerifyByHash()}
                disabled={isVerifying || !manualHash}
                className="px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-navy-950 font-semibold text-sm rounded-xl transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Inspect</span>
              </button>
            </div>
          </div>
        )}

        {isVerifying && (
          <div className="py-6 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            <p className="text-xs font-medium text-slate-300">
              Querying Ethereum Sepolia smart contract & cryptographic registry...
            </p>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}
      </div>

      {/* Verification Result Card */}
      {verificationResult && (
        <div
          className={`glass-panel rounded-2xl border p-6 sm:p-8 space-y-6 animate-fade-in ${
            verificationResult.isVerified
              ? "border-emerald-500/40 bg-emerald-950/10 shadow-glow"
              : "border-rose-500/40 bg-rose-950/10"
          }`}
        >
          {/* Status Header Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              {verificationResult.isVerified ? (
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <XCircle className="w-7 h-7" />
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xl font-black uppercase tracking-wide ${
                      verificationResult.isVerified ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {verificationResult.isVerified ? "Verified On-Chain" : "Not Registered"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {verificationResult.isVerified
                    ? "Cryptographic proof confirmed on Ethereum Sepolia."
                    : "No matching photo registration found on the Ethereum blockchain."}
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400">
              Hash: {shortenAddress(verificationResult.hash, 8)}
            </div>
          </div>

          {/* Verified Details */}
          {verificationResult.isVerified ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Legitimate Owner Wallet:</span>
                  <a
                    href={getEtherscanAddressUrl(verificationResult.owner)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-300 font-bold hover:underline flex items-center space-x-1 break-all"
                  >
                    <span>{verificationResult.owner}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Registration Timestamp:</span>
                  <span className="text-slate-100 font-bold block">
                    {formatDateTime(verificationResult.timestamp)}
                  </span>
                </div>

                {verificationResult.ipfsCID && (
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1 md:col-span-2">
                    <span className="text-slate-400 block text-[11px]">IPFS Content Identifier (CID):</span>
                    <span className="text-slate-200 break-all block">
                      {verificationResult.ipfsCID}
                    </span>
                  </div>
                )}

                {verificationResult.txHash && (
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1 md:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Ethereum Transaction Hash:</span>
                    <a
                      href={getEtherscanTxUrl(verificationResult.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:underline flex items-center space-x-1 break-all"
                    >
                      <span>{verificationResult.txHash}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {verificationResult.dbPhoto && (
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center space-x-4">
                  {verificationResult.dbPhoto.ipfsUrl && (
                    <img
                      src={verificationResult.dbPhoto.ipfsUrl}
                      alt={verificationResult.dbPhoto.title}
                      className="w-16 h-16 rounded-lg object-cover border border-slate-700"
                    />
                  )}
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {verificationResult.dbPhoto.title}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Author: {verificationResult.dbPhoto.authorName || "Anonymous Creator"}
                    </p>
                    {verificationResult.dbPhoto.description && (
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {verificationResult.dbPhoto.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Unregistered view + check if near-match found */
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                This exact image hash has not been registered on the blockchain. You can register it to
                establish priority and proof of copyright ownership.
              </p>

              {verificationResult.nearMatch && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold">
                    <Layers className="w-4 h-4" />
                    <span>
                      Potential Near-Duplicate Detected ({verificationResult.nearMatch.similarity}% Visual Similarity)
                    </span>
                  </div>
                  <p className="text-slate-300">
                    A visually similar photo is registered on-chain to wallet{" "}
                    <span className="font-mono text-brand-300">
                      {shortenAddress(verificationResult.nearMatch.photo.walletAddress)}
                    </span>{" "}
                    registered on{" "}
                    {formatDateTime(
                      verificationResult.nearMatch.photo.blockchainTimestamp ||
                        verificationResult.nearMatch.photo.createdAt
                    )}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
