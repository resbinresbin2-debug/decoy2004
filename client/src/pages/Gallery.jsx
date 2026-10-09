import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { generateOwnershipCertificate } from "../utils/pdfGenerator";
import { formatDateTime, shortenAddress, shortenHash } from "../utils/cryptoUtils";
import { getEtherscanTxUrl } from "../contracts/contractConfig";
import CertificateModal from "../components/CertificateModal";
import TransferModal from "../components/TransferModal";
import {
  FileText,
  SendHorizontal,
  ExternalLink,
  Download,
  Calendar,
  Fingerprint,
  Search,
  Camera,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";

export default function Gallery() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhotoForCertificate, setSelectedPhotoForCertificate] = useState(null);
  const [selectedPhotoForTransfer, setSelectedPhotoForTransfer] = useState(null);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await api.get("/photos/mine");
      if (res.data?.photos) {
        setPhotos(res.data.photos);
      }
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const filteredPhotos = photos.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.sha256Hash?.toLowerCase().includes(q) ||
      p.walletAddress?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            My Registered Gallery
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse your cryptographic photo proofs, download official PDF certificates, or transfer ownership.
          </p>
        </div>

        <Link
          to="/register"
          className="self-start sm:self-auto flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-brand-500 text-navy-950 hover:brightness-110 shadow-glow transition-all active:scale-95"
        >
          <Camera className="w-4 h-4" />
          <span>Register New Photo</span>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by photo title, SHA-256 hash, or wallet address..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading your blockchain proof vault...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center space-y-4">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">No Registered Photos Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "No photos match your current search criteria."
                : "You have not registered any photos on-chain yet."}
            </p>
          </div>
          {!searchQuery && (
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-navy-950 hover:bg-brand-400"
            >
              <Camera className="w-4 h-4" />
              <span>Register Your First Photo</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => (
            <div
              key={photo._id || photo.sha256Hash}
              className="glass-card rounded-2xl border border-slate-800 overflow-hidden flex flex-col group"
            >
              {/* Photo Preview Container */}
              <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                {photo.ipfsUrl ? (
                  <img
                    src={photo.ipfsUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}

                {/* Floating Badges */}
                <div className="absolute top-3 left-3 bg-navy-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 text-[10px] font-mono text-brand-300 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>On-Chain Verified</span>
                </div>

                <a
                  href={photo.ipfsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3 p-1.5 bg-navy-950/80 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors border border-slate-700/80"
                  title="View full image on IPFS"
                >
                  <Eye className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white truncate" title={photo.title}>
                    {photo.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    By {photo.authorName || "Anonymous Creator"}
                  </p>

                  <div className="mt-3 space-y-1.5 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Timestamp:</span>
                      <span className="text-slate-200">
                        {formatDateTime(photo.blockchainTimestamp || photo.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>SHA-256:</span>
                      <span className="text-brand-400" title={photo.sha256Hash}>
                        {shortenHash(photo.sha256Hash, 5)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Owner:</span>
                      <span className="text-slate-300">
                        {shortenAddress(photo.walletAddress, 4)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Sepolia Tx:</span>
                      <a
                        href={getEtherscanTxUrl(photo.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:underline flex items-center space-x-1"
                      >
                        <span>{shortenAddress(photo.txHash, 4)}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedPhotoForCertificate(photo)}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Certificate (PDF)</span>
                  </button>

                  <button
                    onClick={() => setSelectedPhotoForTransfer(photo)}
                    className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 border border-slate-800 transition-colors"
                    title="Transfer Ownership"
                  >
                    <SendHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Modal */}
      {selectedPhotoForCertificate && (
        <CertificateModal
          photo={selectedPhotoForCertificate}
          onClose={() => setSelectedPhotoForCertificate(null)}
        />
      )}

      {/* Transfer Modal */}
      {selectedPhotoForTransfer && (
        <TransferModal
          photo={selectedPhotoForTransfer}
          onClose={() => setSelectedPhotoForTransfer(null)}
          onSuccess={() => {
            fetchPhotos();
          }}
        />
      )}
    </div>
  );
}
