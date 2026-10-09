import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-400 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400 animate-pulse">
            Authenticating PhotoProof session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
