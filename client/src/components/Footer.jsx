import React from "react";
import { Camera, ExternalLink, ShieldCheck, Heart } from "lucide-react";
import { CONTRACT_ADDRESS, getEtherscanAddressUrl } from "../contracts/contractConfig";
import { shortenAddress } from "../utils/cryptoUtils";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-navy-950/80 py-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & tagline */}
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-brand-400" />
          </div>
          <span className="font-semibold text-slate-200">PhotoProof Protocol</span>
          <span className="text-slate-600">•</span>
          <span>Blockchain Photo Ownership & Timestamp Provenance</span>
        </div>

        {/* Links & Contract details */}
        <div className="flex items-center space-x-6">
          <a
            href={getEtherscanAddressUrl(CONTRACT_ADDRESS)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-brand-400 transition-colors font-mono"
          >
            <span>Contract: {shortenAddress(CONTRACT_ADDRESS, 4)}</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center space-x-1.5 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sepolia Active</span>
          </div>

          <span className="hidden md:inline text-slate-600">IPFS by Pinata</span>
        </div>
      </div>
    </footer>
  );
}
