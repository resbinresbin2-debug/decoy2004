import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("photoproof_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("photoproof_token") || null);
  const [loading, setLoading] = useState(true);

  // Sync session on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem("photoproof_token");
      if (storedToken) {
        try {
          const res = await api.get("/auth/me");
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem("photoproof_user", JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("photoproof_token", res.data.token);
      localStorage.setItem("photoproof_user", JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("photoproof_token", res.data.token);
      localStorage.setItem("photoproof_user", JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const loginWithGoogle = async (credential, profile) => {
    const res = await api.post("/auth/google", { credential, profile });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("photoproof_token", res.data.token);
      localStorage.setItem("photoproof_user", JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const updateUserWallet = async (walletAddress) => {
    try {
      const res = await api.put("/auth/wallet", { walletAddress });
      if (res.data.success) {
        const updatedUser = { ...user, walletAddress };
        setUser(updatedUser);
        localStorage.setItem("photoproof_user", JSON.stringify(updatedUser));
      }
      return res.data;
    } catch (err) {
      console.error("Update user wallet error:", err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("photoproof_token");
    localStorage.removeItem("photoproof_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        loginWithGoogle,
        updateUserWallet,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
