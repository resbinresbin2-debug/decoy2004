import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import api from "../utils/api";
import {
  Camera,
  ShieldCheck,
  ImageIcon,
  SendHorizontal,
  Wallet,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";
import { formatDateTime, shortenAddress, shortenHash } from "../utils/cryptoUtils";
import { getEtherscanTxUrl, getEtherscanAddressUrl, CONTRACT_ADDRESS } from "../contracts/contractConfig";

export default function Dashboard() {
  const { user } = useAuth();
  const { account, isConnected, isSepolia, connectWallet, switchToSepolia, getContract } = useWallet();

  const [stats, setStats] = useState({ totalPhotos: 0, myPhotosCount: 0 });
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onChainTotal, setOnChainTotal] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, recentRes] = await Promise.all([
          api.get("/photos/stats").catch(() => ({ data: { stats: { totalPhotos: 0, myPhotosCount: 0 } } })),
          api.get("/photos/recent?limit=5").catch(() => ({ data: { photos: [] } })),
        ]);

        if (statsRes.data?.stats) {
          setStats(statsRes.data.stats);
        }
        if (recentRes.data?.photos) {
          setRecentPhotos(recentRes.data.photos);
        }

        // Attempt on-chain contract total check
        try {
          const contract = await getContract(false);
          const total = await contract.getTotalPhotos();
          setOnChainTotal(Number(total));
        } catch (contractErr) {
          console.log("On-chain count check (offline/not deployed yet):", contractErr.message);
        }
      } catch (err) {
        console.error("Dashboard data error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [getContract]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-950 via-slate-900 to-navy-900 border border-brand-500/20 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
              <span>Blockchain Provenance Engine Online</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {user?.name || "Creator"}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Protect your creative assets with cryptographic timestamps. Every registered photo receives
              permanent on-chain copyright evidence on Ethereum Sepolia.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-brand-500 text-navy-950 hover:brightness-110 shadow-glow transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Register New Photo</span>
            </Link>
            <Link
              to="/verify"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>Verify Ownership</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Total Network Photos */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Photos Registered
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-3">
            <span className="text-3xl font-black text-white">
              {stats.totalPhotos}
            </span>
            {onChainTotal !== null && (
              <span className="text-xs text-brand-400 font-mono">
                ({onChainTotal} on-chain)
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Globally secured records across the network
          </p>
        </div>

        {/* My Photos */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              My Registered Works
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-3">
            <span className="text-3xl font-black text-white">
              {stats.myPhotosCount}
            </span>
            <Link to="/gallery" className="text-xs text-brand-400 hover:underline flex items-center">
              <span>View Gallery</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Ownership certificates issued in your name
          </p>
        </div>

        {/* Wallet Connection Status */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Wallet Connection
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isConnected
                  ? isSepolia
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            {isConnected ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isSepolia ? "bg-emerald-400" : "bg-amber-400 animate-ping"}`} />
                  <span className="text-sm font-bold text-white font-mono">
                    {shortenAddress(account, 5)}
                  </span>
                </div>
                {!isSepolia ? (
                  <button
                    onClick={switchToSepolia}
                    className="text-xs text-amber-400 hover:underline font-semibold flex items-center space-x-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Wrong network! Switch to Sepolia</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-400 block">
                    Connected to Ethereum Sepolia
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-sm text-slate-300 font-medium block">Disconnected</span>
                <button
                  onClick={connectWallet}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 underline"
                >
                  Connect MetaMask now →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Registrations Table / Grid */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Photo Registrations</h3>
            <p className="text-xs text-slate-400">Latest immutable proofs registered across the network</p>
          </div>
          <Link
            to="/gallery"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center space-x-1"
          >
            <span>My Works</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentPhotos.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-400">No photos registered yet.</p>
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-500 text-navy-950 font-semibold text-xs rounded-xl hover:bg-brand-400"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Register the First Photo</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {recentPhotos.map((photo) => (
              <div
                key={photo._id || photo.sha256Hash}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-center space-x-4 min-w-0">
                  {photo.ipfsUrl ? (
                    <img
                      src={photo.ipfsUrl}
                      alt={photo.title}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700/80 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-6 h-6 text-slate-500" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-100 truncate">{photo.title}</h4>
                    <p className="text-xs text-slate-400 flex items-center space-x-1">
                      <span>By {photo.authorName || "Creator"}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {shortenAddress(photo.walletAddress)}
                      </span>
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        SHA-256: {shortenHash(photo.sha256Hash, 4)}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(photo.blockchainTimestamp || photo.createdAt)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <a
                    href={getEtherscanTxUrl(photo.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors"
                    title="View Transaction on Sepolia Etherscan"
                  >
                    <span>Tx</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <Link
                    to={`/verify?hash=${photo.sha256Hash}`}
                    className="px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 text-xs font-semibold transition-colors"
                  >
                    Verify
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
