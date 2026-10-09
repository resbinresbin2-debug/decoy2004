import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { shortenAddress } from "../utils/cryptoUtils";
import {
  Camera,
  ShieldCheck,
  Image as ImageIcon,
  SendHorizontal,
  User,
  LogOut,
  Wallet,
  Menu,
  X,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { account, isConnected, isSepolia, connectWallet, switchToSepolia, isConnecting } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: ShieldCheck },
    { name: "Register Photo", path: "/register", icon: Camera },
    { name: "My Gallery", path: "/gallery", icon: ImageIcon },
    { name: "Verify Ownership", path: "/verify", icon: ShieldCheck },
    { name: "Transfer", path: "/transfer", icon: SendHorizontal },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to={isAuthenticated ? "/dashboard" : "/login"} className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5 text-navy-950 font-bold" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
                PhotoProof
              </span>
              <span className="block text-[10px] text-brand-400 font-mono tracking-wider uppercase">
                Sepolia On-Chain
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Action / Wallet / Profile */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Wallet Button */}
            {isConnected ? (
              <div className="flex items-center space-x-2">
                {!isSepolia ? (
                  <button
                    onClick={switchToSepolia}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors animate-pulse"
                    title="Click to switch to Sepolia testnet"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Switch to Sepolia</span>
                  </button>
                ) : (
                  <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-ping"></span>
                    Sepolia
                  </span>
                )}

                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span>{shortenAddress(account)}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-600 to-brand-500 text-navy-950 hover:brightness-110 shadow-glow transition-all active:scale-95 disabled:opacity-50"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnecting ? "Connecting..." : "Connect MetaMask"}</span>
              </button>
            )}

            {/* Profile Dropdown / Logout */}
            {isAuthenticated && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                  title="View Profile"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {isConnected ? (
              <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-900 rounded-lg">
                <span className="text-slate-400 font-mono">Wallet: {shortenAddress(account)}</span>
                {!isSepolia && (
                  <button
                    onClick={switchToSepolia}
                    className="text-amber-400 underline font-semibold"
                  >
                    Switch to Sepolia
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold bg-brand-500 text-navy-950"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect MetaMask</span>
              </button>
            )}

            <div className="flex items-center justify-between px-2 pt-2">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 text-sm text-slate-300"
              >
                <User className="w-4 h-4 text-brand-400" />
                <span>{user?.name} (Profile)</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:underline flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
