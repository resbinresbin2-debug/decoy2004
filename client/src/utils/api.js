import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Bearer token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("photoproof_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if trying to login/register
      if (!window.location.pathname.includes("/login")) {
        console.warn("Session expired or unauthorized. Clearing token.");
        localStorage.removeItem("photoproof_token");
        localStorage.removeItem("photoproof_user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
