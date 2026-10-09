const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const photoRoutes = require("./routes/photoRoutes");

const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly fallback
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});
app.use("/api/", apiLimiter);

// Serve uploads folder statically for mock IPFS previews
const uploadsDir = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsDir));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/photos", photoRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    appName: "PhotoProof API",
    timestamp: new Date().toISOString(),
    database: require("mongoose").connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Root welcome route
app.get("/", (req, res) => {
  res.json({
    name: "PhotoProof API Server",
    version: "1.0.0",
    description: "Blockchain-based photo ownership and provenance verification system",
  });
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Global Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error occurred.",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`PhotoProof Server listening on port ${PORT}`);
  console.log(`API Health: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});
