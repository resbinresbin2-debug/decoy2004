import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { shortenAddress, formatDateTime } from "../utils/cryptoUtils";
import {
  User,
  Mail,
  Wallet,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { getEtherscanAddressUrl } from "../contracts/contractConfig";

export default function Profile() {
  const { user, logout, updateUserWallet } = useAuth();
  const { account, isConnected, isSepolia, connectWallet, switchToSepolia, disconnectWallet } = useWallet();
  const navigate = useNavigate();

  const [linking, setLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleLinkCurrentWallet = async () => {
    if (!account) {
      setError("Please connect your MetaMask wallet first.");
      return;
    }

    try {
      setLinking(true);
      setError(null);
      await updateUserWallet(account);
      setLinkSuccess(true);
      setTimeout(() => setLinkSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to link wallet.");
    } finally {
      setLinking(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">User Profile</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your account credentials, Google profile synchronization, and Ethereum wallet binding.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full border-2 border-brand-500/50 shadow-glow object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl font-black text-slate-300">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            {user?.googleId && (
              <div
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center p-1 border border-slate-200"
                title="Signed in with Google"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{user?.name}</h3>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Profile Info Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <User className="w-4 h-4 text-brand-400" />
              <span>Account Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans">Full Name</span>
                <span className="text-slate-200 font-bold font-sans text-sm">{user?.name}</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans">Email Address</span>
                <span className="text-slate-200 font-bold font-sans text-sm truncate block">
                  {user?.email}
                </span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 sm:col-span-2">
                <span className="text-slate-400 block text-[11px] font-sans">Authentication Provider</span>
                <span className="text-slate-300 font-sans">
                  {user?.googleId ? "Google OAuth 2.0 (Google Identity Services)" : "Standard Email & Password"}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Ethereum Wallet */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Linked Ethereum Wallet</span>
            </h3>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {error}
              </div>
            )}

            {linkSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Wallet successfully linked to your account profile!</span>
              </div>
            )}

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Account Default Wallet:</span>
                {user?.walletAddress ? (
                  <a
                    href={getEtherscanAddressUrl(user.walletAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-300 font-mono hover:underline flex items-center space-x-1"
                  >
                    <span>{shortenAddress(user.walletAddress, 6)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-500">None linked yet</span>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400">Connected in MetaMask:</span>
                {isConnected ? (
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-emerald-400">
                      {shortenAddress(account, 6)}
                    </span>
                    {isSepolia ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                        Sepolia
                      </span>
                    ) : (
                      <button
                        onClick={switchToSepolia}
                        className="text-[10px] text-amber-400 underline font-semibold"
                      >
                        Switch network
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="text-brand-400 hover:underline font-semibold"
                  >
                    Connect MetaMask
                  </button>
                )}
              </div>
            </div>

            {isConnected && account !== user?.walletAddress && (
              <button
                onClick={handleLinkCurrentWallet}
                disabled={linking}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 text-navy-950 hover:bg-brand-400 transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${linking ? "animate-spin" : ""}`} />
                <span>Set Connected MetaMask Address as Profile Default</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
