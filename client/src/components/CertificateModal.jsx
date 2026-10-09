import React, { useState } from "react";
import { X, Download, ShieldCheck, ExternalLink, Calendar, User, FileText, CheckCircle2 } from "lucide-react";
import { generateOwnershipCertificate } from "../utils/pdfGenerator";
import { formatDateTime, shortenAddress, shortenHash } from "../utils/cryptoUtils";
import { getEtherscanTxUrl } from "../contracts/contractConfig";

export default function CertificateModal({ photo, onClose }) {
  const [downloading, setDownloading] = useState(false);

  if (!photo) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await generateOwnershipCertificate(photo);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Error generating PDF certificate: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl border border-brand-500/30 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-glow">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Certificate of Blockchain Ownership
            </h3>
            <p className="text-xs text-slate-400">
              Cryptographically verified on Ethereum Sepolia Testnet
            </p>
          </div>
        </div>

        {/* Certificate Card Preview */}
        <div className="border-2 border-dashed border-brand-500/30 rounded-xl p-5 bg-slate-900/60 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {photo.ipfsUrl && (
              <img
                src={photo.ipfsUrl}
                alt={photo.title}
                className="w-full sm:w-40 h-40 object-cover rounded-lg border border-slate-700 shadow-md"
              />
            )}
            <div className="space-y-2.5 flex-1 min-w-0">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-400">Title</span>
                <h4 className="text-lg font-bold text-slate-100 truncate">{photo.title}</h4>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Creator / Author</span>
                <p className="text-sm font-medium text-slate-200">{photo.authorName || "Anonymous Creator"}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Owner Wallet</span>
                <p className="text-xs font-mono text-brand-300 break-all">{photo.walletAddress}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Registered Timestamp:</span>
              <span className="text-slate-200 font-mono">
                {formatDateTime(photo.blockchainTimestamp || photo.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">IPFS Content CID:</span>
              <span className="text-slate-200 font-mono truncate block" title={photo.ipfsCID}>
                {photo.ipfsCID}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block text-[11px]">SHA-256 Digital Fingerprint:</span>
              <span className="text-brand-400 font-mono break-all text-[11px] bg-slate-950 p-1.5 rounded block border border-slate-800">
                {photo.sha256Hash}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block text-[11px]">Sepolia Transaction Hash:</span>
              <a
                href={getEtherscanTxUrl(photo.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 font-mono break-all text-[11px] flex items-center space-x-1"
              >
                <span>{photo.txHash}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-brand-500 text-navy-950 hover:brightness-110 shadow-glow transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? "Generating PDF..." : "Download Official Certificate (PDF)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
