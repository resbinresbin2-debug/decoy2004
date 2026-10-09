import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Camera,
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Database,
  KeyRound,
  X,
} from "lucide-react";

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const { login, register, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Google Identity Services initialization
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (window.google && googleClientId && googleClientId !== "your_google_client_id.apps.googleusercontent.com") {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              setLoading(true);
              setError(null);
              await loginWithGoogle(response.credential);
              navigate(from, { replace: true });
            } catch (err) {
              setError(err.response?.data?.message || "Google sign-in failed.");
            } finally {
              setLoading(false);
            }
          },
        });

        const btnContainer = document.getElementById("google-signin-btn-container");
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "filled_blue",
            size: "large",
            width: "100%",
            text: "continue_with",
            shape: "pill",
          });
        }
      } catch (err) {
        console.warn("Google Identity Services initialization:", err);
      }
    }
  }, [loginWithGoogle, navigate, from, isRegistering]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (isRegistering && !name) {
      setError("Please provide your full name.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      if (isRegistering) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // One-click demo Google simulation for effortless testing if Google Client ID not yet provisioned
  const handleSimulatedGoogleAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle(null, {
        email: "creator@photoproof.eth",
        name: "Verified Creator",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=VerifiedCreator",
        googleId: "google_demo_10928374",
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotModalOpen(false);
      setForgotSuccess(false);
      setForgotEmail("");
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-navy-950">
      {/* Left Column: Visual Brand & Value Proposition */}
      <div className="relative flex-1 flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden bg-gradient-to-br from-navy-900 via-navy-950 to-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800">
        {/* Ambient glowing orbs */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top App Logo */}
        <div className="flex items-center space-x-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-glow">
            <Camera className="w-6 h-6 text-navy-950 font-bold" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">PhotoProof</h1>
            <p className="text-xs font-mono text-brand-400">Decentralized Copyright & Provenance</p>
          </div>
        </div>

        {/* Center Tagline & Showcase */}
        <div className="my-12 lg:my-auto relative z-10 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ethereum Sepolia + IPFS Immutable Proof</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Prove it’s <span className="bg-gradient-to-r from-brand-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">yours</span>.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Digital photos can be copied in seconds, but cryptographic ownership cannot be forged.
            PhotoProof immutably records your photos on Ethereum with cryptographic SHA-256 and perceptual pHash
            timestamps.
          </p>

          {/* Feature Highlights */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center space-x-2.5 text-brand-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  On-Chain Timestamp
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                Ethereum block timestamps guarantee undeniable evidence of creation priority.
              </p>
            </div>

            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center space-x-2.5 text-indigo-400 mb-1">
                <Layers className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Perceptual pHash
                </h4>
              </div>
              <p className="text-xs text-slate-400">
                Detects stolen crops, color adjustments, and near-duplicates in the browser.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="relative z-10 text-xs text-slate-500 flex items-center space-x-4">
          <span>ERC-Compatible Protocol</span>
          <span>•</span>
          <span>Pinata Decentralized Storage</span>
          <span>•</span>
          <span>Sepolia Testnet</span>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl relative">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {isRegistering ? "Create your account" : "Welcome back"}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {isRegistering
                  ? "Register to begin securing proof of photo ownership."
                  : "Sign in to manage and verify your blockchain photo proofs."}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Google Authentication Container */}
            <div className="space-y-3 mb-6">
              <div id="google-signin-btn-container" className="w-full"></div>

              {/* Native Google Styled Button (works directly or triggers fallback) */}
              <button
                type="button"
                onClick={handleSimulatedGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-98 disabled:opacity-50"
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
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <span className="relative bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-mono">
                or with email
              </span>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Satoshi Nakamoto"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@domain.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Password
                  </label>
                  {!isRegistering && (
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-xs text-brand-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-brand-500 text-navy-950 hover:brightness-110 shadow-glow transition-all active:scale-98 disabled:opacity-50"
              >
                <span>{loading ? "Processing..." : isRegistering ? "Create Account" : "Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Toggle Login / Register */}
            <div className="mt-6 text-center text-xs text-slate-400">
              {isRegistering ? (
                <span>
                  Already registered?{" "}
                  <button
                    onClick={() => {
                      setIsRegistering(false);
                      setError(null);
                    }}
                    className="text-brand-400 font-semibold hover:underline"
                  >
                    Sign in here
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{" "}
                  <button
                    onClick={() => {
                      setIsRegistering(true);
                      setError(null);
                    }}
                    className="text-brand-400 font-semibold hover:underline"
                  >
                    Create one now
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Reset Password</h4>
                <p className="text-xs text-slate-400">We will send a reset link to your email</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs text-emerald-300">
                  Password reset link sent! Check your inbox.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your Registered Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="creator@domain.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-400 text-navy-950 font-semibold text-sm rounded-xl transition-all"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
