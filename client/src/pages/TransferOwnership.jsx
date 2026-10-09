import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { toBytes32, shortenAddress, shortenHash } from "../utils/cryptoUtils";
import api from "../utils/api";
import {
  SendHorizontal,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Wallet,
  ArrowRight,
  ImageIcon,
} from "lucide-react";
import { getEtherscanTxUrl } from "../contracts/contractConfig";

export default function TransferOwnership() {
  const { user } = useAuth();
  const { account, isConnected, isSepolia, connectWallet, switchToSepolia, getContract } = useWallet();

  const [myPhotos, setMyPhotos] = useState([]);
  const [selectedHash, setSelectedHash] = useState("");
  const [customHash, setCustomHash] = useState("");
  const [recipient, setRecipient] = useState("");

  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUserPhotos = async () => {
      try {
        setLoadingPhotos(true);
        const res = await api.get("/photos/mine");
        if (res.data?.photos) {
          setMyPhotos(res.data.photos);
          if (res.data.photos.length > 0) {
            setSelectedHash(res.data.photos[0].sha256Hash);
          }
        }
      } catch (err) {
        console.error("Error fetching photos for transfer:", err);
      } finally {
        setLoadingPhotos(false);
      }
    };

    fetchUserPhotos();
  }, []);

  const activeHash = selectedHash === "custom" ? customHash.trim() : selectedHash;
  const currentSelectedPhoto = myPhotos.find((p) => p.sha256Hash === selectedHash);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setTxHash(null);

    if (!activeHash) {
      setError("Please select or enter a photo hash to transfer.");
      return;
    }

    if (!ethers.isAddress(recipient)) {
      setError("Recipient must be a valid Ethereum address (0x...).");
      return;
    }

    if (isConnected && recipient.toLowerCase() === account.toLowerCase()) {
      setError("Recipient cannot be your own currently connected address.");
      return;
    }

    if (!isConnected) {
      try {
        await connectWallet();
      } catch (err) {
        setError("MetaMask connection is required.");
        return;
      }
    }

    if (!isSepolia) {
      try {
        await switchToSepolia();
      } catch (err) {
        setError("Please switch your wallet network to Ethereum Sepolia.");
        return;
      }
    }

    try {
      setIsTransferring(true);
      const contract = await getContract(true);
      const photoBytes32 = toBytes32(activeHash);

      console.log(`[Contract] Executing transferOwnership(${photoBytes32}, ${recipient})...`);
      const tx = await contract.transferOwnership(photoBytes32, recipient);
      setTxHash(tx.hash);

      const receipt = await tx.wait(1);
      console.log("[Contract] Transfer confirmed in block:", receipt.blockNumber);

      // Sync backend
      try {
        await api.put("/photos/transfer", {
          sha256Hash: activeHash,
          newOwnerWallet: recipient,
          txHash: tx.hash,
        });
      } catch (dbErr) {
        console.warn("Backend metadata sync notice:", dbErr.message);
      }

      setSuccess(true);
      // Remove or update transferred photo in local state
      setMyPhotos((prev) => prev.filter((p) => p.sha256Hash !== activeHash));
    } catch (err) {
      console.error("Transfer error:", err);
      setError(err.reason || err.message || "Failed to execute ownership transfer.");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Transfer Photo Ownership
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Legally and cryptographically transfer full ownership of a registered photo to another Ethereum wallet.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-glow">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ownership Successfully Transferred!</h2>
              <p className="text-sm text-slate-300 mt-1">
                The smart contract has reassigned ownership rights to{" "}
                <span className="font-mono text-brand-300">{shortenAddress(recipient, 6)}</span>.
              </p>
            </div>
            {txHash && (
              <a
                href={getEtherscanTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-mono text-indigo-400 hover:underline"
              >
                <span>View Confirmation on Etherscan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <div className="pt-2">
              <button
                onClick={() => {
                  setSuccess(false);
                  setRecipient("");
                  setTxHash(null);
                }}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-navy-950 hover:bg-brand-400 transition-colors"
              >
                Transfer Another Work
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleTransfer} className="space-y-6">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Choose Photo */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Select Photo to Transfer
              </label>

              {loadingPhotos ? (
                <div className="p-4 bg-slate-900 rounded-xl text-xs text-slate-400 flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                  <span>Loading your registered photos...</span>
                </div>
              ) : myPhotos.length > 0 ? (
                <div className="space-y-3">
                  <select
                    value={selectedHash}
                    onChange={(e) => setSelectedHash(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                  >
                    {myPhotos.map((photo) => (
                      <option key={photo.sha256Hash} value={photo.sha256Hash}>
                        {photo.title} ({shortenHash(photo.sha256Hash, 4)})
                      </option>
                    ))}
                    <option value="custom">-- Enter custom SHA-256 hash --</option>
                  </select>

                  {/* Selected Preview Snippet */}
                  {currentSelectedPhoto && (
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center space-x-3">
                      {currentSelectedPhoto.ipfsUrl && (
                        <img
                          src={currentSelectedPhoto.ipfsUrl}
                          alt={currentSelectedPhoto.title}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                        />
                      )}
                      <div className="min-w-0 text-xs">
                        <span className="font-bold text-white block truncate">
                          {currentSelectedPhoto.title}
                        </span>
                        <span className="text-slate-400 font-mono block truncate">
                          Current Owner: {shortenAddress(currentSelectedPhoto.walletAddress)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-amber-400">
                    No photos found in your gallery. You can manually specify a SHA-256 hash below:
                  </p>
                  <input
                    type="text"
                    value={customHash}
                    onChange={(e) => {
                      setSelectedHash("custom");
                      setCustomHash(e.target.value);
                    }}
                    placeholder="Enter 64-character SHA-256 hash"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-slate-100"
                  />
                </div>
              )}

              {selectedHash === "custom" && myPhotos.length > 0 && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customHash}
                    onChange={(e) => setCustomHash(e.target.value)}
                    placeholder="Enter 64-character SHA-256 hash"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-slate-100"
                  />
                </div>
              )}
            </div>

            {/* Recipient Wallet */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Recipient Ethereum Wallet Address *
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.trim())}
                placeholder="0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5"
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Warning: Once transferred on the Ethereum blockchain, you will no longer be able to
                manage or re-transfer this photo unless the recipient transfers it back.
              </p>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isTransferring}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-brand-500 text-navy-950 hover:brightness-110 shadow-glow transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transacting on Ethereum Sepolia...</span>
                  </>
                ) : (
                  <>
                    <SendHorizontal className="w-4 h-4" />
                    <span>Execute Blockchain Ownership Transfer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
