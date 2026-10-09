import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { WalletProvider } from "./context/WalletContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RegisterPhoto from "./pages/RegisterPhoto";
import Gallery from "./pages/Gallery";
import VerifyOwnership from "./pages/VerifyOwnership";
import TransferOwnership from "./pages/TransferOwnership";
import Profile from "./pages/Profile";

function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RegisterPhoto />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/gallery"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Gallery />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/verify"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <VerifyOwnership />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfer"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TransferOwnership />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </WalletProvider>
    </AuthProvider>
  );
}
