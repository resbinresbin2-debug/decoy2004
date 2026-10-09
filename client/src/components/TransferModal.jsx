import React, { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import { toBytes32, shortenAddress } from "../utils/cryptoUtils";
import { SendHorizontal, X, AlertCircle, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import api from "../utils/api";
import { getEtherscanTxUrl } from "../contracts/contractConfig";

export default function TransferModal({ photo, onClose, onSuccess }) {
  const { getContract, account, isConnected, connectWallet, isSepolia, switchToSepolia } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [step, setStep] = useState("form"); // 'form' | 'transacting' | 'success'

  if (!photo) return null;

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError(null);

    if (!ethers.isAddress(recipient)) {
      setError("Please enter a valid Ethereum address (e.g. 0x...).");
      return;
    }

    if (recipient.toLowerCase() === photo.walletAddress.toLowerCase()) {
      setError("Recipient is already the registered owner of this photo.");
      return;
    }

    if (!isConnected) {
      setError("Please connect your MetaMask wallet first.");
      await connectWallet();
      return;
    }

    if (!isSepolia) {
      setError("Please switch your MetaMask network to Ethereum Sepolia Testnet.");
      await switchToSepolia();
      return;
    }

    if (account.toLowerCase() !== photo.walletAddress.toLowerCase()) {
      setError(
        `Only the current on-chain owner (${shortenAddress(photo.walletAddress)}) can transfer this photo. Your connected wallet is ${shortenAddress(account)}.`
      );
      return;
    }

    try {
      setLoading(true);
      setStep("transacting");

      const contract = await getContract(true);
      const photoBytes32 = toBytes32(photo.sha256Hash);

      console.log(`Calling transferOwnership(${photoBytes32}, ${recipient})...`);
      const tx = await contract.transferOwnership(photoBytes32, recipient);
      console.log("Tx sent:", tx.hash);
      setTxHash(tx.hash);

      // Wait for 1 confirmation
      const receipt = await tx.wait(1);
      console.log("Tx confirmed in block:", receipt.blockNumber);

      // Update backend metadata
      await api.put("/photos/transfer", {
        sha256Hash: photo.sha256Hash,
        newOwnerWallet: recipient,
        txHash: tx.hash,
      });

      setStep("success");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Transfer ownership error:", err);
      setError(err.reason || err.message || "Failed to execute transfer on blockchain.");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl border border-slate-700 shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <SendHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Transfer Photo Ownership</h3>
            <p className="text-xs text-slate-400">Permanently transfer on-chain ownership rights</p>
          </div>
        </div>

        {step === "form" && (
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1 text-xs">
              <span className="text-slate-400 block">Photo:</span>
              <span className="text-slate-100 font-semibold text-sm truncate block">{photo.title}</span>
              <span className="text-slate-500 font-mono text-[11px] block truncate">
                Hash: {photo.sha256Hash}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Recipient Ethereum Wallet Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.trim())}
                placeholder="0x71C... or recipient.eth"
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                This transaction triggers an Ethereum smart contract function to permanently reassign ownership.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-semibold bg-brand-500 text-navy-950 hover:bg-brand-400 transition-all disabled:opacity-50"
              >
                <span>Transfer Ownership</span>
              </button>
            </div>
          </form>
        )}

        {step === "transacting" && (
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <Loader2 className="w-12 h-12 text-brand-400 animate-spin" />
            <div>
              <h4 className="text-base font-bold text-white">Broadcasting to Ethereum Sepolia...</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Please confirm the transaction in MetaMask and wait for block inclusion.
              </p>
            </div>
            {txHash && (
              <a
                href={getEtherscanTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-400 hover:underline flex items-center space-x-1 font-mono"
              >
                <span>View on Etherscan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {step === "success" && (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Ownership Transferred!</h4>
              <p className="text-xs text-slate-300 mt-1">
                New on-chain owner: <span className="font-mono text-brand-400">{shortenAddress(recipient)}</span>
              </p>
            </div>
            {txHash && (
              <a
                href={getEtherscanTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:underline flex items-center space-x-1 font-mono"
              >
                <span>Sepolia Tx: {shortenAddress(txHash, 8)}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
